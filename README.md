# 🌱 EcoGenie Prompter (에코지니 프롬프터)

"지속 가능한 생성형 AI 프롬프트" **EcoGenie Prompter**는 생성형 AI 대화 과정에서 발생하는 불필요한 토큰 소모를 감소시켜 디지털 탄소 발자국을 감축하는 친환경(ESG) 크롬 확장 프로그램입니다.

## 📖 프로젝트 개요
생성형 AI(ChatGPT, Gemini)는 답변을 생성할 때 막대한 전력과 자원을 소모합니다. 본 프로젝트는 사용자의 질문 습관을 최적화하여 데이터 센터의 부하를 줄이고, 실시간으로 절감된 환경 지표를 시각화하여 제공합니다.

* **소속:** LG전자 ESG 대학생 아카데미 12기 (엘지니)
* **개발자:** 강종혁 (인하대학교 컴퓨터공학과)

## ✨ 핵심 기능

### 1. WASM 기반 형태소 분석 및 논리 보존 최적화 (Advanced Prompt Optimization)
단순 정규식(Regex) 기반 텍스트 필터링의 한계(문맥 훼손)를 극복하기 위해 **브라우저 내장형 WebAssembly(WASM) 한국어 형태소 분석기**를 탑재했습니다.
* **세종 품사(Sejong POS) 기반 하이브리드 필터링:** AI가 문맥을 이해하는 데 필수적인 논리 구조는 완벽히 보존하고, 감정적 군더더기만 정밀하게 타격하여 제거합니다.
    * **절대 보존:** 연결 어미(EC), 보조사(JX), 부사격 조사(JKB), 접속 조사(JC), 코드 및 수식(SL, SN, SW)
    * **정밀 삭제:** 감탄사(IC), 종결 어미(EF), 선어말 어미(EP), 무의미한 강조 부사(MAG)
* **어절 재구성 (Sub-word Optimization):** 보존된 조사와 어미를 앞 단어에 강제 결합시켜 BPE 토크나이저의 파편화를 방지하고 토큰 압축 효율을 극대화합니다.
* **Safety Fallback:** WASM 엔진 로드 실패 시, 프롬프트의 논리를 훼손하지 않는 안전한 보수적 정규식 필터로 자동 전환됩니다.

### 2. 동적 ESG 대시보드 (Dynamic Context-Aware Calculation)
단순히 고정된 공식을 사용하지 않습니다. 사용자가 접속한 AI 플랫폼(ChatGPT 또는 Gemini)을 브라우저 환경에서 실시간으로 감지하여, 각 서비스의 실제 인프라 통계에 기반한 맞춤형 환경 지표를 산출합니다.
* **기준점:** WildChat 데이터셋 100만 건 분석을 통한 1회 대화(Input+Output) 평균 500 토큰 하향 적용
* **ChatGPT 대시보드:** 범용 GPU 아키텍처 및 글로벌 전력망 탄소집약도 기반 보수적 추정 (출처: OpenAI CEO Blog, 2025)
    * `전력 0.00068 Wh | 수자원 0.00064 ml | CO₂ 0.000323 g (1 토큰 당)`
* **Gemini 대시보드:** 고효율 TPU 및 구글 데이터 센터의 재생에너지 비율 적용 (출처: MIT Technology Review, 2025)
    * `전력 0.00048 Wh | 수자원 0.00052 ml | CO₂ 0.00006 g (1 토큰 당)`

### 3. 사용자 맞춤형 가이드
* 효율적인 질문 작성을 위한 '역할 & 작업' 기반 템플릿 기본 제공.
* OpenAI 및 Google의 공식 가이드를 기반으로 한 프롬프트 엔지니어링 팁 제공.

## 🏗️ 기술 스택 및 아키텍처
관심사의 분리(Separation of Concerns) 원칙을 기반으로 독립적으로 작동하도록 모듈화되었습니다.
* **Language:** JavaScript (Vanilla JS), WebAssembly (WASM), HTML5, CSS3
* **Architecture:**
    * `pipeline.js`: WASM 엔진 비동기 초기화, 세종 품사 기반 텍스트 최적화 알고리즘 및 데이터 보호(Shield) 레이어
    * `ui.js`: 사이드바 DOM 생성, 동적 ESG 지표 산출 및 실시간 대시보드 렌더링
    * `app.js`: SPA(Single Page Application) 라우팅 감지, 이벤트 핸들링 및 DOM 텍스트 강제 주입 제어
    * `tokenizer.bundle.js`: 모델 환경과 일치하는 정밀한 토큰 카운팅 엔진

## 🔒 개인정보 보호 (Privacy)
* **Local Processing (On-Device):** WASM 형태소 분석, 프롬프트 최적화, 토큰 계산 등 모든 연산은 100% 사용자의 브라우저 내에서만 수행됩니다.
* **Zero Data Collection:** 어떠한 프롬프트 내용이나 사용자 데이터도 외부 서버로 전송되거나 수집되지 않습니다.

## 🚀 향후 로드맵 (Future Work for Contributors)
본 프로젝트의 연구 개발을 통해, 형태소 기반 압축이 최신 LLM의 Sub-word Tokenizer 체계에서 가지는 구조적 한계(문자열 길이 감소 대비 토큰 수 감소 폭 저하)를 확인했습니다. 프로젝트를 양도받거나 기여할 팀을 위해 다음 단계의 기술적 아키텍처를 제안합니다.
* **On-Device SLM (소형 언어 모델) 도입:** 브라우저 내장 API인 `WebGPU` 또는 `WebNN`을 활용하여, 사용자의 프롬프트를 서버로 전송하기 전에 로컬 SLM이 의미론적으로 완벽히 요약 및 재작성하는 방식의 궁극적인 토큰 다이어트 시스템 구축.

## 📜 오픈소스 출처 및 라이선스 (Acknowledgements)
EcoGenie의 형태소 분석 파이프라인은 가볍고 빠른 Rust 기반의 오픈소스 분석기를 WebAssembly 환경으로 포팅하여 구축되었습니다.
* **Morpheme Engine:** [Garu (가루)](https://github.com/hyeonsangjeon/garu) - Rust 기반 초경량 한국어 형태소 분석기

---
* **Contact:** whdgur9121@inha.edu
* **University:** Inha University, Computer Science & Engineering
