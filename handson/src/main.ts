import './style.css';
import { parseExif, analyzePixel } from './detector';

const BASE = import.meta.env.BASE_URL;
let IMAGES: string[] = [];
let aiImagesCount = 0;

// State
let phase: 1 | 2 = 1;
let isDevMode = false;
const labels: Record<string, 'AI' | 'Real' | null> = {};
const actualTypes: Record<string, 'ai (watermark)' | 'ai (exif)' | 'real'> = {};

// DOM Elements
const quizGrid = document.getElementById('quiz-grid') as HTMLDivElement;
const answerList = document.getElementById('answer-list') as HTMLDivElement;
const terminalToggle = document.getElementById('terminal-toggle') as HTMLButtonElement;
const terminalPanel = document.getElementById('terminal-panel') as HTMLDivElement;
const terminalInput = document.getElementById('terminal-input') as HTMLInputElement;
const terminalHistory = document.getElementById('terminal-history') as HTMLDivElement;

const phaseQuiz = document.getElementById('phase-quiz') as HTMLDivElement;
const phaseAnswer = document.getElementById('phase-answer') as HTMLDivElement;
const phaseExplain = document.getElementById('phase-explain') as HTMLDivElement;
const scoreDisplay = document.getElementById('score-display') as HTMLHeadingElement;
const aiCountSpan = document.getElementById('ai-count') as HTMLSpanElement;

const imageModal = document.getElementById('image-modal') as HTMLDivElement;
const modalImage = document.getElementById('modal-image') as HTMLImageElement;

if (imageModal) {
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      imageModal.classList.remove('open');
    }
  });
}

function openModal(src: string) {
  if (modalImage && imageModal) {
    modalImage.src = src;
    imageModal.classList.add('open');
  }
}

