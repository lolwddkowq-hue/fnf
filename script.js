"use strict";

/*
  Neon Beat Duel
  --------------
  Original placeholder rhythm game using only HTML, CSS, and vanilla JS.

  Editing the chart:
  Each chart note has:
    { time: millisecondsFromSongStart, direction: "left" | "down" | "up" | "right" }

  Replacing placeholder music:
  This game currently uses Web Audio API synth beeps.
  To use your own original song, create an Audio element in startSongAudio(),
  call audio.play() when the countdown ends, and align DEMO_CHART times to that song.

  Replacing placeholder characters:
  The characters are CSS divs in index.html.
  Replace those divs with your own original image/SVG art and keep the same
  #player and #opponent IDs for animation hooks.
*/

const DEMO_CHART = [
  { time: 900, direction: "left" },
  { time: 1300, direction: "down" },
  { time: 1700, direction: "up" },
  { time: 2100, direction: "right" },

  { time: 2700, direction: "left" },
  { time: 3100, direction: "left" },
  { time: 3500, direction: "down" },
  { time: 3900, direction: "up" },
  { time: 4300, direction: "right" },

  { time: 5100, direction: "down" },
  { time: 5500, direction: "up" },
  { time: 5900, direction: "down" },
  { time: 6300, direction: "right" },

  { time: 7000, direction: "left" },
  { time: 7200, direction: "down" },
  { time: 7600, direction: "up" },
  { time: 8000, direction: "right" },

  { time: 8600, direction: "right" },
  { time: 9000, direction: "up" },
  { time: 9400, direction: "down" },
  { time: 9800, direction: "left" },

  { time: 10600, direction: "left" },
  { time: 10800, direction: "down" },
  { time: 11000, direction: "up" },
  { time: 11200, direction: "right" },
  { time: 11600, direction: "up" },
  { time: 12000, direction: "down" },

  { time: 12800, direction: "left" },
  { time: 13200, direction: "right" },
  { time: 13600, direction: "left" },
  { time: 14000, direction: "right" },

  { time: 14800, direction: "down" },
  { time: 15200, direction: "up" },
  { time: 15400, direction: "up" },
  { time: 15600, direction: "down" },

  { time: 16400, direction: "left" },
  { time: 16800, direction: "down" },
  { time: 17200, direction: "up" },
  { time: 17600, direction: "right" },

  { time: 18400, direction: "right" },
  { time: 18600, direction: "up" },
  { time: 18800, direction: "down" },
  { time: 19000, direction: "left" },

  { time: 19800, direction: "left" },
  { time: 20200, direction: "down" },
  { time: 20600, direction: "up" },
  { time: 21000, direction: "right" },

  { time: 21800, direction: "down" },
  { time: 22000, direction: "left" },
  { time: 22200, direction: "up" },
  { time: 22400, direction: "right" },

  { time: 23200, direction: "left" },
  { time: 23600, direction: "down" },
  { time: 24000, direction: "up" },
  { time: 24400, direction: "right" },

  { time: 25200, direction: "right" },
  { time: 25600, direction: "up" },
  { time: 26000, direction: "down" },
  { time: 26400, direction: "left" },

  { time: 27200, direction: "left" },
  { time: 27400, direction: "down" },
  { time: 27600, direction: "up" },
  { time: 27800, direction: "right" },

  { time: 28600, direction: "down" },
  { time: 29000, direction: "up" },
  { time: 29400, direction: "left" },
  { time: 29800, direction: "right" }
];

const DIRECTIONS = ["left", "down", "up", "right"];

const KEY_TO_DIRECTION = {
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up",
  ArrowRight: "right"
};

const ARROW_SYMBOLS = {
  left: "◀",
  down: "▼",
  up: "▲",
  right: "▶"
};

const HIT_WINDOWS = {
  sick: 45,
  good: 90,
  bad: 135,
  miss: 170
};

const JUDGMENT_DATA = {
  sick: {
    label: "SICK!!",
    score: 350,
    accuracy: 1,
    health: 3.2
  },
  good: {
    label: "GOOD!",
    score: 220,
    accuracy: 0.78,
    health: 2
  },
  bad: {
    label: "BAD",
    score: 80,
    accuracy: 0.42,
    health: 0.8
  },
  miss: {
    label: "MISS",
    score: 0,
    accuracy: 0,
    health: -6
  }
};

