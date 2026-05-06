// ==========================================
// 1. 에코 파이프라인 클래스 (텍스트 최적화 모듈 V2.0)
// ==========================================
const OUTPUT_SAVING_RATIO = 0.0901;
const TEMPLATE_TEXT = "역할 :\n작업 :\n";

class EcoPromptPipeline {
  constructor() {
    this.rules = [
      { name: "IntroOut", regex: /(안녕(하세요)?|다름이 아니라|질문이 (있는데요|있어)|궁금한 게 있어|저기요|바쁘지 않다면|하나만 물어볼게|혹시)/g, replace: "" },
      { name: "OutroOut", regex: /(미리 고마워|수고해|기다릴게|부탁(해|합니다|드립니다|할게)|감사합니다)/g, replace: "" },
      { name: "CushionWordsOut", regex: /\b(솔직히|일단|먼저|우선|아무튼|그냥|어차피|사실|대충|빨리|급한데|간단히|간단하게)\b\s*/g, replace: "" },
      { name: "AdverbOut", regex: /\b(진짜|정말|매우|아주|몹시|되게|무척|엄청|굉장히|너무|완전|약간|좀|조금)\b\s*/g, replace: "" },
      { name: "InstructExplain", regex: /(에 대(해서|해) 설명(해 줘|해줄래|해주세요)|설명 부탁해)/g, replace: " 설명:" },
      { name: "InstructHowTo", regex: /(하는 방법(을)? (알려줘|설명해줘)|어떻게 (해|해야 돼|해야 해|하는 거야)\?)/g, replace: " 방법:" },
      { name: "InstructFix", regex: /(해결(하는)? 방법 알려줘|어떻게 고쳐\?|에러(가)? (났어|발생했어))/g, replace: " 해결책:" },
      { name: "DropPostposition", regex: /(을|를)\s+(분석|요약|번역|작성|설명|추출|정리|비교)/g, replace: " $2" },
      { name: "EndingCompress1", regex: /(해 주시기 바랍니다|해 주시면 감사하겠습니다|해주실 수 있나요\?|해주시겠어요\?)/g, replace: "바람." },
      { name: "EndingCompress2", regex: /(인 것 같(습니다|아)|라고 생각합(니다|니다))/g, replace: "임." },
      { name: "EndingCompress3", regex: /(해줄 수 있(니|을까)\?|알려(줘|주세요))/g, replace: "해." },
      { name: "EndingCompress4", regex: /(입|습)니다(\.)?/g, replace: "임." },
      { name: "VocabReplace1", regex: /(알아보기 쉽게|이해하기 편하게)/g, replace: "직관적" },
      { name: "VocabReplace2", regex: /(추가적으로|그리고 또)/g, replace: "또한" },
      { name: "StopwordsOut", regex: /\b(어|음|아|참|그니까|저기|에구)\b\s+/g, replace: "" },
      { name: "PunctuationClean1", regex: /^\s*[.,!?]+/g, replace: "" },
      { name: "PunctuationClean2", regex: /\s+[.,!?]+/g, replace: " " },
      { name: "PunctuationClean3", regex: /\.{2,}/g, replace: "." },
      { name: "WhitespaceClean", regex: / {2,}/g, replace: " " }
    ];
  }

  optimize(rawText) {
    let cleanedText = this.rules.reduce((currentText, rule) => {
      return currentText.replace(rule.regex, rule.replace);
    }, rawText);
    return cleanedText.trim();
  }

  getSystemPrompt() {
    return "\n\n[Sys: No fluff. Markdown only.]";
  }
}

const ecoPipeline = new EcoPromptPipeline();

// 실제 토크나이저 연동 및 폴백 처리
function estimateTokens(text) {
  if (window.EcoTokenizer && window.EcoTokenizer.countTokens) {
    return window.EcoTokenizer.countTokens(text);
  }
  return Math.ceil(text.length * 1.2);
}