import './style.css';
import { parseExif, analyzePixel } from './detector';

const IMAGES = [
  '/images/image_01.png',
  '/images/image_02.png',
  '/images/image_04.jpg',
  '/images/image_05.jpg',
  '/images/image_07.jpg',
  '/images/image_08.jpg',
];

// State
let phase: 1 | 2 = 1;
const labels: Record<string, 'AI' | 'Real' | null> = {};

// DOM Elements
const quizGrid = document.getElementById('quiz-grid') as HTMLDivElement;
const answerList = document.getElementById('answer-list') as HTMLDivElement;
const terminalToggle = document.getElementById('terminal-toggle') as HTMLButtonElement;
const terminalPanel = document.getElementById('terminal-panel') as HTMLDivElement;
const terminalInput = document.getElementById('terminal-input') as HTMLInputElement;

const phaseQuiz = document.getElementById('phase-quiz') as HTMLDivElement;
const phaseAnswer = document.getElementById('phase-answer') as HTMLDivElement;
const scoreDisplay = document.getElementById('score-display') as HTMLHeadingElement;

function initPhase1() {
  quizGrid.innerHTML = '';
  IMAGES.forEach((src, index) => {
    labels[src] = null; // init

    const card = document.createElement('div');
    card.className = 'quiz-card';
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

    quizGrid.appendChild(card);
  });
}

function initPhase2() {
  answerList.innerHTML = '';
  let correctCount = 0;

  IMAGES.forEach((src, index) => {
    const isAiActual = index < 4; // 0,1,2,3 are AI (0,1 are watermark, 2,3 are exif in our IMAGES array)
    const userLabel = labels[src];
    
    if (
      (isAiActual && userLabel === 'AI') || 
      (!isAiActual && userLabel === 'Real')
    ) {
      correctCount++;
    }

    const row = document.createElement('div');
    row.className = 'answer-row';
    row.innerHTML = `
      <div class="answer-image">
        <img id="img-${index}" src="${src}" alt="Image ${index + 1}" crossorigin="anonymous" />
      </div>
      <div class="answer-dashboard">
        <h3>User Label: ${userLabel || 'None'} ${isAiActual ? '(Actual: AI)' : '(Actual: 本物)'}</h3>
        
        <div class="dashboard-panel">
          <button class="btn btn-exif">メタデータ解析</button>
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
      const result = await parseExif(imgEl);
      exifResult.textContent = result || '';
      if (result?.includes('AI_GENERATED')) {
        exifResult.classList.add('highlight');
      } else {
        exifResult.classList.remove('highlight');
      }
    });

    const btnPixel = row.querySelector('.btn-pixel') as HTMLButtonElement;
    const pixelResult = row.querySelector('.pixel-result') as HTMLDivElement;

    btnPixel.addEventListener('click', async () => {
      pixelResult.textContent = '解析中...';
      const imgEl = row.querySelector(`#img-${index}`) as HTMLImageElement;
      const result = await analyzePixel(imgEl);
      pixelResult.textContent = `Score: ${result.score.toFixed(4)} - ${result.detected ? 'ウォーターマークを検知' : 'ノイズパターン不一致'}`;
      if (result.detected) {
        pixelResult.classList.add('highlight');
      } else {
        pixelResult.classList.remove('highlight');
      }
    });

    answerList.appendChild(row);
  });

  scoreDisplay.textContent = `正答数: ${correctCount} / ${IMAGES.length}`;
}

// Terminal Logic
terminalToggle.addEventListener('click', () => {
  terminalPanel.classList.toggle('hidden');
  if (!terminalPanel.classList.contains('hidden')) {
    terminalInput.focus();
  }
});

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = terminalInput.value.trim().toLowerCase();
    if (val === 'answer') {
      phase = 2;
      phaseQuiz.classList.add('hidden');
      phaseAnswer.classList.remove('hidden');
      initPhase2();
      terminalPanel.classList.add('hidden');
      terminalInput.value = '';
    } else if (val === 'reset') {
      phase = 1;
      phaseQuiz.classList.remove('hidden');
      phaseAnswer.classList.add('hidden');
      initPhase1();
      terminalPanel.classList.add('hidden');
      terminalInput.value = '';
    }
  }
});

// Start
initPhase1();
