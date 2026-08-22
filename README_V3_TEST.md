# EcoGenie Prompter V3 시험판

## 포함 모델

- Character FP32 ONNX (`threshold=0.995`)
- Semantic KLUE RoBERTa Base per-channel INT8 ONNX (`threshold=0.999750`)
- ONNX Runtime Web WASM
- 브라우저용 KLUE WordPiece tokenizer

## 설치

1. ZIP을 별도 폴더에 압축 해제합니다.
2. Chrome에서 `chrome://extensions`를 엽니다.
3. 우측 상단의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
5. `manifest.json`이 있는 폴더를 선택합니다.
6. ChatGPT 또는 Gemini 페이지를 새로고침합니다.

## 최초 로딩

Semantic 모델이 약 178 MiB이므로 최초 페이지 로딩 시 수 초가 걸릴 수 있습니다.
개발자 도구 Console에서 아래 문구가 나타나면 준비가 완료된 것입니다.

```text
🌱 EcoGenie V3: Character + Semantic INT8 WASM 로드 완료
```

## 대표 시험 문장

```text
질문 하나 할게. 자연살해세포에 대해 좀 알려줘
```

예상 결과:

```text
자연살해세포에 대해 알려줘
```

```text
결과를 정확히 3개만 JSON 형식으로 출력해주세요.
```

예상 결과:

```text
결과 정확히 3개만 JSON 형식으로 출력해주세요.
```

## 안전 정책

- 원문에 없는 문자를 생성하거나 표현을 교체하지 않습니다.
- 최종 결과는 Character 결과와 원문의 부분수열이어야 합니다.
- 핵심 서술어와 최소 핵심 요청을 보존합니다.
- 의미 있는 절 전체 삭제를 방지합니다.
- 코드 블록, 인라인 코드, URL 또는 JSON이 포함된 입력은 현재 원문을 그대로 반환합니다.
- 초기화나 추론 오류가 발생하면 원문을 그대로 반환합니다.

## 개발 검증 결과

- Python PyTorch ↔ Python ONNX: 813/813 일치
- Python ONNX ↔ ONNX Runtime Web WASM 임계값 판정: 813/813 일치
- JavaScript 안전장치 적용 최종문: 813/813 일치
- 브라우저 WordPiece tokenizer: 813/813 토큰 ID 및 word ID 일치
- WASM 평균 Character+Semantic 추론: 약 68.61 ms (시험 환경 기준)

