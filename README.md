# EcoGenie_Prompter

> **"지속 가능한 생성형 AI 프롬프트"**
> **EcoGenie_Prompter**는 생성형 AI 대화 과정에서 발생하는 불필요한 토큰 소모를 감소시켜 디지털 탄소 발자국을 감축하는 친환경(ESG) 크롬 확장 프로그램입니다.

---

## 프로젝트 개요
생성형 AI(ChatGPT, Gemini)는 답변을 생성할 때 막대한 전력과 자원을 소모합니다. 본 프로젝트는 사용자의 질문 습관을 최적화하여 데이터 센터의 부하를 줄이고, 실시간으로 절감된 환경 지표를 시각화하여 제공합니다.

*   **소속**: LG전자 ESG 대학생 아카데미 12기 (엘지니)
*   **개발자**: 강종혁 (인하대학교 컴퓨터공학과)

---

## 핵심 기능

### 1. 프롬프트 최적화 (Prompt Optimization)
*   **룰베이스 기반 불필요 단어 제거 및 축약**: "안녕하세요", "부탁해" 등 문맥 파악에 불필요한 어휘를 정규 표현식(Regex) 기반 파이프라인으로 자동 제거합니다.
*   **토큰 예측**: 실제 토크나이저 로직을 기반으로 최적화 전후의 토큰 변화량을 계산합니다.

### 2. 실시간 ESG 대시보드
*   절약된 토큰 데이터를 바탕으로 환경 지표를 실시간 계산하여 출력합니다.
    *   **전력 절감량**: $Saved\ Tokens \times 0.0024\ Wh$
    *   **수자원 절감량**: $Saved\ Tokens \times 0.0026\ ml$
    *   **탄소 배출 절감량**: $Saved\ Tokens \times 0.0003\ g$

### 3. 사용자 맞춤형 가이드
*   효율적인 질문 작성을 위한 '역할 & 작업' 기반 템플릿을 제공합니다.
*   OpenAI 및 Google의 공식 가이드를 기반으로 한 프롬프트 엔지니어링 팁을 포함합니다.

---

## 기술 스택 및 아키텍처
**관심사의 분리(Separation of Concerns)** 원칙을 기반으로 모듈화되었습니다.

*   **Language**: JavaScript (Vanilla JS), HTML5, CSS3
*   **Architecture**:
    *   `pipeline.js`: 텍스트 최적화 알고리즘 및 데이터 처리 로직 담당
    *   `ui.js`: 사이드바 DOM 생성 및 실시간 대시보드 렌더링 담당
    *   `app.js`: 이벤트 핸들링 및 SPA 라우팅 제어 담당
    *   `tokenizer.bundle.js`: 정밀한 토큰 카운팅 엔진

---

## 개인정보 보호 (Privacy)
*   **Local Processing**: 모든 프롬프트 최적화 및 토큰 계산은 사용자의 브라우저 내에서만 이루어집니다.
*   **Zero Data Collection**: 어떠한 사용자 데이터도 외부 서버로 전송되거나 수집되지 않습니다.

---
**Contact**: whdgur9121@inha.edu
**University**: Inha University, Computer Science & Engineering
