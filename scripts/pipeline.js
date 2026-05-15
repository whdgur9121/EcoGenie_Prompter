// ==========================================
// 1. 에코 파이프라인 클래스
// ==========================================
const OUTPUT_SAVING_RATIO = 0.0901; // 마크다운 강제 적용 시 출력 토큰 평균 절감률
const TEMPLATE_TEXT = "역할 :\n작업 :\n";

class EcoPromptPipeline {
  constructor() {
    this.analyzer = null;
    this.isReady = false;
    
    // [Fallback 정규식 규칙] 
    // WASM 엔진 로드 실패 시 작동하는 우회용 정규식 필터입니다. 
    // 정규식의 한계(문맥 파악 불가)를 고려하여 의미가 변질되지 않는 확실한 군더더기만 제거합니다.
    this.fallbackRules = [
      { regex: /\b(안녕(하세요)?|반가워|다름이 아니라|저기(요)?|혹시(라도)?|바쁘지 않다면|시간 괜찮으면|질문(이)? (있는데요|있어)|궁금한 게 (있어|있는데))\b\s*/g, replace: "" },
      { regex: /(미리 고마워|수고해|부탁(해|드립니다|합니다|할게)|잘 부탁해|도와줘서 고마워|감사합니다|땡큐)/g, replace: "" },
      { regex: /\b(빨랑|얼른|언능|당장|빨기빨리|급하게|후딱)\b\s*/g, replace: "" },
      { regex: /\b(진짜|정말|매우|아주|몹시|되게|무척|엄청|굉장히|너무|완전|약간|좀|조금|존나|개|짱|핵|무지)\b\s*/g, replace: "" },
      { regex: /\b(솔직히|일단|먼저|우선|아무튼|그냥|걍|어차피|사실|대충|막)\b\s*/g, replace: "" },
      { regex: /\b(어|음|아|참|그니까|에구|쓰읍|아니 근데|저기요)\b\s+/g, replace: "" },
      { regex: /(을|를)\s+(분석|요약|번역|작성|설명|추출|정리|비교)/g, replace: " $2" },
      { regex: /(해 주시기 바랍니다|해 주시면 감사하겠습니다|해주실 수 있나요\?|해주시겠어요\?)/g, replace: " 해." },
      { regex: /(인 것 같(습니다|아)|라고 생각합(니다|니다))/g, replace: "임." },
      { regex: /(입|습)니다(\.)?/g, replace: " 임." },
      { regex: /(해줄 수 있(니|을까)\?|알려(줘|주세요))/g, replace: " 해." },
      { regex: /^\s*[.,!?]+/g, replace: "" },
      { regex: /\s+[.,!?]+/g, replace: " " },
      { regex: /[?!]{2,}/g, replace: "?" },
      { regex: /\.{2,}/g, replace: "." },
      { regex: / {2,}/g, replace: " " }
    ];
  }

  // WASM 기반 Garu 형태소 분석기 비동기 초기화
  async init() {
    try {
      const garuJsUrl = chrome.runtime.getURL('scripts/garu_wasm.js'); 
      const wasmUrl = chrome.runtime.getURL('scripts/garu_wasm_bg.wasm');
      const modelUrl = chrome.runtime.getURL('scripts/base.gmdl');
      const cnnUrl = chrome.runtime.getURL('scripts/cnn2.bin');

      const GaruModule = await import(garuJsUrl);
      
      // 메모리에 WASM 코어 바인딩
      await GaruModule.default({ module_or_path: wasmUrl });

      // 형태소 분석용 사전 및 CNN 모델 바이너리 로드
      const [modelResponse, cnnResponse] = await Promise.all([
          fetch(modelUrl),
          fetch(cnnUrl)
      ]);
      const modelData = new Uint8Array(await modelResponse.arrayBuffer());
      const cnnData = new Uint8Array(await cnnResponse.arrayBuffer());

      this.analyzer = new GaruModule.GaruWasm(modelData, cnnData);
      this.isReady = true;
      console.log("🌱 EcoGenie: Garu 형태소 분석기 (WASM + 사전) 로드 완벽 성공!");
    } catch (e) {
      console.error("🌱 EcoGenie: Garu 초기화 실패, 정규식 모드로 작동합니다:", e);
    }
  }

