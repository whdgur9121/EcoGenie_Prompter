# 🌱 EcoGenie Prompter V3

EcoGenie Prompter는 ChatGPT와 Gemini에 입력하는 한국어 프롬프트에서 불필요한 글자와 표현을 **삭제만으로** 줄이는 친환경 ESG Chrome 확장 프로그램입니다.

사용자의 프롬프트는 외부 최적화 서버로 전송되지 않습니다. Character 모델과 Semantic 모델, 토크나이저 및 안전장치가 모두 브라우저 로컬 환경에서 실행됩니다.

- 소속: LG전자 ESG 대학생 아카데미 12기
- 개발자: 강종혁 (인하대학교 컴퓨터공학과)

## EcoGenie V3의 핵심 원칙

- 원문에 없는 문자를 추가하지 않습니다.
- 기존 표현을 다른 표현으로 교체하지 않습니다.
- 조건·부정·수량·범위·순서·비교·출력 형식을 보존합니다.
- 핵심 서술어와 최소 핵심 요청을 유지합니다.
- 최종문이 Character 결과 및 원문의 부분수열인지 검증합니다.
- 안전성을 확인할 수 없거나 추론에 실패하면 원문을 유지합니다.

## 처리 구조

```text
원문
  → Character FP32 ONNX (문자별 DELETE/KEEP, threshold 0.995)
  → Semantic INT8 ONNX (단어별 DELETE/KEEP, threshold 0.999750)
  → 문맥 안전장치
  → 부분수열 검증
  → 최종 압축문
```

### Character 모델

Embedding + BiGRU 기반 문자 분류 모델입니다. 불필요한 조사와 문자 단위 요소를 보수적으로 삭제합니다.

### Semantic 모델

`klue/roberta-base`를 EcoGenie 데이터로 미세 조정한 문맥 분류 모델입니다. 대화형 서두와 `좀` 같은 문맥상 불필요한 단어를 삭제합니다. 배포 모델은 브라우저 실행을 위해 채널별 INT8로 양자화했습니다.

### 안전장치

- 의미 있는 절 전체 삭제 방지
- 핵심 서술어 삭제 시 Semantic 삭제 취소
- 핵심 동사만 남는 결과 방지
- 최소 핵심 요청 유지
- 원문 및 Character 결과의 부분수열 검증
- 코드 블록·인라인 코드·URL·JSON 포함 입력은 현재 원문 유지

## 주요 기능

- Character + Semantic 문맥 기반 프롬프트 최적화
- ChatGPT 및 Gemini 입력창 자동 반영
- 절감 토큰 기반 ESG 지표 대시보드
- 선택 가능한 Markdown 출력 유도 시스템 프롬프트
- 역할·작업 템플릿과 프롬프트 작성 가이드
- 모든 모델 추론과 토큰 계산의 브라우저 로컬 처리

## 검증 결과

| 검증 | 결과 |
|---|---:|
| PyTorch V3 ↔ Python ONNX | 813/813 일치 |
| Python ONNX ↔ ONNX Runtime Web 임계값 판정 | 813/813 일치 |
| JavaScript 안전장치 적용 최종문 | 813/813 일치 |
| Python ↔ 브라우저 WordPiece Token ID / Word ID | 813/813 일치 |
| ONNX V3 삭제 전용 통과율 | 100% |
| 브라우저 WASM 평균 통합 추론 | 약 68.61 ms |

채널별 INT8 모델은 FP32와 809/813문장에서 동일했습니다. 다른 4문장은 모두 `좀`을 삭제하지 않은 보수적 과소 삭제였으며 위험한 추가 삭제는 없었습니다.

## 기술 스택

- Chrome Extension Manifest V3
- JavaScript / HTML / CSS
- ONNX Runtime Web 1.27.0
- WebAssembly (WASM)
- PyTorch
- KLUE RoBERTa Base
- Character BiGRU
- KLUE WordPiece tokenizer
- Chrome Local Storage

## 주요 파일

```text
manifest.json
scripts/
├─ pipeline.js                 # 기존 Garu V2 파이프라인(보존)
├─ app.js                      # UI 이벤트, ChatGPT/Gemini 입력 및 전송
├─ ui.js                       # 사이드바 및 ESG 대시보드
└─ v3/
   ├─ v3-pipeline.js           # V3 토크나이저·ONNX 추론·안전장치
   ├─ character_model.onnx
   ├─ character_vocab.json
   ├─ semantic_model.onnx      # Git LFS
   ├─ tokenizer.json
   ├─ ort.min.js
   └─ ort-wasm-*.wasm/mjs
```

## 로컬 설치

1. 저장소를 복제합니다.
2. Git LFS 모델을 내려받습니다: `git lfs pull`
3. Chrome에서 `chrome://extensions`를 엽니다.
4. 개발자 모드를 활성화합니다.
5. **압축해제된 확장 프로그램을 로드합니다**를 선택합니다.
6. 이 저장소의 `manifest.json`이 있는 폴더를 선택합니다.
7. ChatGPT 또는 Gemini를 새로고침합니다.

Console에 아래 문구가 표시되면 V3 모델이 준비된 것입니다.

```text
🌱 EcoGenie V3: Character + Semantic INT8 WASM 로드 완료
```

## 개인정보 보호

- 프롬프트 및 개인정보를 개발자 서버로 전송하거나 수집하지 않습니다.
- 절약 토큰과 ESG 통계는 Chrome Local Storage에만 저장합니다.
- 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 확인하세요.

## 오픈소스 및 라이선스

- KLUE RoBERTa: [KLUE Benchmark](https://github.com/KLUE-benchmark/KLUE)
- ONNX Runtime: [Microsoft ONNX Runtime](https://github.com/microsoft/onnxruntime)
- 기존 V2 형태소 엔진: [Garu](https://github.com/hyeonsangjeon/garu)

프로젝트 라이선스는 [LICENSE](LICENSE)를 확인하세요.

---

- Contact: whdgur9121@inha.edu
- University: Inha University, Computer Science & Engineering