async function loadImagesConfig() {
  try {
    const res = await fetch(`${BASE}images/answers.txt?v=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to load answers.txt");
    const text = await res.text();
    const lines = text.trim().split("\n");
    
    IMAGES = [];
    aiImagesCount = 0;
    
    lines.forEach((line) => {
      const parts = line.split(":");
      if (parts.length < 2) return;
      const name = parts[0].trim();
      const type = parts[1].trim().toLowerCase() as 'ai (watermark)' | 'ai (exif)' | 'real';
      
      const ext = type === "ai (watermark)" ? ".png" : ".jpg";
      const src = `${BASE}images/${name}${ext}?v=2`;
      
      IMAGES.push(src);
      actualTypes[src] = type;
      if (type.startsWith("ai")) {
        aiImagesCount++;
      }
    });
    
    if (aiCountSpan) aiCountSpan.textContent = aiImagesCount.toString();
  } catch (err) {
    console.error("Error loading image configuration:", err);
    // Fallback to static values if fetch fails
    IMAGES = [
      `${BASE}images/image_01.png?v=2`,
      `${BASE}images/image_02.png?v=2`,
      `${BASE}images/image_03.png?v=2`,
      `${BASE}images/image_04.jpg?v=2`,
      `${BASE}images/image_05.jpg?v=2`,
      `${BASE}images/image_06.jpg?v=2`,
      `${BASE}images/image_07.jpg?v=2`,
      `${BASE}images/image_08.jpg?v=2`,
      `${BASE}images/image_09.jpg?v=2`,
      `${BASE}images/image_10.jpg?v=2`,
      `${BASE}images/image_11.jpg?v=2`,
      `${BASE}images/image_12.jpg?v=2`,
    ];
    const fallbackTypes: Record<number, 'ai (watermark)' | 'ai (exif)' | 'real'> = {
      0: 'ai (watermark)',
      1: 'real',
      2: 'ai (watermark)',
      3: 'ai (exif)',
      4: 'real',
      5: 'ai (exif)',
      6: 'real',
      7: 'real',
      8: 'real',
      9: 'real',
      10: 'real',
      11: 'real'
    };
    aiImagesCount = 0;
    IMAGES.forEach((src, idx) => {
      const type = fallbackTypes[idx] || 'real';
      actualTypes[src] = type;
      if (type.startsWith("ai")) {
        aiImagesCount++;
      }
    });
    if (aiCountSpan) aiCountSpan.textContent = aiImagesCount.toString();
  }
}

function appendHistory(cmd: string, response: string) {
  const line = document.createElement('div');
  line.className = 'history-line';
  line.innerHTML = `<div><span style="font-weight:bold;">$</span> ${cmd}</div><div style="color:#aaa;margin-bottom:8px;">${response}</div>`;
  terminalHistory.appendChild(line);
  terminalHistory.scrollTop = terminalHistory.scrollHeight;
}

function initPhase1() {
  quizGrid.innerHTML = '';
  IMAGES.forEach((src, index) => {
    labels[src] = null; // init

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.style.animationDelay = `${index * 0.15}s`;
    card.innerHTML = `
      <img src="${src}" alt="Image ${index + 1}" />
      <div class="label-container">
        <button class="label-btn btn-ai" data-type="AI">AI</button>
        <button class="label-btn btn-real" data-type="Real">本物</button>
      </div>
    `;

    const btnAi = card.querySelector('.btn-ai') as HTMLButtonElement;
    const btnReal = card.querySelector('.btn-real') as HTMLButtonElement;

    const updateBtns = () => {
      btnAi.classList.toggle('active', labels[src] === 'AI');
      btnReal.classList.toggle('active', labels[src] === 'Real');
    };

    btnAi.addEventListener('click', () => {
      labels[src] = labels[src] === 'AI' ? null : 'AI';
      updateBtns();
    });

    btnReal.addEventListener('click', () => {
      labels[src] = labels[src] === 'Real' ? null : 'Real';
      updateBtns();
    });

    const imgEl = card.querySelector('img');
    if (imgEl) {
      imgEl.style.cursor = 'zoom-in';
      imgEl.addEventListener('click', () => {
        openModal(src);
      });
    }

    quizGrid.appendChild(card);
  });
}

function initPhase2() {
  answerList.innerHTML = '';
  let correctCount = 0;

  IMAGES.forEach((src, index) => {
    const actualType = actualTypes[src] || 'real';
    const isAiActual = actualType.startsWith('ai');
    const userLabel = labels[src];
    
    if (
      (isAiActual && userLabel === 'AI') || 
      (!isAiActual && userLabel === 'Real')
    ) {
      correctCount++;
    }

    const row = document.createElement('div');
    row.className = 'answer-row';
    const translatedUserLabel = userLabel === 'AI' ? 'AI' : userLabel === 'Real' ? '本物' : 'なし';
    
    let actualLabel = '';
    if (actualType === 'ai (watermark)') {
      actualLabel = '(Actual: AI (Watermark))';
    } else if (actualType === 'ai (exif)') {
      actualLabel = '(Actual: AI (Exif))';
    } else {
      actualLabel = '(Actual: 本物)';
    }

    row.innerHTML = `
      <div class="answer-image">
        <img id="img-${index}" src="${src}" alt="Image ${index + 1}" crossorigin="anonymous" />
      </div>
      <div class="answer-dashboard">
        <h3>あなたの回答: ${translatedUserLabel} ${isDevMode ? actualLabel : ''}</h3>
        
        <div class="dashboard-panel">
          <button class="btn btn-exif">Exif解析</button>
          <div class="result-text exif-result"></div>
        </div>

        <div class="dashboard-panel">
          <button class="btn btn-pixel">ピクセル解析</button>
          <div class="result-text pixel-result"></div>
        </div>
      </div>
    `;

    const btnExif = row.querySelector('.btn-exif') as HTMLButtonElement;
    const exifResult = row.querySelector('.exif-result') as HTMLDivElement;
    
    btnExif.addEventListener('click', async () => {
      exifResult.textContent = '解析中...';
      const imgEl = row.querySelector(`#img-${index}`) as HTMLImageElement;
      const parsed = await parseExif(imgEl);
      exifResult.textContent = parsed.result;
      if (parsed.detected) {
        exifResult.classList.add('highlight');
      } else {
        exifResult.classList.remove('highlight');
      }
      
      if (isDevMode) {
        const line = document.createElement('div');
        line.className = 'terminal-line response';
        line.innerHTML = `[DEV] Image ${index + 1} Exif: ${parsed.debugLog}`;
        terminalHistory.appendChild(line);
        terminalHistory.scrollTop = terminalHistory.scrollHeight;
      }
    });

    const btnPixel = row.querySelector('.btn-pixel') as HTMLButtonElement;
    const pixelResult = row.querySelector('.pixel-result') as HTMLDivElement;

    btnPixel.addEventListener('click', async () => {
      pixelResult.textContent = '解析中...';
      const imgEl = row.querySelector(`#img-${index}`) as HTMLImageElement;
      const result = await analyzePixel(imgEl);
      pixelResult.textContent = `Score: ${result.score.toFixed(4)} - ${result.detected ? 'AIらしきウォーターマークを検知' : 'AIらしきウォーターマークは見つかりませんでした'}`;
      if (result.detected) {
        pixelResult.classList.add('highlight');
      } else {
        pixelResult.classList.remove('highlight');
      }
      
      if (isDevMode) {
        const line = document.createElement('div');
        line.className = 'terminal-line response';
        line.innerHTML = `[DEV] Image ${index + 1} Pixel: ${result.debugLog}`;
        terminalHistory.appendChild(line);
        terminalHistory.scrollTop = terminalHistory.scrollHeight;
      }
    });

    const rowImgEl = row.querySelector('.answer-image img') as HTMLImageElement;
    if (rowImgEl) {
      rowImgEl.style.cursor = 'zoom-in';
      rowImgEl.addEventListener('click', () => {
        openModal(src);
      });
    }

    answerList.appendChild(row);
  });

  scoreDisplay.innerHTML = `あなたは <span class="highlight">${IMAGES.length}枚中${correctCount}枚</span> 正解できました！`;
}

