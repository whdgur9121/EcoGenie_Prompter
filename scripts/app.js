// ==========================================
// 3. 페이지 상태 분석 및 SPA 라우팅 제어
// ==========================================

// ChatGPT와 Gemini는 페이지 이동 시 새로고침이 일어나지 않는 SPA(Single Page Application)입니다.
// 이를 감지하여 새 채팅창이 열릴 때마다 확장 프로그램 모드(초기 질문/이후 질문)를 전환하기 위한 라우터입니다.
function initSPARouter() {
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
  };

  window.addEventListener('popstate', handleUrlChange);

  let currentUrl = location.href;
  const bodyObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      handleUrlChange();
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (e) => {
    const text = (e.target.innerText || '').toLowerCase();
    const href = e.target.closest('a') ? e.target.closest('a').getAttribute('href') : '';
    if (text.includes('new chat') || text.includes('새 채팅') || text.includes('새로운 채팅') || href === '/') {
      handleUrlChange();
    }
  });
}

function handleUrlChange() {
  const sidebar = document.getElementById('eco-sidebar');
  if (sidebar) {
    sidebar.style.display = 'block'; 
    setTimeout(checkPageStateAndSetMode, 100); 
    setTimeout(checkPageStateAndSetMode, 500);  
    setTimeout(checkPageStateAndSetMode, 1000); 
  }
}

function checkPageStateAndSetMode() {
  const path = window.location.pathname;
  const host = window.location.hostname;
  let isNewChat = false;
  
  const chatBlocks = document.querySelectorAll('.markdown, message-content, .model-response-text, [data-message-author-role="assistant"], [data-testid^="conversation-turn"]');
  
  if (chatBlocks.length === 0) {
    isNewChat = true;
  } else {
    if (host.includes('chatgpt.com') && (path === '/' || path === '')) {
      isNewChat = true;
    } else if (host.includes('gemini.google.com') && (path === '/app' || path === '/app/')) {
      isNewChat = true;
    }
  }
  
  const modeInitial = document.getElementById('mode-initial');
  const modeFollowup = document.getElementById('mode-followup');
  const rawInput = document.getElementById('eco-rawInput');

  if (isNewChat) {
    if (!modeInitial.classList.contains('active')) {
      modeInitial.classList.add('active');
      modeFollowup.classList.remove('active');
      if (!rawInput.value.trim() || rawInput.value.trim() === "역할 :\n작업 :") {
        rawInput.value = TEMPLATE_TEXT;
      }
    }
  } else {
    if (!modeFollowup.classList.contains('active')) {
      modeFollowup.classList.add('active');
      modeInitial.classList.remove('active');
      if (rawInput.value === "역할 :\n작업 :\n" || rawInput.value === "역할 :\n작업 :") {
        rawInput.value = "";
      }
    }
  }

  const isChatGPT = host.includes('chatgpt.com') || host.includes('chat.openai.com');
  const gptBtns = [document.getElementById('guide-model-gpt-btn'), document.getElementById('guide-setting-gpt-btn')];
  const geminiBtns = [document.getElementById('guide-model-gemini-btn'), document.getElementById('guide-setting-gemini-btn')];
  const gptContents = [document.getElementById('guide-model-gpt-content'), document.getElementById('guide-setting-gpt-content')];
  const geminiContents = [document.getElementById('guide-model-gemini-content'), document.getElementById('guide-setting-gemini-content')];

  if (gptBtns[0] && geminiBtns[0]) {
    if (isChatGPT) {
      gptBtns.forEach(btn => btn.classList.add('active'));
      geminiBtns.forEach(btn => btn.classList.remove('active'));
      gptContents.forEach(content => content.style.display = 'block');
      geminiContents.forEach(content => content.style.display = 'none');
    } else {
      geminiBtns.forEach(btn => btn.classList.add('active'));
      gptBtns.forEach(btn => btn.classList.remove('active'));
      geminiContents.forEach(content => content.style.display = 'block');
      gptContents.forEach(content => content.style.display = 'none');
    }
  }
}

// ==========================================
// 4. 이벤트 연결 및 최적화 실행
// ==========================================

