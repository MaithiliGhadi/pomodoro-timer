const DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

const MODE_LABELS = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break'
};

let mode = 'work';
let remainingSeconds = DURATIONS[mode];
let timerId = null;
let completedSessions = 0;

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const sessionCountEl = document.getElementById('sessionCount');
const modeButtons = document.querySelectorAll('.mode-btn');

function updateDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
  document.title = `${minutesEl.textContent}:${secondsEl.textContent} • Pomodoro`;
}

function setMode(newMode) {
  stopTimer();
  mode = newMode;
  remainingSeconds = DURATIONS[mode];

  modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });

  statusEl.textContent = `${MODE_LABELS[mode]} timer ready.`;
  startBtn.textContent = 'Start';
  updateDisplay();
}

function startTimer() {
  if (timerId !== null) return;

  startBtn.textContent = 'Pause';
  statusEl.textContent = `${MODE_LABELS[mode]} session in progress.`;

  timerId = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      updateDisplay();
      return;
    }

    finishTimer();
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function toggleTimer() {
  if (timerId === null) {
    startTimer();
  } else {
    stopTimer();
    startBtn.textContent = 'Start';
    statusEl.textContent = 'Timer paused.';
  }
}

function resetTimer() {
  stopTimer();
  remainingSeconds = DURATIONS[mode];
  startBtn.textContent = 'Start';
  statusEl.textContent = 'Timer reset.';
  updateDisplay();
}

function finishTimer() {
  stopTimer();

  if (mode === 'work') {
    completedSessions += 1;
    sessionCountEl.textContent = completedSessions;
  }

  statusEl.textContent = `${MODE_LABELS[mode]} session complete.`;
  startBtn.textContent = 'Start';
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

updateDisplay();
