/**
 * Timer app: stopwatch (count up) and countdown (count down).
 * Timing uses requestAnimationFrame + performance.now() so displayed time
 * derives from real elapsed milliseconds rather than counting "ticks" —
 * that keeps hour:minute:second:ms coherent even if the tab is throttled.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_SECOND = 1000;

const displayEl = document.getElementById("display");
const modeStopwatchBtn = document.getElementById("mode-stopwatch");
const modeCountdownBtn = document.getElementById("mode-countdown");
const countdownSetupEl = document.getElementById("countdown-setup");
const inputH = document.getElementById("input-h");
const inputM = document.getElementById("input-m");
const inputS = document.getElementById("input-s");
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const btnClear = document.getElementById("btn-clear");
const hintStopwatch = document.getElementById("hint-stopwatch");
const hintCountdown = document.getElementById("hint-countdown");

/** @type {'stopwatch' | 'countdown'} */
let mode = "stopwatch";

/** Whether the clock is actively advancing (start was pressed, not paused). */
let running = false;

/** rAF handle so we only have one loop at a time. */
let rafId = 0;

// --- Stopwatch: we store wall-clock anchors and sum of paused intervals ---
/** performance.now() when the current run segment started */
let stopwatchSegmentStart = 0;
/** Sum of completed run segments (ms), updated whenever we pause */
let stopwatchElapsedBeforeSegment = 0;

// --- Countdown: total duration and remaining at pause ---
/** When running: performance.now() at start of segment; remaining at segment start */
let countdownSegmentStart = 0;
let countdownRemainingAtSegmentStart = 0;

/** True after countdown hits zero until user clears or changes mode */
let countdownFinished = false;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

/** Convert a millisecond count into HH:MM:SS:mmm parts (non-negative). */
function splitMs(totalMs) {
  const ms = Math.max(0, Math.floor(totalMs));
  const h = Math.floor(ms / MS_PER_HOUR);
  const m = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  const milli = ms % MS_PER_SECOND;
  return { h, m, s, milli };
}

