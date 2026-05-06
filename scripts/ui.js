// ==========================================
// 2. 화면 UI 주입 및 업데이트 로직
// ==========================================

function injectSidebar() {
  if (document.getElementById('eco-sidebar')) return;

  const iconUrl = chrome.runtime.getURL('icon_ui.png');
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'eco-toggle-btn';
  toggleBtn.innerHTML = `<img src="${iconUrl}" class="eco-custom-icon"> 에코 모드`;
  document.body.appendChild(toggleBtn);

  const sidebar = document.createElement('div');
  sidebar.id = 'eco-sidebar';

  sidebar.innerHTML = `
    <div class="eco-tabs">
      <button class="eco-tab-btn active" data-target="eco-main">🚀 메인 (통계/입력)</button>
      <button class="eco-tab-btn" data-target="eco-guide">📝 가이드</button>
    </div>
    
    <div id="eco-main" class="eco-tab-content active">
      <div style="font-size: 13px; margin-bottom: 12px; border-bottom: 1px solid #444; padding-bottom: 8px;">
        질의 횟수: <b id="dailyQueries">0</b>회<br>
        절약한 토큰: <b id="savedTokens">0</b> Tokens<br>
        <span style="color: #4ade80; font-size: 11px;">방금 절약: <b id="recentSavedTokens">0</b> Tokens</span>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <div class="eco-stat-item" style="color: #facc15; flex:1;">⚡ 전력<br><b id="savedEnergy">0</b> Wh</div>
          <div class="eco-stat-item" style="color: #60a5fa; flex:1;">💧 수자원<br><b id="savedWater">0</b> ml</div>
          <div class="eco-stat-item" style="color: #4ade80; flex:1;">☁️ CO₂<br><b id="savedCO2">0</b> g</div>
      </div>
      <button id="eco-resetBtn">🔄 통계 초기화</button>
      
      <hr style="border: 0; border-top: 1px solid #444; margin: 15px 0;">
      
      <div style="display: flex; gap: 5px; margin-bottom: 8px; align-items: center;">
         <button id="mode-initial" class="eco-mode-btn active" style="display:flex; justify-content:center; align-items:center; gap:4px;">
            초기 질문
            <div class="eco-tooltip" style="margin-left:0;">
              <span class="eco-help-icon">?</span>
              <span class="eco-tooltip-text" style="bottom:150%;">✅ 역할: 예리한 데이터 분석가<br>✅ 작업: 2025년 매출 상승 원인 3가지를 표로 요약해 줘.</span>
            </div>
         </button>
         <button id="mode-followup" class="eco-mode-btn">이후 질문</button>
      </div>

      <textarea id="eco-rawInput" placeholder="질문을 입력하세요...">역할 :\n작업 :\n</textarea>
      
      <button id="eco-optimizeBtn"><img src="${iconUrl}" class="eco-custom-icon"> 적용 및 전송</button>
      
      <div style="margin-top: 12px; margin-bottom: 4px; display: flex; align-items: center; justify-content: flex-start; padding-left: 2px; font-size: 11.5px; color: #aaa; min-height: 18px;">
        <input type="checkbox" id="eco-sys-checkbox" checked style="margin-right: 6px; cursor: pointer; margin-top: 0;">
        <label for="eco-sys-checkbox" style="cursor: pointer; letter-spacing: -0.3px; line-height: 1;">출력 양식으로 Markdown 적용하기</label>
        <div class="eco-tooltip">
          <span class="eco-help-icon">?</span>
          <span class="eco-tooltip-text">✅ 출력 양식을 마크다운으로 강제합니다.<br>✅ 테스트 결과 평균 9% 정도가 감소됩니다.</span>
        </div>
      </div>
    </div>
    
    <div id="eco-guide" class="eco-tab-content" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
      
      <details class="eco-accordion" open>
        <summary>1. 프롬프트 작성 기초</summary>
        <div class="eco-accordion-content">
          <div style="color: #60a5fa; font-size: 11px; margin-bottom: 6px;">💡 OpenAI & Google 공식 가이드 기반</div>
          <ul class="eco-guide-list">
            <li>
              <span class="eco-text-wrap">최신 모델 사용</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ GPT-4o, Gemini Advanced 등 최신 모델을 선택하세요.</span></div>
            </li>
            <li>
              <span class="eco-text-wrap">구체적이고 설명적으로 작성</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">❌ 코드를 짜줘<br>✅ Python으로 로그인 페이지 백엔드 코드를 작성해 줘.</span></div>
            </li>
            <li>
              <span class="eco-text-wrap">구체적인 형식 제시</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ 출력형식: [1. 요약, 2. 장단점]의 표로 구성할 것.<br>✅ 출력형식: 3개의 불릿 포인트로 작성할 것.</span></div>
            </li>
            <li>
              <span class="eco-text-wrap">두루뭉술한 표현 줄이기</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">❌ 적당히 길게 써줘<br>✅ 500자 내외의 3문단으로 작성해 줘.</span></div>
            </li>
            <li>
              <span class="eco-text-wrap">무엇을 '해야 하는지' 제시</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">❌ 불필요한 서론 쓰지 마<br>✅ 바로 본론부터 3줄로 요약해 줘.</span></div>
            </li>
          </ul>
          <div style="margin-top: 8px;">
            <a href="https://help.openai.com/ko-kr/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api" target="_blank" class="eco-link">🔗 OpenAI 공식 가이드 보기</a><br>
            <a href="https://ai.google.dev/gemini-api/docs/prompting-strategies?hl=ko" target="_blank" class="eco-link">🔗 Google Gemini 가이드 보기</a>
          </div>
        </div>
      </details>

      <details class="eco-accordion">
        <summary>2. 유형별 프롬프트 방법</summary>
        <div class="eco-accordion-content">
          <ul class="eco-guide-list">
            <li>
              <span class="eco-text-wrap"><b>사실 확인:</b> 구체적/단일 질문</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ "2024년 대한민국의 최저임금은 얼마야?"<br>✅ "대한민국 헌법 제1조 1항의 내용을 알려줘."</span></div>
            </li>
            <li>
              <span class="eco-text-wrap"><b>상황 조언:</b> 구체적/단일 질문</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ "면접에서 성격 단점 질문에 대한 모범 답변을 제시해 줘."<br>✅ "팀 프로젝트 중 갈등이 생겼을 때의 해결 방안을 조언해 줘."</span></div>
            </li>
            <li>
              <span class="eco-text-wrap"><b>계획 수립:</b> 조건 제시 ➡️ 대화로 취향 반영</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ "도쿄 3박 4일 여행 일정을 짜줘. 먼저 예산을 물어봐 줘."<br>✅ "10kg 감량 다이어트 계획을 세울 건데, 내 식습관을 먼저 분석해 줘."</span></div>
            </li>
            <li>
              <span class="eco-text-wrap"><b>창의적 작업:</b> 조건 제시 ➡️ 점진적 구체화</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ "판타지 소설용 독특한 마법 시스템 아이디어 3가지를 제시해 줘."<br>✅ "친환경 텀블러 마케팅을 위한 창의적인 슬로건 5개를 만들어 줘."</span></div>
            </li>
            <li>
              <span class="eco-text-wrap"><b>논리적 구조화:</b> 구체적/단계적 지시</span>
              <div class="eco-tooltip"><span class="eco-help-icon">?</span><span class="eco-tooltip-text">✅ "이 문제를 1) 공식 도출, 2) 최종 정답 단계로 풀어줘."<br>✅ "이 코드를 1) 에러 원인 분석, 2) 수정된 코드 제시로 구조화해 줘."</span></div>
            </li>
          </ul>
        </div>
      </details>

      <details class="eco-accordion">
        <summary>3. 모델 선택 가이드</summary>
        <div class="eco-accordion-content">
          <div style="display: flex; gap: 5px; margin-bottom: 8px;">
             <button id="guide-model-gpt-btn" class="eco-mode-btn active">ChatGPT</button>
             <button id="guide-model-gemini-btn" class="eco-mode-btn">Gemini</button>
          </div>
          
          <div id="guide-model-gpt-content">
            <ul class="eco-guide-list" style="margin-bottom: 4px;">
              <li>
                <span class="eco-text-wrap" style="white-space: normal;"><b>Instant (빠른 모델):</b> 즉각적인 응답이 필요할 때 사용<br><span style="color:#aaa;">(예: 단순 번역, 일상 대화, 가벼운 문장 요약)</span></span>
              </li>
              <li>
                <span class="eco-text-wrap" style="white-space: normal;"><b>Thinking (추론 모델):</b> 복잡한 연산과 심도 있는 고민이 필요할 때 사용<br><span style="color:#aaa;">(예: 고급 코딩 설계, 복잡한 수학/논리 문제 풀이)</span></span>
              </li>
            </ul>
          </div>

          <div id="guide-model-gemini-content" style="display: none;">
            <ul class="eco-guide-list" style="margin-bottom: 4px;">
              <li>
                <span class="eco-text-wrap" style="white-space: normal;"><b>Pro:</b> 구글 생태계(Docs, Drive) 연동 및 실시간 웹 검색 기반의 팩트 체크 등 범용적인 작업에 적합.</span>
              </li>
              <li>
                <span class="eco-text-wrap" style="white-space: normal;"><b>빠른 모델:</b> 속도가 가장 중요한 단순 반복 작업이나 가벼운 질의응답에 사용.</span>
              </li>
              <li>
                <span class="eco-text-wrap" style="white-space: normal;"><b>사고 모델:</b> 높은 수준의 수학, 논리 분석 등 복잡한 문제 해결을 위해 심도 있는 사고 과정이 필요할 때 사용.</span>
              </li>
            </ul>
          </div>
        </div>
      </details>

      <details class="eco-accordion">
        <summary>4. 에코 어휘 사용법</summary>
        <div class="eco-accordion-content">
          <ul class="eco-guide-list">
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>군더더기 제거:</b> <br>혹시, 좀, 부탁해, 바쁘지 않다면 ➡️ 생략</span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>명사 위주의 지시:</b> <br>보고서를 써줘 ➡️ 보고서 작성</span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>예시 제공 (Few-shot):</b> <br>원하는 답변 형식을 미리 보여주면 이해도가 급상승함</span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>모호한 지시 금지:</b> <br>적당히 요약해 ➡️ 3문장으로 요약해</span></li>
          </ul>
        </div>
      </details>

      <details class="eco-accordion">
        <summary>5. 개인 맞춤형 설정</summary>
        <div class="eco-accordion-content">
          <div style="display: flex; gap: 5px; margin-bottom: 8px;">
             <button id="guide-setting-gpt-btn" class="eco-mode-btn active">ChatGPT</button>
             <button id="guide-setting-gemini-btn" class="eco-mode-btn">Gemini</button>
          </div>
          
          <div id="guide-setting-gpt-content">
            <ul class="eco-guide-list">
              <li><span class="eco-text-wrap" style="white-space: normal;">설정 > 'ChatGPT 맞춤 설정'에서 내 직업, 말투, 피하고 싶은 형식 등을 미리 입력해 둘 수 있습니다.</span></li>
            </ul>
          </div>
          
          <div id="guide-setting-gemini-content" style="display: none;">
            <ul class="eco-guide-list">
              <li><span class="eco-text-wrap" style="white-space: normal;">설정 > 개인별 맞춤 AI > 'Gemini 개인 요청 사항 추가'를 통해 원하는 응답 방식을 미리 세팅할 수 있습니다.</span></li>
            </ul>
          </div>
        </div>
      </details>

      <details class="eco-accordion">
        <summary>6. 기타 (프로젝트 정보)</summary>
        <div class="eco-accordion-content">
          <ul class="eco-guide-list">
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>프로젝트 목적:</b> 본 프로젝트는 LG전자 ESG 대학생 아카데미의 일환으로 진행되었습니다. AI의 발전으로 인한 환경문제를 인식하고 해결하는 과제이며, ChatGPT 및 Gemini 사용 시 불필요한 프롬프트를 자동으로 최적화하여 낭비되는 토큰을 줄이고, 이를 통해 데이터 센터의 전력 및 탄소 배출량을 감축하는 친환경 ESG 확장 프로그램입니다.</span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><b>제작자:</b> 엘지니 12기 강종혁</span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><a href="https://lgeesgacademy.co.kr/" target="_blank" class="eco-link">🔗 LG전자 ESG 대학생 아카데미</a></span></li>
            <li><span class="eco-text-wrap" style="white-space: normal;"><a href="https://byeolgome.github.io/lge_esg_academy/" target="_blank" class="eco-link">🔗 나만의 AI 활용 성격 테스트</a></span></li>
          </ul>
        </div>
      </details>

    </div>
  `;

  const style = document.createElement('style');
  style.innerHTML = `
    #eco-sidebar, #eco-sidebar * { box-sizing: border-box !important; }
    #eco-guide::-webkit-scrollbar { width: 6px; }
    #eco-guide::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    #eco-guide::-webkit-scrollbar-track { background: transparent; }

    #eco-toggle-btn { position: fixed; top: 80px; right: 20px; background: #1a73e8; color: white; border: none; border-radius: 20px; padding: 10px 15px; font-weight: bold; cursor: pointer; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    #eco-toggle-btn:hover { background: #1557b0; }
    
    #eco-sidebar { display: none; position: fixed; top: 130px; right: 20px; width: 320px; background: #1e1f22; border: 1px solid #444; border-radius: 12px; padding: 15px 15px 20px 15px; color: #e3e3e3; font-family: 'Malgun Gothic', sans-serif; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.5); line-height: 1.5; }
    
    .eco-tabs { display: flex; border-bottom: 1px solid #444; margin-bottom: 12px; }
    .eco-tab-btn { flex: 1; background: none; border: none; color: #888; padding: 10px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; line-height: 1.5; white-space: nowrap; word-break: keep-all; }
    .eco-tab-btn.active { color: #fff; border-bottom: 2px solid #1a73e8; }
    .eco-tab-content { display: none; }
    .eco-tab-content.active { display: block; }
    
    .eco-accordion { background: #2b2d31; border-radius: 6px; margin-bottom: 6px; border: 1px solid #3f4146; }
    .eco-accordion summary { padding: 10px 12px; font-size: 11.5px; font-weight: bold; cursor: pointer; background: #35373c; outline: none; list-style: none; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; border-radius: 6px; }
    .eco-accordion summary::-webkit-details-marker { display: none; }
    .eco-accordion summary:hover { background: #3f4146; }
    .eco-accordion summary::after { content: '▼'; font-size: 9px; color: #888; transition: transform 0.2s; }
    .eco-accordion[open] summary::after { transform: rotate(180deg); }
    .eco-accordion-content { padding: 12px; font-size: 11px; color: #ccc; border-top: 1px solid #3f4146; line-height: 1.5; }
    
    .eco-guide-list { padding-left: 14px; margin: 0; list-style-type: disc; }
    .eco-guide-list li { margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 4px; padding-right: 4px; }
    
    .eco-text-wrap { flex: 1; white-space: nowrap; letter-spacing: -0.5px; }
    .eco-link { color: #60a5fa; text-decoration: none; font-size: 11px; transition: color 0.2s; }
    .eco-link:hover { color: #93c5fd; text-decoration: underline; }

    .eco-stat-item { font-size: 11px; background: #2b2d31; padding: 8px; border-radius: 6px; text-align: center; }
    .eco-stat-item b { font-size: 13px; display: block; margin-top: 4px; line-height: 1.2; }
    .eco-mode-btn { flex: 1; background: #333; color: #aaa; border: 1px solid #555; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s; line-height: 1.2; }
    .eco-mode-btn.active { background: #1a73e8; color: #fff; border-color: #1a73e8; }
    #eco-rawInput { width: 100%; height: 100px; background: #2b2d31; color: white; border: 1px solid #555; border-radius: 8px; padding: 10px; box-sizing: border-box; margin-bottom: 12px; resize: vertical; font-size: 12px; line-height: 1.5; outline: none; }
    
    #eco-optimizeBtn { width: 100%; background: #1a73e8; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; line-height: 1.5; display: flex; align-items: center; justify-content: center; gap: 6px; }
    #eco-optimizeBtn:hover { background: #1557b0; }
    #eco-resetBtn { width: 100%; background: transparent; color: #888; border: 1px solid #555; border-radius: 8px; padding: 6px; font-size: 11px; cursor: pointer; transition: 0.2s; line-height: 1.2; }
    #eco-resetBtn:hover { background: #3a3a3a; color: #ccc; }
    
    .eco-custom-icon { width: 24px; height: 24px; object-fit: contain; vertical-align: middle; margin-bottom: 2px; }

    .eco-tooltip { position: relative; display: inline-block; flex-shrink: 0; margin-left: 4px; }
    .eco-help-icon { display: inline-flex; justify-content: center; align-items: center; width: 14px; height: 14px; background: #555; color: #fff; border-radius: 50%; font-size: 10px; font-weight: bold; cursor: help; line-height: 1; }
    .eco-tooltip .eco-tooltip-text { visibility: hidden; width: 220px; background-color: #1e1f22; color: #fff; font-weight: normal; line-height: 1.4; text-align: left; border-radius: 6px; padding: 8px; position: absolute; z-index: 10005; bottom: 130%; right: 0; opacity: 0; transition: opacity 0.2s; font-size: 11px; border: 1px solid #555; box-shadow: 0 4px 12px rgba(0,0,0,0.6); pointer-events: none; white-space: normal; }
    .eco-tooltip:hover .eco-tooltip-text { visibility: visible; opacity: 1; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(sidebar);
}

function updateDashboard() {
  if (!chrome.runtime || !chrome.runtime.id) return;
  
  chrome.storage.local.get(['ecoQueries', 'totalSavedTokens', 'recentSavedTokens'], (data) => {
    document.getElementById('dailyQueries').innerText = data.ecoQueries || 0;
    const savedTokens = data.totalSavedTokens || 0;
    document.getElementById('savedTokens').innerText = savedTokens;
    
    const recentElem = document.getElementById('recentSavedTokens');
    if (recentElem) recentElem.innerText = data.recentSavedTokens || 0;

    const energyPerToken = 0.0024;
    const waterPerToken = 0.0026;
    const co2PerToken = 0.0003;

    document.getElementById('savedEnergy').innerText = (savedTokens * energyPerToken).toFixed(4);
    document.getElementById('savedWater').innerText = (savedTokens * waterPerToken).toFixed(4);
    document.getElementById('savedCO2').innerText = (savedTokens * co2PerToken).toFixed(4);
  });
}