  // [메인 로직] 입력 프롬프트 최적화 (토큰 다이어트)
  async optimize(rawText) {
    if (!rawText) return "";
    if (typeof rawText !== 'string') rawText = String(rawText || "");
    if (!rawText.trim()) return "";
    
    if (!this.isReady || !this.analyzer) return this.fallbackOptimize(rawText);

    try {
      let processedText = rawText;

      // --- [1단계: 쉴드 전개 (보호 레이어)] ---
      // 코드 스니펫(```), URL, JSON 데이터 내부의 텍스트가 형태소 분석기에 의해 찢어지는 것을 막기 위해 
      // 해당 부분들을 임시 문자열(__PROTECTED_n__)로 치환하여 보관합니다.
      const placeholders = [];
      let pIndex = 0;
      const shieldRegexes = [
        /```[\s\S]*?```/g,    // 다중 줄 코드 블록 보호
        /`[^`]+`/g,           // 인라인 코드 보호
        /https?:\/\/[^\s]+/g, // URL 링크 보호
        /\{[\s\S]*?\}/g       // JSON 구조 보호
      ];
      shieldRegexes.forEach(regex => {
        processedText = processedText.replace(regex, (match) => {
          const token = `__PROTECTED_${pIndex++}__`;
          placeholders.push({ token, match });
          return token;
        });
      });

      // --- [2단계: 구절 단위 고효율 압축 (Phrase-level Compression)] ---
      // 형태소 단위로 쪼개기 전, 관습적으로 자주 쓰이는 긴 인삿말/요청문을 한 번에 날립니다.
      const phraseRules = [
        { regex: /\b(안녕(하세요)?|반가워|다름이 아니라|저기(요)?|혹시(라도)?|궁금한 게 있어(요|운데|는데)?)\b\s*/g, replace: "" },
        { regex: /(해 주시기 바랍니다|해 주시면 감사하겠습니다|해 주세요|해 주시겠어요|해 줄 수 있나요)\?/g, replace: "해." },
        { regex: /(할 수 있나요|할 수 있을까요|가능한가요)\?/g, replace: "가능?" },
        { regex: /(좋겠습니다|좋겠어요|바랍니다)/g, replace: "좋음" },
        { regex: /(부탁드립니다|부탁합니다|부탁해)/g, replace: "요청" },
        { regex: /(감사합니다|고맙습니다|땡큐)/g, replace: "" }
      ];
      phraseRules.forEach(rule => {
        processedText = processedText.replace(rule.regex, rule.replace);
      });

      // 마크다운 문단 구조를 보존하기 위해 줄 단위로 분리하여 처리
      const lines = processedText.split('\n');
      let optimizedLines = [];

      // [핵심 필터링 대상 설정]
      // 감탄사(IC)는 무조건 제거, 부사(MAG)는 아래에 명시된 '거품 부사'만 선택적으로 제거합니다.
      // (예: '반드시', '이미' 같은 논리 부사는 보존하여 AI의 명령 수행력 유지)
      const blockPos = new Set(['IC']); 
      const blockMAG = new Set(["진짜", "정말", "매우", "아주", "몹시", "되게", "무척", "엄청", "굉장히", "너무", "완전", "정말로"]);

      for (const line of lines) {
        if (!line.trim()) {
          optimizedLines.push(""); 
          continue;
        }

        const analyzeResult = this.analyzer.analyze(line); 
        let parsedData;
        try {
          parsedData = typeof analyzeResult === 'string' ? JSON.parse(analyzeResult) : analyzeResult;
        } catch (e) {
          optimizedLines.push(line);
          continue;
        }

        let morphs = parsedData.tokens ? parsedData.tokens : parsedData;
        if (!Array.isArray(morphs)) {
          optimizedLines.push(line);
          continue;
        }

        let lineStr = "";
        for (const morph of morphs) {
          const word = morph.text; 
          const pos = morph.pos;  
          if (!word || !pos) continue;

          // 거품 품사 및 단어 필터링
          if (blockPos.has(pos)) continue; 
          if (pos === 'MAG' && blockMAG.has(word)) continue; 

          // 기호(S)는 붙여쓰기 대상에서 제외하여 공백 오염 예방
          const attachToPrev = pos.startsWith('J') || pos.startsWith('E') || pos.startsWith('X') || pos.startsWith('VC');
          const isUnderscore = word.includes('_');

          // [어절 재구성 (Sub-word 토큰 최적화)]
          // 조사(J), 어미(E), 접사(X), 지정사(VC)는 띄어쓰기 없이 앞 단어에 결합시킵니다.
          // 이는 LLM 토크나이저가 파편화된 토큰을 읽어들이는 것을 막아 압축률을 방어합니다.
          if (lineStr === "" || (attachToPrev && !isUnderscore)) {
            lineStr += word;
          } else {
            lineStr += " " + word;
          }
        }

        // 형태소 분석기가 보호 토큰(__PROTECTED_0__)의 언더바(_)를 띄어쓰기로 분리하는 버그 복원
        lineStr = lineStr.replace(/_+\s*PROTECTED\s*_\s*(\d+)\s*_+/g, "__PROTECTED_$1__");
        optimizedLines.push(lineStr.trim());
      }

      // 연속된 다중 줄바꿈 처리 및 기미니 입력 버그 방지
      let cleanedText = optimizedLines.join("\n").replace(/\n{3,}/g, "\n\n");

      // --- [3.5단계: 자소 결합오류 후처리 보정] ---
      // 어미나 접사가 앞 단어에 강제로 붙으면서 한국어 문법이 어색해지는 현상(예: 이 ㄴ -> 인)을 보정
      const postFixRules = [
        { regex: /하(아|어|여)/g, replace: "해" },
        { regex: /이\s*ㄴ/g, replace: "인" },
        { regex: /하\s*ㄴ/g, replace: "한" },
        { regex: /만들\s*ㄹ/g, replace: "만들" }
      ];
      postFixRules.forEach(rule => {
        cleanedText = cleanedText.replace(rule.regex, rule.replace);
      });

      // --- [4단계: 쉴드 해제 (원본 데이터 원복)] ---
      // 최적화가 끝난 후, 숨겨두었던 코드 블록과 URL을 원래 위치로 복원합니다.
      placeholders.forEach(p => {
        cleanedText = cleanedText.replace(p.token, p.match);
      });

      return cleanedText.trim();
      
    } catch (e) {
      console.error("최적화 실패:", e);
      return this.fallbackOptimize(rawText);
    }
  }

  // WASM 미동작 시 호출되는 대체 함수
  fallbackOptimize(rawText) {
    try {
      let text = String(rawText);
      const lines = text.split('\n');
      const cleanedLines = lines.map(line => {
        if (!line.trim()) return "";
        return this.fallbackRules.reduce((currentText, rule) => {
          return currentText.replace(rule.regex, rule.replace);
        }, line).trim();
      });
      return cleanedLines.join('\n') || text;
    } catch (e) {
      return String(rawText);
    }
  }

  getSystemPrompt() {
    return "\n\n[Sys: No fluff. Markdown only.]";
  }
}

const ecoPipeline = new EcoPromptPipeline();
window.ecoPipeline = ecoPipeline;

// 실제 GPT/Gemini와 동일한 tiktoken 기반 토큰 계측 (tokenizer.bundle.js 참조)
window.estimateTokens = function(text) {
  if (!text) return 0;
  if (window.EcoTokenizer && window.EcoTokenizer.countTokens) {
    try {
      return window.EcoTokenizer.countTokens(text);
    } catch (e) {
      console.error("번들 토크나이저 계측 실패:", e);
    }
  }
  return Math.ceil(text.length * 1.2);
}