// Terminal Logic
terminalToggle.addEventListener('click', () => {
  terminalPanel.classList.toggle('open');
  const isOpen = terminalPanel.classList.contains('open');
  if (isOpen) {
    terminalInput.focus();
  }
});

terminalInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const val = terminalInput.value.trim().toLowerCase();
    if (!val) return;
    
    terminalInput.value = '';
    let response = '';
    
    if (val === 'answer') {
      phase = 2;
      phaseQuiz.classList.add('hidden');
      phaseExplain.classList.add('hidden');
      phaseAnswer.classList.remove('hidden');
      initPhase2();
      response = 'Loading Validation Dashboard...';
      setTimeout(() => {
        terminalPanel.classList.remove('open');
      }, 600);
    } else if (val === 'reset' || val === 'back') {
      phase = 1;
      phaseQuiz.classList.remove('hidden');
      phaseAnswer.classList.add('hidden');
      phaseExplain.classList.add('hidden');
      initPhase1();
      response = 'Returning to Phase 1...';
      setTimeout(() => {
        terminalPanel.classList.remove('open');
      }, 600);
    } else if (val === 'explain') {
      phaseQuiz.classList.add('hidden');
      phaseAnswer.classList.add('hidden');
      phaseExplain.classList.remove('hidden');
      response = 'Displaying explanation...';
      setTimeout(() => {
        terminalPanel.classList.remove('open');
      }, 600);
    } else if (val === 'debug' || val === 'dev' || val === 'admin') {
      isDevMode = true;
      if (phase === 2) initPhase2();
      try {
        const res = await fetch(`${BASE}images/answers.txt?v=${Date.now()}`);
        if (res.ok) {
          const text = await res.text();
          const formatted = text.trim().replace(/\n/g, '<br>');
          response = `Switched to Developer mode.<br>${formatted}`;
        } else {
          response = 'Switched to Developer mode. (Failed to load answers.txt)';
        }
      } catch (err) {
        response = `Switched to Developer mode. (Error loading answers: ${err})`;
      }
    } else if (val === 'user') {
      isDevMode = false;
      if (phase === 2) initPhase2();
      response = 'Switched to User mode.';
    } else if (val === 'help') {
      response = `Available commands:<br>- answer: 答え合わせ<br>- back/reset: クイズに戻る<br>- explain: 仕組み解説ページ<br>- debug/dev/admin: 開発者モード<br>- user: 一般ユーザーモード<br>- help: ヘルプ表示`;
    } else {
      response = `Command not found: ${val}`;
    }
    
    appendHistory(val, response);
  }
});

// Start
loadImagesConfig().then(() => {
  initPhase1();
});
