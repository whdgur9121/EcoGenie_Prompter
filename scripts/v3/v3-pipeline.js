// EcoGenie V3 browser runtime: Character ONNX -> Semantic INT8 ONNX -> safety.
(() => {
  'use strict';

  const CHAR_THRESHOLD = 0.995;
  const SEMANTIC_THRESHOLD = 0.99975;
  const MAX_LENGTH = 256;
  const V3_ROOT = 'scripts/v3/';

  const PREDICATE_PATTERN = /(알려|설명|분석|작성|생성|만들|추천|찾|번역|요약|확인|정리|출력|보여|비교|실행|설정|삭제|추가|바꾸|변경|검사|검토|도와|해줘|해주세요|해라|하라|해|줘|주세요|줄래|할까|인가|일까|있어|하니|나요|까|\?$)/;
  const META_PREAMBLE_PATTERN = /^(질문\s+하나\s+할게|궁금한\s+게\s+있는데|다음\s+질문에\s+답해줘|한\s+가지\s+질문할게|이것\s+좀\s+물어볼게|하나만\s+물어보고\s+싶어|먼저\s+질문\s+하나\s+할게|한\s+가지\s+궁금한\s+게\s+있어|물어보고\s+싶은\s+게\s+있는데|궁금해서\s+물어보는\s+건데)[.!?]?$/;
  const PROTECTED_CONTENT = /```[\s\S]*?```|`[^`]+`|https?:\/\/\S+|\{[\s\S]*?\}/;

  function runtimeUrl(relative) {
    return chrome.runtime.getURL(`${V3_ROOT}${relative}`);
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
  }

  async function fetchBytes(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }

  function int64Tensor(values, dims) {
    return new ort.Tensor(
      'int64', BigInt64Array.from(values, value => BigInt(value)), dims,
    );
  }

  function deleteProbability(logit0, logit1) {
    const maximum = Math.max(logit0, logit1);
    const a = Math.exp(logit0 - maximum);
    const b = Math.exp(logit1 - maximum);
    return a / (a + b);
  }

  function isWhitespace(character) {
    return /\s/u.test(character);
  }

  function isControl(character) {
    return /\p{Cc}|\p{Cf}/u.test(character)
      && character !== '\t' && character !== '\n' && character !== '\r';
  }

  function isChinese(character) {
    const code = character.codePointAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF)
      || (code >= 0x3400 && code <= 0x4DBF)
      || (code >= 0x20000 && code <= 0x2A6DF)
      || (code >= 0x2A700 && code <= 0x2B73F)
      || (code >= 0x2B740 && code <= 0x2B81F)
      || (code >= 0x2B820 && code <= 0x2CEAF)
      || (code >= 0xF900 && code <= 0xFAFF)
      || (code >= 0x2F800 && code <= 0x2FA1F);
  }

  function isPunctuation(character) {
    const code = character.codePointAt(0);
    return (code >= 33 && code <= 47)
      || (code >= 58 && code <= 64)
      || (code >= 91 && code <= 96)
      || (code >= 123 && code <= 126)
      || /\p{P}/u.test(character);
  }

  class KlueWordPieceTokenizer {
    constructor(tokenizerJson) {
      this.vocab = new Map(Object.entries(tokenizerJson.model.vocab));
      this.unkId = this.vocab.get('[UNK]');
      this.clsId = this.vocab.get('[CLS]');
      this.sepId = this.vocab.get('[SEP]');
      this.maxInputCharacters = tokenizerJson.model.max_input_chars_per_word || 100;
      this.prefix = tokenizerJson.model.continuing_subword_prefix || '##';
    }

    normalize(text) {
      let output = '';
      for (const character of Array.from(text)) {
        const code = character.codePointAt(0);
        if (code === 0 || code === 0xFFFD || isControl(character)) continue;
        if (isWhitespace(character)) {
          output += ' ';
        } else if (isChinese(character)) {
          output += ` ${character} `;
        } else {
          output += character;
        }
      }
      return output;
    }

    preTokenize(text) {
      const pieces = [];
      let current = '';
      const flush = () => {
        if (current) pieces.push(current);
        current = '';
      };
      for (const character of Array.from(this.normalize(text))) {
        if (isWhitespace(character)) {
          flush();
        } else if (isPunctuation(character)) {
          flush();
          pieces.push(character);
        } else {
          current += character;
        }
      }
      flush();
      return pieces;
    }

    wordPiece(token) {
      const characters = Array.from(token);
      if (characters.length > this.maxInputCharacters) return [this.unkId];
      const ids = [];
      let start = 0;
      while (start < characters.length) {
        let end = characters.length;
        let selected = null;
        while (start < end) {
          let candidate = characters.slice(start, end).join('');
          if (start > 0) candidate = this.prefix + candidate;
          if (this.vocab.has(candidate)) {
            selected = this.vocab.get(candidate);
            break;
          }
          end -= 1;
        }
        if (selected === null) return [this.unkId];
        ids.push(selected);
        start = end;
      }
      return ids;
    }

    encodePreSplit(words, maxLength = MAX_LENGTH) {
      const contentIds = [];
      const contentWordIds = [];
      words.forEach((word, wordId) => {
        for (const token of this.preTokenize(word)) {
          for (const id of this.wordPiece(token)) {
            contentIds.push(id);
            contentWordIds.push(wordId);
          }
        }
      });
      const available = Math.max(0, maxLength - 2);
      const ids = [this.clsId, ...contentIds.slice(0, available), this.sepId];
      const wordIds = [null, ...contentWordIds.slice(0, available), null];
      return {
        inputIds: ids,
        attentionMask: Array(ids.length).fill(1),
        tokenTypeIds: Array(ids.length).fill(0),
        wordIds,
      };
    }
  }

  function clauseGroups(words) {
    const groups = [];
    let current = [];
    words.forEach((word, index) => {
      current.push(index);
      if (/[.!?]$/.test(word)) {
        groups.push(current);
        current = [];
      }
    });
    if (current.length) groups.push(current);
    return groups;
  }

  function applySafety(words, rawFlags) {
    let flags = [...rawFlags];
    const actions = [];
    for (const group of clauseGroups(words)) {
      if (group.length && group.every(index => flags[index])) {
        const clause = group.map(index => words[index]).join(' ');
        if (!META_PREAMBLE_PATTERN.test(clause.trim())) {
          group.forEach(index => { flags[index] = false; });
          actions.push({ rule: 'MEANINGFUL_CLAUSE_PRESERVATION', action: 'RESTORE_CLAUSE', text: clause });
        }
      }
    }
    const predicates = words
      .map((word, index) => (PREDICATE_PATTERN.test(word) ? index : null))
      .filter(index => index !== null);
    if (predicates.length && !predicates.some(index => !flags[index])) {
      return {
        flags: Array(words.length).fill(false),
        actions: [...actions, { rule: 'CORE_PREDICATE_PRESERVATION', action: 'CANCEL_ALL_DELETIONS' }],
      };
    }
    const kept = flags.map((deleted, index) => (!deleted ? index : null))
      .filter(index => index !== null);
    if (!kept.length || (words.length > 1 && kept.length === 1
      && PREDICATE_PATTERN.test(words[kept[0]]))) {
      return {
        flags: Array(words.length).fill(false),
        actions: [...actions, { rule: 'MINIMUM_CORE_REQUEST', action: 'CANCEL_ALL_DELETIONS' }],
      };
    }
    return { flags, actions };
  }

  function wordMatches(text) {
    return [...text.matchAll(/\S+/gu)].map(match => ({
      word: match[0], start: match.index, end: match.index + match[0].length,
    }));
  }

  function deleteWordSpans(text, matches, flags) {
    let intermediate = '';
    let cursor = 0;
    matches.forEach((match, index) => {
      if (flags[index]) {
        intermediate += text.slice(cursor, match.start);
        cursor = match.end;
      }
    });
    intermediate += text.slice(cursor);
    const output = [];
    for (const character of Array.from(intermediate)) {
      if (isWhitespace(character)
        && (!output.length || isWhitespace(output[output.length - 1]))) continue;
      output.push(character);
    }
    while (output.length && isWhitespace(output[output.length - 1])) output.pop();
    return output.join('');
  }

  function isSubsequence(target, source) {
    const sourceCharacters = Array.from(source);
    let sourceIndex = 0;
    for (const targetCharacter of Array.from(target)) {
      while (sourceIndex < sourceCharacters.length
        && sourceCharacters[sourceIndex] !== targetCharacter) sourceIndex += 1;
      if (sourceIndex >= sourceCharacters.length) return false;
      sourceIndex += 1;
    }
    return true;
  }

  class EcoV3Pipeline {
    constructor(legacyPipeline) {
      this.legacyPipeline = legacyPipeline;
      this.isReady = false;
      this.initPromise = null;
      this.lastResult = null;
    }

    async init() {
      if (this.initPromise) return this.initPromise;
      this.initPromise = this.initializeModels();
      return this.initPromise;
    }

    async initializeModels() {
      try {
        if (!globalThis.ort) throw new Error('onnxruntime-web was not loaded');
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
        ort.env.wasm.proxy = false;
        ort.env.wasm.wasmPaths = {
          'ort-wasm-simd-threaded.wasm': runtimeUrl('ort-wasm-simd-threaded.wasm'),
        };
        const [characterBytes, semanticBytes, characterVocab, tokenizerJson] = await Promise.all([
          fetchBytes(runtimeUrl('character_model.onnx')),
          fetchBytes(runtimeUrl('semantic_model.onnx')),
          fetchJson(runtimeUrl('character_vocab.json')),
          fetchJson(runtimeUrl('tokenizer.json')),
        ]);
        this.characterVocab = characterVocab;
        this.characterUnk = characterVocab['[UNK]'];
        this.tokenizer = new KlueWordPieceTokenizer(tokenizerJson);
        this.characterSession = await ort.InferenceSession.create(characterBytes, {
          executionProviders: ['wasm'], graphOptimizationLevel: 'all',
        });
        this.semanticSession = await ort.InferenceSession.create(semanticBytes, {
          executionProviders: ['wasm'], graphOptimizationLevel: 'all',
        });
        this.isReady = true;
        console.log('🌱 EcoGenie V3: Character + Semantic INT8 WASM 로드 완료');
      } catch (error) {
        this.isReady = false;
        console.error('🌱 EcoGenie V3 초기화 실패. 원문 보존 모드로 작동합니다.', error);
      }
    }

    async characterPredict(text) {
      const characters = Array.from(text);
      const ids = characters.map(character => (
        Object.prototype.hasOwnProperty.call(this.characterVocab, character)
          ? this.characterVocab[character] : this.characterUnk
      ));
      const result = await this.characterSession.run({
        input_ids: int64Tensor(ids, [1, ids.length]),
      });
      const logits = result.logits.data;
      const flags = characters.map((_, index) => (
        deleteProbability(logits[index * 2], logits[index * 2 + 1]) >= CHAR_THRESHOLD
      ));
      return {
        output: characters.filter((_, index) => !flags[index]).join(''),
        deletedCharacters: flags.filter(Boolean).length,
      };
    }

    async semanticPredict(text) {
      const matches = wordMatches(text);
      const words = matches.map(match => match.word);
      if (!words.length) return { output: text, deletedWords: [], actions: [], truncated: false };
      const encoding = this.tokenizer.encodePreSplit(words, MAX_LENGTH);
      const length = encoding.inputIds.length;
      const result = await this.semanticSession.run({
        input_ids: int64Tensor(encoding.inputIds, [1, length]),
        attention_mask: int64Tensor(encoding.attentionMask, [1, length]),
        token_type_ids: int64Tensor(encoding.tokenTypeIds, [1, length]),
      });
      const logits = result.logits.data;
      const probabilities = Array(words.length).fill(null);
      const seen = new Set();
      encoding.wordIds.forEach((wordId, position) => {
        if (wordId === null || seen.has(wordId)) return;
        seen.add(wordId);
        probabilities[wordId] = deleteProbability(
          logits[position * 2], logits[position * 2 + 1],
        );
      });
      const rawFlags = probabilities.map(value => value !== null && value >= SEMANTIC_THRESHOLD);
      const safe = applySafety(words, rawFlags);
      let output = deleteWordSpans(text, matches, safe.flags);
      if (!isSubsequence(output, text)) {
        output = text;
        safe.flags = Array(words.length).fill(false);
        safe.actions.push({ rule: 'SUBSEQUENCE_VERIFICATION', action: 'RETURN_CHARACTER_INPUT' });
      }
      return {
        output,
        deletedWords: words.filter((_, index) => safe.flags[index]),
        actions: safe.actions,
        truncated: seen.size < words.length,
      };
    }

    async optimize(rawText) {
      const original = String(rawText ?? '');
      if (!original.trim()) return '';
      if (!this.isReady) {
        await this.init();
        if (!this.isReady) return original;
      }
      // Code, URLs and JSON are returned unchanged until protected-span V3 is
      // separately trained and verified. This is deliberately conservative.
      if (PROTECTED_CONTENT.test(original)) {
        this.lastResult = { original, final: original, fallback: 'PROTECTED_CONTENT' };
        return original;
      }
      try {
        const character = await this.characterPredict(original);
        const semantic = await this.semanticPredict(character.output);
        let final = semantic.output;
        let fallback = null;
        if (!final.trim() || !isSubsequence(final, character.output)
          || !isSubsequence(final, original)) {
          final = character.output;
          fallback = 'RETURN_CHARACTER_OUTPUT';
        }
        this.lastResult = { original, character: character.output,
          semantic: semantic.output, final, semanticActions: semantic.actions,
          deletedWords: semantic.deletedWords, fallback };
        return final;
      } catch (error) {
        console.error('🌱 EcoGenie V3 추론 실패. 원문을 유지합니다.', error);
        this.lastResult = { original, final: original, fallback: 'INFERENCE_ERROR' };
        return original;
      }
    }

    getSystemPrompt() {
      return this.legacyPipeline?.getSystemPrompt?.()
        || '\n\n[Sys: No fluff. Markdown only.]';
    }

    getLastResult() {
      return this.lastResult;
    }
  }

  // Exposed only for deterministic development tests; the extension UI uses
  // window.ecoPipeline below.
  window.EcoV3Internals = { KlueWordPieceTokenizer, applySafety, isSubsequence };
  const legacyPipeline = window.ecoPipeline || null;
  window.ecoPipelineV2 = legacyPipeline;
  window.ecoPipeline = new EcoV3Pipeline(legacyPipeline);
})();
