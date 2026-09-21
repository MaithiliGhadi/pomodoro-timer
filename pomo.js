// ==========================================
// 1. POMODORO TIMER LOGIC
// ==========================================
let timer = null;
let sessionType = "Work";
let workSessions = 0;
let isRunning = false;
let startTime = null;
let pauseTime = null;
let remainingTime = 25 * 60 * 1000;

const state = {
  workDuration: 25 * 60 * 1000,
  shortBreak: 5 * 60 * 1000,
  longBreak: 15 * 60 * 1000,
};

const sessionTypeElement = document.getElementById("session-type");
const timeElement = document.getElementById("time");
const startStopButton = document.getElementById("start-stop");
const resetButton = document.getElementById("reset");
const workSessionsElement = document.getElementById("work-sessions");

function formatTime(milliseconds) {
  if (isNaN(milliseconds) || milliseconds < 0) return "00:00:00"; 
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  if (remainingTime < 0) remainingTime = state.workDuration;
  timeElement.textContent = formatTime(remainingTime);
  sessionTypeElement.textContent = sessionType;
}

function switchSession() {
  isRunning = false;
  pauseTime = null;

  if (sessionType === "Work") {
    workSessions++;
    workSessionsElement.textContent = workSessions;
    sessionType = workSessions % 4 === 0 ? "Long Break" : "Short Break";
    remainingTime = sessionType === "Long Break" ? state.longBreak : state.shortBreak;
  } else {
    sessionType = "Work";
    remainingTime = state.workDuration;
  }
  
  updateDisplay();
  toggleDoodlePad(); 
  playSound();
  
  // Auto-start next session and update button
  startStopButton.textContent = "Stop";
  startTimer(); 
}

function playSound() {
  const audio = new Audio("https://www.soundjay.com/button/beep-07.wav");
  audio.play();
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    startTime = Date.now();
    if (pauseTime) {
      startTime -= pauseTime;
      pauseTime = null;
    }
    runTimer();
  }
}

function runTimer() {
  if (!isRunning) return;
  const now = Date.now();
  const elapsedTime = now - startTime;
  remainingTime -= elapsedTime;
  startTime = now;

  if (remainingTime <= 0) {
    cancelAnimationFrame(timer);
    switchSession();
  } else {
    updateDisplay();
    timer = requestAnimationFrame(runTimer);
  }
}

function stopTimer() {
  if (isRunning) {
    isRunning = false;
    pauseTime = Date.now() - startTime;
    cancelAnimationFrame(timer);
  }
}

function resetTimer() {
  stopTimer();
  pauseTime = null;
  sessionType = "Work";
  remainingTime = state.workDuration;
  workSessions = 0;
  workSessionsElement.textContent = workSessions;
  updateDisplay();
  toggleDoodlePad();
  startStopButton.textContent = "Start";
}

startStopButton.addEventListener("click", () => {
  if (isRunning) {
    stopTimer();
    startStopButton.textContent = "Start";
  } else {
    startTimer();
    startStopButton.textContent = "Stop";
  }
});

resetButton.addEventListener("click", () => {
  resetTimer();
});

// ==========================================
// 2. CUSTOM TIMER SETTINGS LOGIC
// ==========================================
const applySettingsBtn = document.getElementById("apply-settings");

applySettingsBtn.addEventListener("click", () => {
  const workVal = parseInt(document.getElementById("work-duration").value);
  const shortVal = parseInt(document.getElementById("short-break").value);
  const longVal = parseInt(document.getElementById("long-break").value);

  if (workVal > 0) state.workDuration = workVal * 60000;
  if (shortVal > 0) state.shortBreak = shortVal * 60000;
  if (longVal > 0) state.longBreak = longVal * 60000;

  stopTimer();
  pauseTime = null; 
  startStopButton.textContent = "Start";

  if (sessionType === "Work") {
    remainingTime = state.workDuration;
  } else if (sessionType === "Short Break") {
    remainingTime = state.shortBreak;
  } else if (sessionType === "Long Break") {
    remainingTime = state.longBreak;
  }
  
  updateDisplay();
  
  const originalText = applySettingsBtn.textContent;
  applySettingsBtn.textContent = "Timer Updated! ✅";
  
  // Apply trendy glowing green success state
  applySettingsBtn.style.background = "rgba(85, 239, 196, 0.2)";
  applySettingsBtn.style.borderColor = "#55efc4";
  applySettingsBtn.style.color = "#55efc4";
  applySettingsBtn.style.boxShadow = "0 0 15px rgba(85, 239, 196, 0.3)";
  
  // Revert back to the trendy galaxy purple state
  setTimeout(() => {
    applySettingsBtn.textContent = originalText;
    applySettingsBtn.style.background = "rgba(162, 155, 254, 0.1)";
    applySettingsBtn.style.borderColor = "rgba(162, 155, 254, 0.4)";
    applySettingsBtn.style.color = "#a29bfe";
    applySettingsBtn.style.boxShadow = "none";
  }, 2000);
});

// ==========================================
// 3. DRAWING PAD LOGIC
// ==========================================
const canvas = document.getElementById("doodle-pad");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("color-picker");
const brushSize = document.getElementById("brush-size");
const clearBtn = document.getElementById("clear-canvas");
const drawingWorkspace = document.getElementById("drawing-workspace");
const focusMessage = document.getElementById("focus-message");

let isDrawing = false;

function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
clearCanvas();

function startPosition(e) {
  isDrawing = true;
  draw(e);
}

function endPosition() {
  isDrawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseout", endPosition);
clearBtn.addEventListener("click", clearCanvas);

function toggleDoodlePad() {
  if (sessionType === "Long Break") {
    focusMessage.classList.add("hidden");
    drawingWorkspace.classList.remove("hidden");
  } else {
    focusMessage.classList.remove("hidden");
    drawingWorkspace.classList.add("hidden");
  }
}

// Initialize display on load
updateDisplay();