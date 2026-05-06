// ==========================================
// 3. 페이지 상태 분석 및 SPA 라우팅 제어
// ==========================================

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
      if (rawInput.value === TEMPLATE_TEXT) {
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
      chrome.storage.local.set({ ecoQueries: 0, totalSavedTokens: 0, recentSavedTokens: 0 }, updateDashboard);
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

  document.getElementById('eco-optimizeBtn').addEventListener('click', () => {
    if (!chrome.runtime || !chrome.runtime.id) {
        alert("🌱 업데이트가 감지되었습니다. 새로고침(F5) 해주세요!"); return;
    }

    const rawText = rawInput.value;
    if (!rawText || rawText === TEMPLATE_TEXT) return;

    const isSysPromptEnabled = document.getElementById('eco-sys-checkbox').checked;

    const originalTokens = estimateTokens(rawText);
    const cleanedText = ecoPipeline.optimize(rawText);
    const cleanedTokens = estimateTokens(cleanedText);
    
    let finalText = cleanedText;
    let actualCleanedTokens = cleanedTokens;
    
    if (cleanedTokens > originalTokens) {
      finalText = rawText; actualCleanedTokens = originalTokens; 
    }

    let sysPromptAttached = false;
    if (isSysPromptEnabled && originalTokens >= 15) {
      finalText += ecoPipeline.getSystemPrompt();
      sysPromptAttached = true;
    }

    const inputTokenSavings = Math.max(0, originalTokens - actualCleanedTokens);
    const isChatGPT = window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com');
    
    let inputBox = isChatGPT ? document.querySelector('#prompt-textarea') 
                             : document.querySelector('div[contenteditable="true"][role="textbox"]') || document.querySelector('rich-textarea div[contenteditable="true"]');
    
    if (!inputBox) { alert("입력창을 찾을 수 없습니다."); return; }

    inputBox.focus();
    
    if (inputBox.tagName === 'TEXTAREA') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      if (nativeInputValueSetter) nativeInputValueSetter.call(inputBox, finalText);
      else inputBox.value = finalText;
      
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true })); 
    } else {
      document.execCommand('selectAll', false, null); 
      document.execCommand('delete', false, null);
      document.execCommand('insertText', false, finalText);
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    }

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

    function finalizeEcoTransaction() {
      chrome.storage.local.get(['ecoQueries', 'totalSavedTokens', 'recentSavedTokens'], (data) => {
        chrome.storage.local.set({
          ecoQueries: (data.ecoQueries || 0) + 1,
          totalSavedTokens: (data.totalSavedTokens || 0) + inputTokenSavings,
          recentSavedTokens: inputTokenSavings
        }, () => {
          updateDashboard();
          const selector = isChatGPT ? '.markdown' : 'message-content, .model-response-text';
          const blockCountAtSend = document.querySelectorAll(selector).length;
          observeResponseCompletion(isChatGPT, blockCountAtSend, sysPromptAttached);
          
          if (modeInitial.classList.contains('active')) rawInput.value = TEMPLATE_TEXT;
          else rawInput.value = "";
          
          document.getElementById('mode-followup').click();
        });
      });
    }

    setTimeout(() => attemptSend(15), 100);
  });
}

function observeResponseCompletion(isChatGPT, blockCountAtSend, applyOutputSaving) {
  let lastLength = 0, stableCount = 0, newBlockFound = false, currentIntervals = 0;
  const maxWaitIntervals = 240, selector = isChatGPT ? '.markdown' : 'message-content, .model-response-text';

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
          const actualOutputTokens = estimateTokens(lastBlock.innerText);
          const expectedTokens = actualOutputTokens / (1 - OUTPUT_SAVING_RATIO);
          const outputTokenSavings = Math.floor(expectedTokens - actualOutputTokens);

          if (outputTokenSavings > 0) {
            chrome.storage.local.get(['totalSavedTokens', 'recentSavedTokens'], (data) => {
              chrome.storage.local.set({
                totalSavedTokens: (data.totalSavedTokens || 0) + outputTokenSavings,
                recentSavedTokens: (data.recentSavedTokens || 0) + outputTokenSavings
              }, updateDashboard);
            });
          }
        }
      }
    } else { stableCount = 0; lastLength = currentLength; }
  }, 500);
}

// 메인 실행
setTimeout(() => {
  injectSidebar();
  attachEvents();
  updateDashboard();
  initSPARouter();
}, 3000);