// UI 탭 전환 및 초기화 버튼 이벤트 바인딩
function attachEvents() {
  document.getElementById('eco-toggle-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('eco-sidebar');
    if (sidebar.style.display === 'none' || sidebar.style.display === '') {
      sidebar.style.display = 'block';
      checkPageStateAndSetMode(); 
    } else {
      sidebar.style.display = 'none';
    }
  });

  document.querySelectorAll('.eco-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.eco-tab-btn, .eco-tab-content').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(e.target.dataset.target).classList.add('active');
    });
  });

  document.getElementById('eco-resetBtn').addEventListener('click', () => {
    if (!chrome.runtime || !chrome.runtime.id) {
        alert("🌱 업데이트가 감지되었습니다. 새로고침(F5)을 해주세요!");
        return;
    }
    
    if (confirm('통계를 초기화하시겠습니까?')) {
      chrome.storage.local.set({ ecoQueries: 0, totalSavedTokens: 0, recentSavedTokens: 0 }, () => {
         if (typeof updateDashboard === 'function') updateDashboard();
      });
    }
  });

  const modeInitial = document.getElementById('mode-initial');
  const modeFollowup = document.getElementById('mode-followup');
  const rawInput = document.getElementById('eco-rawInput');

  modeInitial.addEventListener('click', () => {
    modeInitial.classList.add('active');
    modeFollowup.classList.remove('active');
    if (!rawInput.value.trim() || rawInput.value.trim() === "역할 :\n작업 :") rawInput.value = TEMPLATE_TEXT;
  });

  modeFollowup.addEventListener('click', () => {
    modeFollowup.classList.add('active');
    modeInitial.classList.remove('active');
    if (rawInput.value === TEMPLATE_TEXT) rawInput.value = "";
  });

  const setupGuideToggle = (gptBtnId, geminiBtnId, gptContentId, geminiContentId) => {
    const gptBtn = document.getElementById(gptBtnId);
    const geminiBtn = document.getElementById(geminiBtnId);
    const gptContent = document.getElementById(gptContentId);
    const geminiContent = document.getElementById(geminiContentId);

    if(!gptBtn) return;

    gptBtn.addEventListener('click', () => {
        gptBtn.classList.add('active'); geminiBtn.classList.remove('active');
        gptContent.style.display = 'block'; geminiContent.style.display = 'none';
    });

    geminiBtn.addEventListener('click', () => {
        geminiBtn.classList.add('active'); gptBtn.classList.remove('active');
        geminiContent.style.display = 'block'; gptContent.style.display = 'none';
    });
  };

  setupGuideToggle('guide-model-gpt-btn', 'guide-model-gemini-btn', 'guide-model-gpt-content', 'guide-model-gemini-content');
  setupGuideToggle('guide-setting-gpt-btn', 'guide-setting-gemini-btn', 'guide-setting-gpt-content', 'guide-setting-gemini-content');

  rawInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('eco-optimizeBtn').click();
    }
  });

  // [핵심] 사용자가 '적용 및 전송' 버튼을 눌렀을 때의 메인 동작 (WASM 대기를 위해 async 적용)
  document.getElementById('eco-optimizeBtn').addEventListener('click', async () => {
    if (!chrome.runtime || !chrome.runtime.id) {
        alert("🌱 업데이트가 감지되었습니다. 새로고침(F5) 해주세요!"); return;
    }

    const rawText = rawInput.value;
    if (!rawText || rawText === TEMPLATE_TEXT) return;

    const isSysPromptEnabled = document.getElementById('eco-sys-checkbox').checked;

    // 1. 최적화 전 토큰 계산
    const originalTokens = window.estimateTokens ? window.estimateTokens(rawText) : Math.ceil(rawText.length * 1.2);
    
    const optBtn = document.getElementById('eco-optimizeBtn');
    const originalBtnHTML = optBtn.innerHTML;
    optBtn.innerText = "분석 중..."; 

    // 2. WASM 파이프라인 비동기 대기 및 프롬프트 압축 실행
    let cleanedText = rawText;
    if (window.ecoPipeline) {
        cleanedText = await window.ecoPipeline.optimize(rawText);
    }
    
    // 3. 최적화 후 토큰 계산
    const cleanedTokens = window.estimateTokens ? window.estimateTokens(cleanedText) : Math.ceil(cleanedText.length * 1.2);
    optBtn.innerHTML = originalBtnHTML;
    
    let finalText = cleanedText;
    let actualCleanedTokens = cleanedTokens;
    
    // 안전장치: 압축 로직을 거쳤는데 오히려 토큰이 늘어난 경우(기호 처리 오류 등) 원본을 유지합니다.
    if (cleanedTokens > originalTokens) {
      finalText = rawText; actualCleanedTokens = originalTokens; 
    }

    let sysPromptAttached = false;
    if (isSysPromptEnabled && originalTokens >= 15) {
      finalText += window.ecoPipeline ? window.ecoPipeline.getSystemPrompt() : "\n\n[Sys: No fluff. Markdown only.]";
      sysPromptAttached = true;
    }

    const inputTokenSavings = Math.max(0, originalTokens - actualCleanedTokens);
    // ChatGPT(textarea)와 Gemini(contenteditable div)의 DOM 구조 차이 감지
    const isChatGPT = window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com');
    
    let inputBox = isChatGPT ? document.querySelector('#prompt-textarea') 
                             : document.querySelector('div[contenteditable="true"][role="textbox"]') || document.querySelector('rich-textarea div[contenteditable="true"]');
    
    if (!inputBox) { alert("입력창을 찾을 수 없습니다."); return; }

    inputBox.focus();
    
    // [텍스트 주입 로직] 
    // React 기반의 입력창은 단순 value 변경 이벤트를 감지하지 못하므로, Native Setter와 DispatchEvent를 사용해 강제로 인식시킵니다.
    if (inputBox.tagName === 'TEXTAREA') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      if (nativeInputValueSetter) nativeInputValueSetter.call(inputBox, finalText);
      else inputBox.value = finalText;
      
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true })); 
    } else {
      // Gemini의 ContentEditable 요소는 Document 명령어로 텍스트를 커서 위치에 삽입해야 에러가 나지 않습니다.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputBox);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertText', false, finalText);
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 전송 버튼 찾기 및 자동 클릭 함수 (렌더링 딜레이를 고려한 재귀 호출 로직)
    function attemptSend(retries) {
      let sendBtn = isChatGPT ? document.querySelector('button[data-testid="send-button"]') : document.querySelector('button[aria-label*="보내기"], button[aria-label*="Send"]');
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click(); finalizeEcoTransaction();
      } else if (retries > 0) {
        setTimeout(() => attemptSend(retries - 1), 100);
      } else {
        finalizeEcoTransaction(); 
      }
    }

    // 전송 완료 후 로컬 스토리지에 절약 통계 업데이트 및 응답 길이 관찰 시작
    function finalizeEcoTransaction() {
      chrome.storage.local.get(['ecoQueries', 'totalSavedTokens', 'recentSavedTokens'], (data) => {
        chrome.storage.local.set({
          ecoQueries: (data.ecoQueries || 0) + 1,
          totalSavedTokens: (data.totalSavedTokens || 0) + inputTokenSavings,
          recentSavedTokens: inputTokenSavings
        }, () => {
          if (typeof updateDashboard === 'function') updateDashboard();
          const selector = isChatGPT ? '.markdown' : 'message-content, .model-response-text';
          const blockCountAtSend = document.querySelectorAll(selector).length;
          observeResponseCompletion(isChatGPT, blockCountAtSend, sysPromptAttached);
          
          if (document.getElementById('mode-initial').classList.contains('active')) {
             rawInput.value = TEMPLATE_TEXT;
          } else {
             rawInput.value = "";
          }
          
          document.getElementById('mode-followup').click();
        });
      });
    }

    setTimeout(() => attemptSend(15), 100);
  });
}