function formatDisplay(totalMs) {
  const { h, m, s, milli } = splitMs(totalMs);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}:${pad3(milli)}`;
}

function setDisplay(totalMs) {
  const text = formatDisplay(totalMs);
  displayEl.textContent = text;
  displayEl.setAttribute("datetime", `PT${Math.floor(totalMs / 1000)}S`);
}

/**
 * Stopwatch elapsed (ms): all completed segments + (now - segment start) if running.
 * Increment logic: we do NOT add a fixed slice per frame; we read elapsed
 * real time so display stays accurate even if frames are irregular.
 */
function getStopwatchElapsedMs(now) {
  if (running) {
    return stopwatchElapsedBeforeSegment + (now - stopwatchSegmentStart);
  }
  return stopwatchElapsedBeforeSegment;
}

/**
 * Countdown remaining (ms): at segment start we had R ms; each frame subtracts (now - start).
 */
function getCountdownRemainingMs(now) {
  if (countdownFinished) return 0;
  if (running) {
    const elapsedInSegment = now - countdownSegmentStart;
    return Math.max(0, countdownRemainingAtSegmentStart - elapsedInSegment);
  }
  return countdownRemainingAtSegmentStart;
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function tick(now) {
  if (mode === "stopwatch") {
    setDisplay(getStopwatchElapsedMs(now));
  } else {
    const remaining = getCountdownRemainingMs(now);
    setDisplay(remaining);
    if (running && remaining <= 0) {
      onCountdownComplete();
      return;
    }
  }
  if (running) {
    rafId = requestAnimationFrame(tick);
  }
}

function onCountdownComplete() {
  running = false;
  countdownFinished = true;
  countdownRemainingAtSegmentStart = 0;
  stopLoop();
  setDisplay(0);
  btnStart.textContent = "Start";
  btnStart.classList.remove("is-pause");
  document.body.classList.add("countdown-finished");
}

function clearFinishedAlert() {
  document.body.classList.remove("countdown-finished");
  countdownFinished = false;
}

function readCountdownInputsMs() {
  const h = Math.max(0, Number(inputH.value) || 0);
  const m = Math.min(59, Math.max(0, Number(inputM.value) || 0));
  const s = Math.min(59, Math.max(0, Number(inputS.value) || 0));
  return h * MS_PER_HOUR + m * MS_PER_MINUTE + s * MS_PER_SECOND;
}

function applyModeUI() {
  const isStopwatch = mode === "stopwatch";
  modeStopwatchBtn.setAttribute("aria-pressed", String(isStopwatch));
  modeCountdownBtn.setAttribute("aria-pressed", String(!isStopwatch));
  countdownSetupEl.classList.toggle("is-visible", !isStopwatch);
  hintStopwatch.hidden = !isStopwatch;
  hintCountdown.hidden = isStopwatch;
}

function setMode(next) {
  if (next === mode) return;
  pauseEngine();
  mode = next;
  clearFinishedAlert();
  applyModeUI();
  if (mode === "stopwatch") {
    stopwatchElapsedBeforeSegment = 0;
    stopwatchSegmentStart = performance.now();
    setDisplay(0);
  } else {
    countdownRemainingAtSegmentStart = readCountdownInputsMs();
    setDisplay(countdownRemainingAtSegmentStart);
  }
  syncStartButton();
}

function pauseEngine() {
  const now = performance.now();
  if (!running) return;
  running = false;
  stopLoop();
  if (mode === "stopwatch") {
    // Freeze elapsed: add this segment to the accumulated total
    stopwatchElapsedBeforeSegment += now - stopwatchSegmentStart;
  } else if (!countdownFinished) {
    countdownRemainingAtSegmentStart = getCountdownRemainingMs(now);
  }
}

function startEngine() {
  const now = performance.now();
  if (mode === "countdown" && countdownFinished) {
    clearFinishedAlert();
    countdownRemainingAtSegmentStart = readCountdownInputsMs();
    if (countdownRemainingAtSegmentStart <= 0) return;
  }
  if (mode === "countdown" && !running && countdownRemainingAtSegmentStart <= 0) {
    countdownRemainingAtSegmentStart = readCountdownInputsMs();
    if (countdownRemainingAtSegmentStart <= 0) return;
  }
  running = true;
  if (mode === "stopwatch") {
    stopwatchSegmentStart = now;
  } else {
    countdownSegmentStart = now;
  }
  rafId = requestAnimationFrame(tick);
}

function syncStartButton() {
  btnStart.textContent = running ? "Pause" : "Start";
  btnStart.classList.toggle("is-pause", running);
}

function onStartPause() {
  if (mode === "countdown" && countdownFinished) {
    clearFinishedAlert();
    countdownRemainingAtSegmentStart = readCountdownInputsMs();
    setDisplay(countdownRemainingAtSegmentStart);
  }
  if (running) {
    pauseEngine();
  } else {
    if (mode === "countdown") {
      const target =
        countdownRemainingAtSegmentStart > 0
          ? countdownRemainingAtSegmentStart
          : readCountdownInputsMs();
      if (target <= 0) return;
      countdownRemainingAtSegmentStart = target;
    }
    startEngine();
  }
  syncStartButton();
}

function onStop() {
  pauseEngine();
  syncStartButton();
}

function onClear() {
  pauseEngine();
  clearFinishedAlert();
  if (mode === "stopwatch") {
    stopwatchElapsedBeforeSegment = 0;
    stopwatchSegmentStart = performance.now();
    setDisplay(0);
  } else {
    countdownRemainingAtSegmentStart = readCountdownInputsMs();
    setDisplay(countdownRemainingAtSegmentStart);
  }
  syncStartButton();
}

modeStopwatchBtn.addEventListener("click", () => setMode("stopwatch"));
modeCountdownBtn.addEventListener("click", () => setMode("countdown"));
btnStart.addEventListener("click", onStartPause);
btnStop.addEventListener("click", onStop);
btnClear.addEventListener("click", onClear);

applyModeUI();
setDisplay(0);
syncStartButton();