const TONE_BY_DIRECTION = {
  left: 261.63,
  down: 329.63,
  up: 392,
  right: 523.25
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const screens = {
  loading: $("#loadingScreen"),
  title: $("#titleScreen"),
  gameplay: $("#gameplayScreen"),
  results: $("#resultsScreen")
};

const elements = {
  startButton: $("#startButton"),
  pauseButton: $("#pauseButton"),
  restartButton: $("#restartButton"),
  resumeButton: $("#resumeButton"),
  playAgainButton: $("#playAgainButton"),

  deviceHint: $("#deviceHint"),
  controlHint: $("#controlHint"),
  orientationWarning: $("#orientationWarning"),

  speedInput: $("#speedInput"),
  speedValue: $("#speedValue"),
  volumeInput: $("#volumeInput"),
  volumeValue: $("#volumeValue"),

  scoreText: $("#scoreText"),
  comboText: $("#comboText"),
  accuracyText: $("#accuracyText"),
  missesText: $("#missesText"),

  opponentHealth: $("#opponentHealth"),
  playerHealth: $("#playerHealth"),

  stage: $("#stage"),
  laneBoard: $("#laneBoard"),
  judgmentText: $("#judgmentText"),
  countdownText: $("#countdownText"),
  pauseOverlay: $("#pauseOverlay"),

  player: $("#player"),
  opponent: $("#opponent"),

  resultTitle: $("#resultTitle"),
  resultScore: $("#resultScore"),
  resultAccuracy: $("#resultAccuracy"),
  resultMaxCombo: $("#resultMaxCombo"),
  resultMisses: $("#resultMisses"),
  resultRank: $("#resultRank")
};

const lanes = Object.fromEntries(
  DIRECTIONS.map((direction) => [
    direction,
    document.querySelector(`.lane[data-direction="${direction}"]`)
  ])
);

const settings = {
  noteSpeed: Number(localStorage.getItem("nbd_note_speed")) || 420,
  volume: Number(localStorage.getItem("nbd_volume")) || 70
};

const deviceState = {
  isMobile: false,
  hasTouch: false
};

let currentScreen = "loading";
let audioContext = null;
let masterGain = null;

let notes = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
let misses = 0;
let judgedCount = 0;
let accuracyPoints = 0;
let health = 50;

let playing = false;
let paused = false;
let countingDown = false;
let songStartTime = 0;
let pauseStartedAt = 0;
let animationFrameId = null;
let songLength = 0;
let nextBeatIndex = 0;
let judgmentTimeout = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showScreen(name) {
  currentScreen = name;

  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  screens[name].classList.add("active");

  document.body.classList.toggle("game-active", name === "gameplay");
  updateViewportSize();
}

function syncSettingsUI() {
  elements.speedInput.value = String(settings.noteSpeed);
  elements.speedValue.textContent = String(settings.noteSpeed);

  elements.volumeInput.value = String(settings.volume);
  elements.volumeValue.textContent = `${settings.volume}%`;
}

function updateSettingsFromInputs() {
  settings.noteSpeed = Number(elements.speedInput.value);
  settings.volume = Number(elements.volumeInput.value);

  localStorage.setItem("nbd_note_speed", String(settings.noteSpeed));
  localStorage.setItem("nbd_volume", String(settings.volume));

  syncSettingsUI();

  if (masterGain) {
    masterGain.gain.value = settings.volume / 100;
  }
}

function updateViewportSize() {
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);

  const tooShortForGameplay =
    deviceState.isMobile &&
    currentScreen === "gameplay" &&
    window.innerHeight < 390;

  if (elements.orientationWarning) {
    elements.orientationWarning.classList.toggle("hidden", !tooShortForGameplay);
  }
}

function detectDeviceSupport() {
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasTouch =
    navigator.maxTouchPoints > 0 ||
    "ontouchstart" in window ||
    coarsePointer;

  const smallScreen = window.innerWidth <= 820;

  deviceState.hasTouch = hasTouch;
  deviceState.isMobile = hasTouch && smallScreen;

  document.body.classList.toggle("mobile", deviceState.isMobile);
  document.body.classList.toggle("desktop", !deviceState.isMobile);

  if (elements.deviceHint) {
    elements.deviceHint.textContent = deviceState.isMobile
      ? "Mobile mode detected: use the touch arrow buttons."
      : "PC mode detected: use your keyboard arrow keys.";
  }

  if (elements.controlHint) {
    elements.controlHint.textContent = deviceState.isMobile
      ? "Touch the arrows · Pause button available above"
      : "Keyboard: Arrow Keys · Pause: Escape";
  }

  updateViewportSize();
}