// LLM의 응답 출력 완료 여부를 관찰하는 함수 (출력 토큰 절약량 계산용)
function observeResponseCompletion(isChatGPT, blockCountAtSend, applyOutputSaving) {
  let lastLength = 0, stableCount = 0, newBlockFound = false, currentIntervals = 0;
  const maxWaitIntervals = 240, selector = isChatGPT ? '.markdown' : 'message-content, .model-response-text';
  const OUTPUT_SAVING_RATIO = 0.0901;

  // 스트리밍 응답의 특성상 DOM 변화(Mutation)가 너무 잦아 오작동할 수 있으므로, 
  // 500ms 단위로 텍스트 길이를 체크하여 성장이 멈추면(stableCount >= 4) 응답 완료로 간주합니다.
  const checkInterval = setInterval(() => {
    if (!chrome.runtime || !chrome.runtime.id) { clearInterval(checkInterval); return; }
    currentIntervals++;
    if (currentIntervals > maxWaitIntervals) { clearInterval(checkInterval); return; }

    const responseBlocks = document.querySelectorAll(selector);
    if (!responseBlocks || responseBlocks.length === 0) return;

    if (!newBlockFound) {
      if (responseBlocks.length > blockCountAtSend) { newBlockFound = true; lastLength = 0; stableCount = 0; }
      else return; 
    }

    const lastBlock = responseBlocks[responseBlocks.length - 1];
    const currentLength = lastBlock.innerText.length;

    if (currentLength > 0 && currentLength === lastLength) {
      stableCount++;
      if (stableCount >= 4) { 
        clearInterval(checkInterval);
        if (applyOutputSaving) {
          const actualOutputTokens = window.estimateTokens ? window.estimateTokens(lastBlock.innerText) : Math.ceil(lastBlock.innerText.length * 1.2);
          const expectedTokens = actualOutputTokens / (1 - OUTPUT_SAVING_RATIO);
          const outputTokenSavings = Math.floor(expectedTokens - actualOutputTokens);

          if (outputTokenSavings > 0) {
            chrome.storage.local.get(['totalSavedTokens', 'recentSavedTokens'], (data) => {
              chrome.storage.local.set({
                totalSavedTokens: (data.totalSavedTokens || 0) + outputTokenSavings,
                recentSavedTokens: (data.recentSavedTokens || 0) + outputTokenSavings
              }, () => {
                  if (typeof updateDashboard === 'function') updateDashboard();
              });
            });
          }
        }
      }
    } else { stableCount = 0; lastLength = currentLength; }
  }, 500);
}

// ==========================================
// 5. 메인 실행 로직 (WASM 비동기 초기화 적용)
// ==========================================
setTimeout(async () => {
  if (typeof injectSidebar === 'function') injectSidebar();
  
  // [핵심] pipeline.js의 WASM 초기화를 비동기로 기다린 후 이벤트를 연결합니다.
  if (window.ecoPipeline) {
    await window.ecoPipeline.init();
  }
  
  attachEvents();
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof initSPARouter === 'function') initSPARouter();
}, 3000);