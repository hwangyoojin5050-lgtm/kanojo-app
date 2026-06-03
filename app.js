const STORAGE_KEY = "your_next_seat_v2";
const MAX_AFFECTION = 1000;
const HAPPY_ENDING_MIN_AFFECTION = 500;
/** 시간 칸(1시간)별 공부 분 → 고정 색 단계. 진할수록 분이 많음. */
const HEATMAP_LEVEL_MINUTES = [0, 1, 10, 20, 40];
const MAX_PLAYER_NAME_LEN = 12;
const DEFAULT_PLAYER_NAME = "나";

const state = loadState();

const ui = {
  timerDisplay: document.getElementById("timerDisplay"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  resetBtn: document.getElementById("resetBtn"),
  goalInput: document.getElementById("goalInput"),
  saveGoalBtn: document.getElementById("saveGoalBtn"),
  todayStudyText: document.getElementById("todayStudyText"),
  goalProgressText: document.getElementById("goalProgressText"),
  goalProgressBar: document.getElementById("goalProgressBar"),
  streakText: document.getElementById("streakText"),
  stageText: document.getElementById("stageText"),
  affectionText: document.getElementById("affectionText"),
  dialogueText: document.getElementById("dialogueText"),
  affectionBar: document.getElementById("affectionBar"),
  unlockList: document.getElementById("unlockList"),
  sessionList: document.getElementById("sessionList"),
  sessionEditForm: document.getElementById("sessionEditForm"),
  editSessionId: document.getElementById("editSessionId"),
  editDate: document.getElementById("editDate"),
  editMinutes: document.getElementById("editMinutes"),
  characterName: document.getElementById("characterName"),
  sceneTitle: document.getElementById("sceneTitle"),
  choiceTitle: document.getElementById("choiceTitle"),
  choiceList: document.getElementById("choiceList"),
  storyNextBtn: document.getElementById("storyNextBtn"),
  storyNextSceneBtn: document.getElementById("storyNextSceneBtn"),
  storyLogBtn: document.getElementById("storyLogBtn"),
  resetStoryBtn: document.getElementById("resetStoryBtn"),
  simChoiceBox: document.querySelector(".sim-choice-box"),
  playerNameSetup: document.getElementById("playerNameSetup"),
  prologueNameInput: document.getElementById("prologueNameInput"),
  confirmPrologueNameBtn: document.getElementById("confirmPrologueNameBtn"),
  simMainImage: document.getElementById("simMainImage"),
  simProfileImage: document.getElementById("simProfileImage"),
  simScene: document.querySelector(".sim-scene"),
  cancelSessionEditBtn: document.getElementById("cancelSessionEditBtn"),
  weeklyTotalText: document.getElementById("weeklyTotalText"),
  aggregationStartText: document.getElementById("aggregationStartText"),
  weeklyStudyChart: document.getElementById("weeklyStudyChart"),
  studyHeatmap: document.getElementById("studyHeatmap"),
  heatmapDayLabels: document.getElementById("heatmapDayLabels"),
  heatmapHourLabels: document.getElementById("heatmapHourLabels"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  tabPanels: {
    timer: document.getElementById("tab-timer"),
    plannerSim: document.getElementById("tab-planner-sim"),
    stats: document.getElementById("tab-stats"),
  },
};

let timerHandle = null;
let startTimestamp = state.timerStartTimestamp;
let elapsedMs = state.timerElapsedMs;
let weeklyChart = null;

function defaultStoryState() {
  return {
    currentSceneId: "prologue",
    lineIndex: 0,
    phase: "lines",
    completedScenes: [],
    choices: {},
    ending: null,
    reactionIndex: 0,
  };
}

function loadState() {
  const fallback = {
    sessions: [],
    dailyGoalMin: 180,
    affection: 0,
    unlockedEvents: [],
    timerStartTimestamp: null,
    timerElapsedMs: 0,
    playerName: DEFAULT_PLAYER_NAME,
    nameConfirmed: false,
    story: defaultStoryState(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = { ...fallback, ...JSON.parse(raw) };
    parsed.sessions = (parsed.sessions || []).map((session) => ({
      ...session,
      id: session.id || crypto.randomUUID(),
    }));
    parsed.story = { ...defaultStoryState(), ...(parsed.story || {}) };
    parsed.playerName = normalizePlayerName(parsed.playerName) || DEFAULT_PLAYER_NAME;
    if (parsed.nameConfirmed === undefined) {
      const story = parsed.story;
      parsed.nameConfirmed =
        story.completedScenes.includes("prologue") ||
        story.currentSceneId !== "prologue" ||
        story.lineIndex > 0 ||
        Object.keys(story.choices).length > 0;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function getTotalStudyMinutes() {
  return Math.floor(
    state.sessions.reduce((acc, cur) => acc + (cur.durationMs || 0), 0) / 60000
  );
}

function normalizePlayerName(name) {
  if (typeof name !== "string") return "";
  return name.trim().slice(0, MAX_PLAYER_NAME_LEN);
}

function getPlayerName() {
  return normalizePlayerName(state.playerName) || DEFAULT_PLAYER_NAME;
}

function formatStoryText(text) {
  return text.replaceAll("○○", getPlayerName());
}

function needsPrologueNameSetup() {
  return (
    state.story.currentSceneId === "prologue" &&
    !state.nameConfirmed &&
    !state.story.completedScenes.includes("prologue")
  );
}

function setPlayerName(name, { confirm = false } = {}) {
  const next = normalizePlayerName(name);
  if (!next) return false;
  state.playerName = next;
  if (confirm) state.nameConfirmed = true;
  saveState();
  syncPlayerNameInputs();
  renderStory();
  return true;
}

function syncPlayerNameInputs() {
  if (ui.prologueNameInput && needsPrologueNameSetup()) {
    ui.prologueNameInput.value =
      state.playerName !== DEFAULT_PLAYER_NAME ? state.playerName : "";
  }
}

function renderPlayerNameUI() {
  const setupActive = needsPrologueNameSetup();
  ui.playerNameSetup?.classList.toggle("hidden", !setupActive);
  syncPlayerNameInputs();
}

function getStoryVisualSceneId() {
  if (state.story.ending === "happy") return "ending_happy";
  if (state.story.ending === "yandere") return "ending_yandere";

  const current = state.story.currentSceneId || "prologue";
  const stillPlaying =
    !state.story.completedScenes.includes(current) || state.story.phase !== "done";
  if (stillPlaying) return current;

  let latestUnlocked = "prologue";
  for (const sceneId of STORY_ORDER) {
    if (sceneId.startsWith("ending_")) continue;
    if (isSceneUnlocked(sceneId)) latestUnlocked = sceneId;
  }
  return latestUnlocked;
}

function renderSceneVisual() {
  const sceneId = getStoryVisualSceneId();
  const visual = STORY_VISUALS[sceneId] || STORY_VISUALS.prologue;
  const isScene = visual.variant === "scene";

  if (ui.simMainImage) {
    ui.simMainImage.src = visual.src;
    ui.simMainImage.alt = visual.alt;
    ui.simMainImage.classList.toggle("sim-main-image--character", !isScene);
    ui.simMainImage.classList.toggle("sim-main-image--scene", isScene);
    ui.simMainImage.classList.toggle("sim-main-image--grayscale", !!visual.grayscale);
    ui.simMainImage.classList.toggle("sim-main-image--dark", !!visual.dark);
  }

  if (ui.simProfileImage) {
    ui.simProfileImage.src = visual.src;
    ui.simProfileImage.alt = visual.alt;
    ui.simProfileImage.classList.toggle("sim-profile-image--scene", isScene);
  }

  ui.simScene?.classList.toggle("sim-scene--story-bg", isScene);
}

function showPrologueNameRequired(message) {
  ui.dialogueText.textContent = message;
  ui.storyNextBtn.classList.add("hidden");
}

function getScene(sceneId) {
  return STORY_SCENES[sceneId];
}

function isSceneUnlocked(sceneId) {
  const scene = getScene(sceneId);
  if (!scene) return false;
  if (scene.isEnding) return false;
  if (getTotalStudyMinutes() < (scene.unlockMinMinutes || 0)) return false;
  if (scene.unlockAffection && state.affection < scene.unlockAffection) return false;
  if (scene.requiresCompleted) {
    return scene.requiresCompleted.every((id) => state.story.completedScenes.includes(id));
  }
  return true;
}

function getPlayableSceneId() {
  if (state.story.ending) {
    return state.story.ending === "happy" ? "ending_happy" : "ending_yandere";
  }
  for (const sceneId of STORY_ORDER) {
    if (sceneId.startsWith("ending_")) continue;
    if (state.story.completedScenes.includes(sceneId)) continue;
    if (isSceneUnlocked(sceneId)) return sceneId;
  }
  return null;
}

function getCurrentScene() {
  return getScene(state.story.currentSceneId);
}

function startScene(sceneId) {
  state.story.currentSceneId = sceneId;
  state.story.lineIndex = 0;
  state.story.phase = "lines";
  state.story.reactionIndex = 0;
  saveState();
  renderStory();
}

function completeScene(sceneId) {
  if (!state.story.completedScenes.includes(sceneId)) {
    state.story.completedScenes.push(sceneId);
  }
}

function resolveEnding(endingKey) {
  const affectionOk = state.affection >= HAPPY_ENDING_MIN_AFFECTION;
  let ending = "yandere";
  if (endingKey === "happy" && affectionOk) {
    ending = "happy";
  }
  state.story.ending = ending;
  state.story.phase = "lines";
  state.story.lineIndex = 0;
  state.story.currentSceneId = ending === "happy" ? "ending_happy" : "ending_yandere";
  completeScene("event5");
  saveState();
  renderStory();
}

function getStageData(affection) {
  if (state.story.ending === "happy") {
    return { stage: "해피 엔딩", dialogue: "\"내 옆에서 절대 도망치지 마.\"" };
  }
  if (state.story.ending === "yandere") {
    return { stage: "얀데레 엔딩", dialogue: "\"영원히 내 옆자리에서.\"" };
  }
  if (affection >= 800) {
    return { stage: "연인 직전", dialogue: "\"오늘도 왔네... 이제 네가 없으면 심심해.\"" };
  }
  if (affection >= 500) {
    return { stage: "썸", dialogue: "\"너 진짜 꾸준하네. 같이 더 멀리 가보자.\"" };
  }
  if (affection >= 250) {
    return { stage: "친밀", dialogue: "\"네가 공부하는 모습, 보기 좋아.\"" };
  }
  if (affection >= 100) {
    return { stage: "어색한 친구", dialogue: "\"오... 또 공부했네? 조금 인상 달라졌어.\"" };
  }
  return { stage: "낯섦", dialogue: "\"안녕... 공부 열심히 해볼래?\"" };
}

function renderStory() {
  const scene = getCurrentScene();
  if (!scene) return;

  renderSceneVisual();
  renderPlayerNameUI();

  if (needsPrologueNameSetup()) {
    ui.sceneTitle.textContent = scene.title;
    ui.choiceList.innerHTML = "";
    ui.simChoiceBox?.classList.toggle("hidden", true);
    showPrologueNameRequired("이름을 입력한 뒤 「이 이름으로 시작하기」를 눌러 주세요.");
    return;
  }

  ui.sceneTitle.textContent = scene.title;
  ui.choiceList.innerHTML = "";
  ui.simChoiceBox?.classList.toggle("hidden", true);

  if (state.story.phase === "choice" && scene.choices) {
    ui.simChoiceBox.classList.remove("hidden");
    ui.choiceTitle.textContent = "Choose 1";
    scene.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${choice.id}. ${formatStoryText(choice.text)}`;
      btn.addEventListener("click", () => pickChoice(choice.id));
      ui.choiceList.appendChild(btn);
    });
    ui.dialogueText.textContent = "선택지를 골라주세요.";
    ui.storyNextBtn.classList.add("hidden");
    return;
  }

  const lines = getActiveLines(scene);
  const line = lines[state.story.lineIndex];
  if (!line) {
    if (scene.choices && state.story.phase === "lines") {
      state.story.phase = "choice";
      saveState();
      renderStory();
      return;
    }
    if (scene.postLines && state.story.phase === "lines") {
      state.story.phase = "post";
      state.story.lineIndex = 0;
      saveState();
      renderStory();
      return;
    }
    finishCurrentScene();
    return;
  }

  ui.storyNextBtn.classList.remove("hidden");
  ui.dialogueText.textContent = formatLine(line);
}

function getActiveLines(scene) {
  if (state.story.phase === "reaction") {
    const choiceId = state.story.choices[scene.id];
    const choice = scene.choices?.find((c) => c.id === choiceId);
    return choice?.reaction || [];
  }
  if (state.story.phase === "post" && scene.postLines) {
    return scene.postLines;
  }
  return scene.lines || [];
}

function formatLine(line) {
  const speakerMap = {
    player: getPlayerName(),
    anna: "안나",
    system: "시스템",
    narration: "",
  };
  const prefix = speakerMap[line.speaker] ? `${speakerMap[line.speaker]}: ` : "";
  return `${prefix}${formatStoryText(line.text)}`;
}

function advanceStoryLine() {
  const scene = getCurrentScene();
  if (!scene) return;
  if (needsPrologueNameSetup()) return;
  if (state.story.phase === "choice") return;

  state.story.lineIndex += 1;
  const lines = getActiveLines(scene);
  if (state.story.lineIndex >= lines.length) {
    if (state.story.phase === "reaction") {
      if (scene.postLines) {
        state.story.phase = "post";
        state.story.lineIndex = 0;
      } else {
        finishCurrentScene();
        return;
      }
    } else if (state.story.phase === "post") {
      finishCurrentScene();
      return;
    } else if (scene.choices && state.story.choices[scene.id] === undefined) {
      state.story.phase = "choice";
      state.story.lineIndex = 0;
    } else {
      finishCurrentScene();
      return;
    }
  }
  saveState();
  renderStory();
}

function pickChoice(choiceId) {
  const scene = getCurrentScene();
  if (!scene?.choices) return;
  const choice = scene.choices.find((c) => c.id === choiceId);
  if (!choice) return;

  state.story.choices[scene.id] = choiceId;
  recalculateAffectionAndUnlocks();

  if (scene.id === "event5" && choice.endingKey) {
    completeScene("event5");
    resolveEnding(choice.endingKey);
    return;
  }

  state.story.phase = "reaction";
  state.story.lineIndex = 0;
  saveState();
  renderStory();
}

function finishCurrentScene() {
  const sceneId = state.story.currentSceneId;
  completeScene(sceneId);

  if (state.story.ending) {
    ui.dialogueText.textContent = "엔딩에 도달했습니다. 공부를 계속하며 기록을 쌓아보세요.";
    ui.storyNextBtn.classList.add("hidden");
    saveState();
    renderUnlockList();
    renderStats();
    return;
  }

  const next = getPlayableSceneId();
  if (next && next !== sceneId) {
    startScene(next);
    return;
  }

  state.story.phase = "done";
  ui.dialogueText.textContent =
    "다음 스토리를 해금하려면 공부 시간을 더 쌓아주세요. (사건1: 5시간, 이후 호감도 상승)";
  ui.storyNextBtn.classList.add("hidden");
  saveState();
  renderUnlockList();
  renderStats();
}

function tryStartNextScene() {
  const next = getPlayableSceneId();
  if (!next || state.story.ending) return;
  startScene(next);
}

function resetStoryProgress() {
  const ok = window.confirm(
    "스토리를 프롤로그부터 다시 시작할까요?\n\n공부 기록·호감도(공부로 쌓은 부분)는 그대로 유지됩니다. 선택지 기록과 엔딩 진행만 초기화됩니다."
  );
  if (!ok) return;

  state.story = defaultStoryState();
  state.nameConfirmed = false;
  recalculateAffectionAndUnlocks();
  saveState();
  renderAll();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayStudyMinutes() {
  const today = getTodayKey();
  const todayTotalMs = state.sessions
    .filter((s) => s.dateKey === today)
    .reduce((acc, cur) => acc + cur.durationMs, 0);
  return Math.floor(todayTotalMs / 60000);
}

function getLastNDays(dayCount) {
  const days = [];
  const base = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(getTodayKey(d));
  }
  return days;
}

function formatKoreanDate(dateKey) {
  return dateKey.replaceAll("-", "/");
}

function formatHourMinute(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}시간 ${m}분`;
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function formatHeatmapDayLabel(dateKey) {
  const d = getDateFromKey(dateKey);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;
}

function getHeatmapIntensityLevel(minutes) {
  const m = Math.max(0, Math.floor(minutes));
  if (m <= 0) return 0;
  if (m < HEATMAP_LEVEL_MINUTES[2]) return 1;
  if (m < HEATMAP_LEVEL_MINUTES[3]) return 2;
  if (m < HEATMAP_LEVEL_MINUTES[4]) return 3;
  return 4;
}

function getHeatmapLevelRangeLabel(level) {
  const labels = ["0분", "1~9분", "10~19분", "20~39분", "40분 이상"];
  return labels[level] ?? "";
}

function calculateStreak() {
  const dayMap = new Map();
  for (const session of state.sessions) {
    dayMap.set(session.dateKey, (dayMap.get(session.dateKey) || 0) + session.durationMs);
  }
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getTodayKey(d);
    const ms = dayMap.get(key) || 0;
    if (ms >= 10 * 60 * 1000) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function getEarnedAffection(durationMs) {
  return Math.max(5, Math.floor(durationMs / (5 * 60 * 1000)) * 10);
}

function getChoiceBonusTotal() {
  let bonus = 0;
  for (const [sceneId, choiceId] of Object.entries(state.story.choices)) {
    const scene = getScene(sceneId);
    const choice = scene?.choices?.find((c) => c.id === choiceId);
    if (choice?.affectionBonus) bonus += choice.affectionBonus;
  }
  return bonus;
}

function recalculateAffectionAndUnlocks() {
  let totalAffection = 0;
  for (const session of state.sessions) {
    totalAffection += getEarnedAffection(session.durationMs || 0);
  }
  totalAffection += getChoiceBonusTotal();
  state.affection = Math.min(MAX_AFFECTION, totalAffection);
}

function renderUnlockList() {
  ui.unlockList.innerHTML = "";
  const items = STORY_ORDER.filter((id) => !id.startsWith("ending_"));
  for (const sceneId of items) {
    const scene = getScene(sceneId);
    const li = document.createElement("li");
    const done = state.story.completedScenes.includes(sceneId);
    const unlocked = isSceneUnlocked(sceneId);
    if (done) li.textContent = `✓ ${scene.title}`;
    else if (unlocked) li.textContent = `▶ ${scene.title} (진행 가능)`;
    else li.textContent = `🔒 ${scene.title}`;
    ui.unlockList.appendChild(li);
  }
  if (state.story.ending) {
    const li = document.createElement("li");
    const endScene = getScene(state.story.ending === "happy" ? "ending_happy" : "ending_yandere");
    li.textContent = `★ ${endScene.title} 달성`;
    ui.unlockList.appendChild(li);
  }
}

function renderSessions() {
  ui.sessionList.innerHTML = "";
  const recent = [...state.sessions].slice(-7).reverse();
  if (!recent.length) {
    const li = document.createElement("li");
    li.textContent = "아직 기록이 없습니다.";
    ui.sessionList.appendChild(li);
    return;
  }
  for (const s of recent) {
    const li = document.createElement("li");
    li.className = "session-item";

    const text = document.createElement("span");
    text.textContent = `${s.dateKey} | ${Math.floor(s.durationMs / 60000)}분`;
    li.appendChild(text);

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "session-edit-btn";
    editBtn.textContent = "수정";
    editBtn.dataset.sessionId = s.id;
    li.appendChild(editBtn);

    ui.sessionList.appendChild(li);
  }
}

function renderHeatmap() {
  const labels = getLastNDays(7);
  const hourOrder = [...Array(24).keys()];
  const dayMap = new Map(labels.map((day) => [day, new Map()]));

  ui.studyHeatmap.innerHTML = "";
  ui.heatmapDayLabels.innerHTML = "";
  ui.heatmapHourLabels.innerHTML = "";

  if (!labels.length) return;

  for (const day of labels) {
    const dayLabel = document.createElement("span");
    dayLabel.textContent = formatHeatmapDayLabel(day);
    ui.heatmapDayLabels.appendChild(dayLabel);
  }

  for (const hour of hourOrder) {
    const label = document.createElement("span");
    label.textContent = hour % 3 === 0 ? `${hour}시` : "";
    ui.heatmapHourLabels.appendChild(label);
  }

  const allowedDays = new Set(labels);

  for (const session of state.sessions) {
    if (!session.durationMs || session.durationMs <= 0) continue;
    const totalMinutes = Math.max(1, Math.floor(session.durationMs / 60000));
    let end = session.createdAt ? new Date(session.createdAt) : null;
    if (!end || Number.isNaN(end.getTime())) {
      end = new Date(`${session.dateKey}T12:00:00`);
    }
    let cursor = new Date(end);
    let remainingMinutes = totalMinutes;
    while (remainingMinutes > 0) {
      const dayKey = getTodayKey(cursor);
      if (allowedDays.has(dayKey)) {
        const hour = cursor.getHours();
        const prev = dayMap.get(dayKey).get(hour) || 0;
        dayMap.get(dayKey).set(hour, prev + 1);
      }
      cursor = new Date(cursor.getTime() - 60 * 1000);
      remainingMinutes -= 1;
    }
  }

  for (const day of labels) {
    for (const hour of hourOrder) {
      const total = dayMap.get(day).get(hour) || 0;
      const level = getHeatmapIntensityLevel(total);
      const cell = document.createElement("div");
      cell.className = `heatmap-cell heat-${level}`;
      if (total >= 10) {
        cell.textContent = String(total);
        cell.classList.add("heatmap-cell--labeled");
      }
      const rangeLabel = getHeatmapLevelRangeLabel(level);
      cell.title = `${formatHeatmapDayLabel(day)} ${String(hour).padStart(2, "0")}시 · ${total}분 (${rangeLabel})`;
      ui.studyHeatmap.appendChild(cell);
    }
  }
}

function renderWeeklyChart() {
  const labels = getLastNDays(7);
  const minuteData = labels.map((day) => {
    const totalMs = state.sessions
      .filter((s) => s.dateKey === day)
      .reduce((acc, cur) => acc + cur.durationMs, 0);
    return Math.floor(totalMs / 60000);
  });
  const hourData = minuteData.map((m) => Number((m / 60).toFixed(2)));
  const avgHour = hourData.length
    ? Number((hourData.reduce((acc, cur) => acc + cur, 0) / hourData.length).toFixed(2))
    : 0;

  const totalMinutes = Math.floor(state.sessions.reduce((acc, cur) => acc + cur.durationMs, 0) / 60000);
  const startDate = state.sessions.length
    ? [...state.sessions]
        .sort((a, b) => new Date(a.createdAt || `${a.dateKey}T00:00:00`) - new Date(b.createdAt || `${b.dateKey}T00:00:00`))[0]
        .dateKey
    : null;

  ui.weeklyTotalText.textContent = `누적 공부 시간  ${formatHourMinute(totalMinutes)}`;
  ui.aggregationStartText.textContent = `집계 시작일 : ${startDate ? `${formatKoreanDate(startDate)}~` : "-"}`;

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  const avgLinePlugin = {
    id: "avgLinePlugin",
    afterDraw(chartRef) {
      const { ctx, chartArea, scales } = chartRef;
      if (!chartArea || !scales?.y) return;
      const y = scales.y.getPixelForValue(avgHour);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#59a9ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#59a9ff";
      ctx.font = "12px Segoe UI";
      ctx.textAlign = "right";
      ctx.fillText("평균", chartArea.right - 4, y - 4);
      ctx.restore();
    },
  };

  weeklyChart = new Chart(ui.weeklyStudyChart, {
    type: "bar",
    data: {
      labels: labels.map(formatKoreanDate),
      datasets: [
        {
          label: "공부 시간(시간)",
          data: hourData,
          backgroundColor: "#3a9cf2",
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const idx = context.dataIndex;
              return ` ${formatHourMinute(minuteData[idx])}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#e1e1e1",
            maxRotation: 55,
            minRotation: 55,
          },
          grid: { color: "#676768" },
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: 8,
          ticks: {
            color: "#e1e1e1",
            stepSize: 2,
            callback(value) {
              return `${value}시간`;
            },
          },
          grid: { color: "#7b7b7c" },
        },
      },
    },
    plugins: [avgLinePlugin],
  });
}

function renderStats() {
  const todayMin = getTodayStudyMinutes();
  const goal = state.dailyGoalMin;
  const progress = Math.min(100, Math.round((todayMin / goal) * 100));
  const stage = getStageData(state.affection);

  ui.todayStudyText.textContent = `오늘 공부: ${todayMin}분`;
  ui.goalProgressText.textContent = `목표 달성률: ${progress}%`;
  ui.goalProgressBar.style.width = `${progress}%`;
  ui.streakText.textContent = `연속 학습일: ${calculateStreak()}일`;
  ui.goalInput.value = String(goal);

  ui.stageText.textContent = `관계 단계: ${stage.stage}`;
  ui.affectionText.textContent = `호감도: ${state.affection} / ${MAX_AFFECTION}`;
  ui.affectionBar.style.width = `${Math.min(100, (state.affection / MAX_AFFECTION) * 100)}%`;
  renderSceneVisual();
}

function renderTimer() {
  ui.timerDisplay.textContent = formatMs(elapsedMs + (startTimestamp ? Date.now() - startTimestamp : 0));
}

function startTimer() {
  if (startTimestamp) return;
  startTimestamp = Date.now();
  state.timerStartTimestamp = startTimestamp;
  saveState();
  timerHandle = setInterval(renderTimer, 200);
}

function stopTimerAndSave() {
  if (!startTimestamp && elapsedMs < 1000) return;
  if (startTimestamp) {
    elapsedMs += Date.now() - startTimestamp;
  }
  const durationMs = elapsedMs;
  if (durationMs >= 60 * 1000) {
    const dateKey = getTodayKey();
    state.sessions.push({
      id: crypto.randomUUID(),
      dateKey,
      durationMs,
      createdAt: new Date().toISOString(),
    });
    recalculateAffectionAndUnlocks();
    const nextScene = getPlayableSceneId();
    if (nextScene && state.story.phase === "done") {
      tryStartNextScene();
    }
  }
  startTimestamp = null;
  elapsedMs = 0;
  state.timerStartTimestamp = null;
  state.timerElapsedMs = 0;
  saveState();
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
  renderAll();
}

function openSessionEditor(sessionId) {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  ui.editSessionId.value = session.id;
  ui.editDate.value = session.dateKey;
  ui.editMinutes.value = String(Math.max(1, Math.floor((session.durationMs || 0) / 60000)));
  ui.sessionEditForm.classList.remove("hidden");
}

function closeSessionEditor() {
  ui.sessionEditForm.classList.add("hidden");
  ui.editSessionId.value = "";
}

function saveSessionEdit(event) {
  event.preventDefault();
  const sessionId = ui.editSessionId.value;
  const nextMinutes = Number(ui.editMinutes.value);
  const nextDate = ui.editDate.value;
  if (!sessionId || !nextDate || !Number.isFinite(nextMinutes) || nextMinutes < 1) return;

  const target = state.sessions.find((s) => s.id === sessionId);
  if (!target) return;

  target.dateKey = nextDate;
  target.durationMs = Math.floor(nextMinutes) * 60000;

  recalculateAffectionAndUnlocks();
  saveState();
  closeSessionEditor();
  renderAll();
}

function bindSessionEditActions() {
  ui.sessionList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest(".session-edit-btn");
    if (!btn) return;
    openSessionEditor(btn.dataset.sessionId);
  });
  ui.sessionEditForm.addEventListener("submit", saveSessionEdit);
  ui.cancelSessionEditBtn.addEventListener("click", closeSessionEditor);
}

function resetTimer() {
  startTimestamp = null;
  elapsedMs = 0;
  state.timerStartTimestamp = null;
  state.timerElapsedMs = 0;
  saveState();
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
  renderTimer();
}

function restoreRunningTimer() {
  if (state.timerStartTimestamp) {
    startTimestamp = state.timerStartTimestamp;
    timerHandle = setInterval(renderTimer, 200);
  }
}

function renderAll() {
  renderTimer();
  renderStats();
  renderSceneVisual();
  renderStory();
  renderUnlockList();
  renderSessions();
  renderWeeklyChart();
  renderHeatmap();
}

function bindStoryActions() {
  ui.storyNextBtn.addEventListener("click", advanceStoryLine);
  ui.storyNextSceneBtn.addEventListener("click", tryStartNextScene);
  ui.storyLogBtn.addEventListener("click", () => {
    activateTab("planner-sim");
    renderUnlockList();
  });
  ui.confirmPrologueNameBtn?.addEventListener("click", () => {
    if (!setPlayerName(ui.prologueNameInput.value, { confirm: true })) {
      showPrologueNameRequired("이름을 한 글자 이상 입력해 주세요.");
    }
  });
  ui.prologueNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") ui.confirmPrologueNameBtn?.click();
  });
  ui.resetStoryBtn?.addEventListener("click", resetStoryProgress);
}

function activateTab(tabName) {
  const tabMap = {
    timer: ui.tabPanels.timer,
    "planner-sim": ui.tabPanels.plannerSim,
    stats: ui.tabPanels.stats,
  };
  ui.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  Object.entries(tabMap).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === tabName);
  });
}

function bindTabs() {
  ui.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
}

ui.startBtn.addEventListener("click", startTimer);
ui.stopBtn.addEventListener("click", stopTimerAndSave);
ui.resetBtn.addEventListener("click", resetTimer);
ui.saveGoalBtn.addEventListener("click", () => {
  const next = Number(ui.goalInput.value);
  if (!Number.isFinite(next) || next < 10) return;
  state.dailyGoalMin = Math.floor(next);
  saveState();
  renderStats();
});

restoreRunningTimer();
bindTabs();
bindSessionEditActions();
bindStoryActions();
renderAll();