function initializeAudio() {
  if (audioContext) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContextClass();

  masterGain = audioContext.createGain();
  masterGain.gain.value = settings.volume / 100;
  masterGain.connect(audioContext.destination);
}

function playTone(frequency, duration = 0.08, type = "square", gain = 0.16) {
  if (!audioContext || !masterGain || settings.volume <= 0) return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const toneGain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(toneGain);
  toneGain.connect(masterGain);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playBeatSound(beatIndex) {
  const isDownbeat = beatIndex % 4 === 0;
  const isSnare = beatIndex % 4 === 2;

  if (isDownbeat) {
    playTone(82, 0.09, "sine", 0.22);
  } else if (isSnare) {
    playTone(170, 0.055, "triangle", 0.12);
  } else {
    playTone(110, 0.035, "sine", 0.07);
  }
}

/*
  Placeholder audio hook:
  Replace this function with an HTMLAudioElement if you add your own original song.

  Example:
    const music = new Audio("your-original-song.ogg");
    music.volume = settings.volume / 100;
    music.currentTime = 0;
    music.play();
*/
function startSongAudio() {
  // Current demo audio is generated in updateBeat().
}

function resetGameState() {
  cancelAnimationFrame(animationFrameId);

  notes = [];
  score = 0;
  combo = 0;
  maxCombo = 0;
  misses = 0;
  judgedCount = 0;
  accuracyPoints = 0;
  health = 50;
  playing = false;
  paused = false;
  countingDown = false;
  nextBeatIndex = 0;

  songLength = Math.max(...DEMO_CHART.map((note) => note.time)) + 3200;

  Object.values(lanes).forEach((lane) => {
    lane.querySelector(".note-stack").innerHTML = "";
  });

  notes = DEMO_CHART.map((chartNote, index) => {
    const direction = chartNote.direction;
    const lane = lanes[direction];
    const noteElement = document.createElement("div");

    noteElement.className = `note note-${direction}`;
    noteElement.textContent = ARROW_SYMBOLS[direction];
    noteElement.dataset.index = String(index);

    lane.querySelector(".note-stack").appendChild(noteElement);

    return {
      id: index,
      time: chartNote.time,
      direction,
      element: noteElement,
      hit: false,
      missed: false
    };
  });

  elements.pauseOverlay.classList.add("hidden");
  elements.countdownText.textContent = "";
  elements.judgmentText.textContent = "";

  updateHud();
}

function updateHud() {
  const accuracy = getAccuracy();
  const liveRank = getRank(accuracy);

  elements.scoreText.textContent = String(score);
  elements.comboText.textContent = String(combo);
  elements.accuracyText.textContent = `${accuracy.toFixed(1)}% ${liveRank}`;
  elements.missesText.textContent = String(misses);

  elements.playerHealth.style.width = `${health}%`;
  elements.opponentHealth.style.width = `${100 - health}%`;
}

function getAccuracy() {
  if (judgedCount === 0) return 100;
  return clamp((accuracyPoints / judgedCount) * 100, 0, 100);
}

function getRank(accuracy) {
  if (accuracy >= 96) return "S";
  if (accuracy >= 90) return "A";
  if (accuracy >= 82) return "B";
  if (accuracy >= 72) return "C";
  if (accuracy >= 60) return "D";
  return "F";
}

function getJudgment(deltaMs) {
  const absDelta = Math.abs(deltaMs);

  if (absDelta <= HIT_WINDOWS.sick) return "sick";
  if (absDelta <= HIT_WINDOWS.good) return "good";
  if (absDelta <= HIT_WINDOWS.bad) return "bad";

  return null;
}

function updateNotePositions(songTime) {
  const receptorTop = 18;
  const laneHeight = elements.laneBoard.clientHeight;

  notes.forEach((note) => {
    if (note.hit || note.missed) return;

    const msUntilHit = note.time - songTime;
    const y = receptorTop + (msUntilHit / 1000) * settings.noteSpeed;

    note.element.style.top = `${y}px`;

    const isVisible = y > -90 && y < laneHeight + 100;
    note.element.style.opacity = isVisible ? "1" : "0";
  });
}

function findBestNote(direction, songTime) {
  let bestNote = null;
  let bestDelta = Infinity;

  notes.forEach((note) => {
    if (note.direction !== direction || note.hit || note.missed) return;

    const delta = songTime - note.time;
    const absDelta = Math.abs(delta);

    if (absDelta <= HIT_WINDOWS.bad && absDelta < Math.abs(bestDelta)) {
      bestNote = note;
      bestDelta = delta;
    }
  });

  return {
    note: bestNote,
    delta: bestDelta
  };
}

function pressDirection(direction) {
  if (!playing || paused) return;

  const songTime = performance.now() - songStartTime;
  const { note, delta } = findBestNote(direction, songTime);

  flashInput(direction);

  if (!note) {
    registerGhostMiss();
    return;
  }

  const judgment = getJudgment(delta);

  if (!judgment) {
    registerGhostMiss();
    return;
  }

  hitNote(note, judgment);
}

function hitNote(note, judgment) {
  const data = JUDGMENT_DATA[judgment];

  note.hit = true;
  note.element.classList.add("hit");

  score += data.score + combo * 4;
  combo += 1;
  maxCombo = Math.max(maxCombo, combo);

  judgedCount += 1;
  accuracyPoints += data.accuracy;
  health = clamp(health + data.health, 0, 100);

  showJudgment(data.label, judgment);
  createSpark(note.direction);
  animatePlayerHit();
  playTone(TONE_BY_DIRECTION[note.direction], 0.085, "square", judgment === "sick" ? 0.2 : 0.13);

  if (judgment === "sick") {
    shakeStage("light");
  }

  setTimeout(() => {
    note.element.remove();
  }, 190);

  updateHud();
}

function missNote(note) {
  if (note.hit || note.missed) return;

  note.missed = true;
  note.element.classList.add("missed");

  applyMissPenalty();

  setTimeout(() => {
    note.element.remove();
  }, 250);
}

function registerGhostMiss() {
  applyMissPenalty();
  showJudgment("MISS", "miss");
  shakeStage("heavy");
  playTone(70, 0.12, "sawtooth", 0.08);
}

function applyMissPenalty() {
  combo = 0;
  misses += 1;
  judgedCount += 1;
  accuracyPoints += JUDGMENT_DATA.miss.accuracy;
  health = clamp(health + JUDGMENT_DATA.miss.health, 0, 100);

  updateHud();
}

function checkMissedNotes(songTime) {
  notes.forEach((note) => {
    if (note.hit || note.missed) return;

    if (songTime - note.time > HIT_WINDOWS.miss) {
      missNote(note);
      showJudgment("MISS", "miss");
      shakeStage("heavy");
    }
  });
}

function updateBeat(songTime) {
  const beatLength = 500;

  while (songTime >= nextBeatIndex * beatLength) {
    elements.opponent.classList.remove("beat");
    void elements.opponent.offsetWidth;
    elements.opponent.classList.add("beat");

    if (nextBeatIndex % 2 === 0) {
      elements.player.classList.remove("beat");
      void elements.player.offsetWidth;
      elements.player.classList.add("beat");
    }

    playBeatSound(nextBeatIndex);
    nextBeatIndex += 1;
  }
}

function gameLoop(now) {
  if (!playing || paused) return;

  const songTime = now - songStartTime;

  updateBeat(songTime);
  updateNotePositions(songTime);
  checkMissedNotes(songTime);
  updateHud();

  if (health <= 0) {
    endGame(false);
    return;
  }

  if (songTime >= songLength) {
    endGame(true);
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

async function startCountdown() {
  if (countingDown) return;

  initializeAudio();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  resetGameState();
  showScreen("gameplay");

  countingDown = true;

  const countItems = ["3", "2", "1", "GO"];

  for (const item of countItems) {
    elements.countdownText.textContent = item;
    elements.countdownText.classList.remove("pop");
    void elements.countdownText.offsetWidth;
    elements.countdownText.classList.add("pop");

    playTone(item === "GO" ? 523.25 : 220, 0.12, "triangle", item === "GO" ? 0.18 : 0.11);

    await wait(650);
  }

  elements.countdownText.textContent = "";
  elements.countdownText.classList.remove("pop");

  countingDown = false;
  playing = true;
  paused = false;
  songStartTime = performance.now();
  nextBeatIndex = 0;

  startSongAudio();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!playing) return;

  paused = !paused;

  if (paused) {
    pauseStartedAt = performance.now();
    elements.pauseOverlay.classList.remove("hidden");

    if (audioContext && audioContext.state === "running") {
      audioContext.suspend();
    }
  } else {
    const pausedDuration = performance.now() - pauseStartedAt;
    songStartTime += pausedDuration;
    elements.pauseOverlay.classList.add("hidden");

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function endGame(didWin) {
  playing = false;
  paused = false;
  countingDown = false;

  cancelAnimationFrame(animationFrameId);

  const accuracy = getAccuracy();
  const rank = getRank(accuracy);

  elements.resultTitle.textContent = didWin ? "You Won!" : "You Lost!";
  elements.resultScore.textContent = String(score);
  elements.resultAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  elements.resultMaxCombo.textContent = String(maxCombo);
  elements.resultMisses.textContent = String(misses);
  elements.resultRank.textContent = rank;

  showScreen("results");
}

function flashInput(direction) {
  const lane = lanes[direction];
  const receptor = lane.querySelector(".receptor");

  receptor.classList.add("pressed");

  setTimeout(() => {
    receptor.classList.remove("pressed");
  }, 120);

  const touchButton = document.querySelector(`[data-touch="${direction}"]`);

  if (touchButton) {
    touchButton.classList.add("active");

    setTimeout(() => {
      touchButton.classList.remove("active");
    }, 120);
  }
}

function createSpark(direction) {
  const lane = lanes[direction];
  const spark = document.createElement("div");

  spark.className = "spark";
  lane.appendChild(spark);

  setTimeout(() => {
    spark.remove();
  }, 300);
}

function showJudgment(text, type) {
  clearTimeout(judgmentTimeout);

  elements.judgmentText.textContent = text;
  elements.judgmentText.className = `judgment ${type} show`;

  judgmentTimeout = setTimeout(() => {
    elements.judgmentText.className = "judgment";
  }, 360);
}

function shakeStage(strength) {
  const className = strength === "heavy" ? "shake-heavy" : "shake-light";

  elements.stage.classList.remove("shake-heavy", "shake-light");
  void elements.stage.offsetWidth;
  elements.stage.classList.add(className);

  setTimeout(() => {
    elements.stage.classList.remove(className);
  }, strength === "heavy" ? 180 : 130);
}

function animatePlayerHit() {
  elements.player.classList.remove("hit");
  void elements.player.offsetWidth;
  elements.player.classList.add("hit");

  setTimeout(() => {
    elements.player.classList.remove("hit");
  }, 170);
}

function bindEvents() {
  elements.startButton.addEventListener("click", startCountdown);
  elements.playAgainButton.addEventListener("click", startCountdown);
  elements.restartButton.addEventListener("click", startCountdown);
  elements.pauseButton.addEventListener("click", togglePause);
  elements.resumeButton.addEventListener("click", togglePause);

  elements.speedInput.addEventListener("input", updateSettingsFromInputs);
  elements.volumeInput.addEventListener("input", updateSettingsFromInputs);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (currentScreen === "title" || currentScreen === "results") {
        startCountdown();
      }

      return;
    }

    if (event.key === "Escape") {
      if (currentScreen === "gameplay") {
        togglePause();
      }

      return;
    }

    const direction = KEY_TO_DIRECTION[event.key];

    if (!direction || event.repeat) return;

    event.preventDefault();
    pressDirection(direction);
  });

  $$(".touch-controls button").forEach((button) => {
    const direction = button.dataset.touch;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("active");
      pressDirection(direction);
    });

    button.addEventListener("pointerup", () => {
      button.classList.remove("active");
    });

    button.addEventListener("pointercancel", () => {
      button.classList.remove("active");
    });

    button.addEventListener("lostpointercapture", () => {
      button.classList.remove("active");
    });
  });

  window.addEventListener("resize", detectDeviceSupport);

  window.addEventListener("orientationchange", () => {
    setTimeout(detectDeviceSupport, 150);
  });

  document.addEventListener(
    "touchmove",
    (event) => {
      if (currentScreen === "gameplay") {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener("blur", () => {
    if (playing && !paused) {
      togglePause();
    }
  });
}

function boot() {
  syncSettingsUI();
  bindEvents();
  detectDeviceSupport();

  setTimeout(() => {
    showScreen("title");
  }, 850);
}

boot();
