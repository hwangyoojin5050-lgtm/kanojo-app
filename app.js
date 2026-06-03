const STORAGE_KEY = "your_next_seat_v1";
const MAX_AFFECTION = 1000;

const state = loadState();

const ui = {
  timerDisplay: document.getElementById("timerDisplay"),
  subjectSelect: document.getElementById("subjectSelect"),
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
  editSubject: document.getElementById("editSubject"),
  editMinutes: document.getElementById("editMinutes"),
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

function loadState() {
  const fallback = {
    sessions: [],
    dailyGoalMin: 180,
    affection: 0,
    unlockedEvents: [],
    timerStartTimestamp: null,
    timerElapsedMs: 0,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = { ...fallback, ...JSON.parse(raw) };
    parsed.sessions = (parsed.sessions || []).map((session) => ({
      ...session,
      id: session.id || crypto.randomUUID(),
    }));
    return parsed;
  } catch {
    return fallback;
  }
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

function getSubjectClass(subject) {
  if (subject === "영어") return "subject-english";
  if (subject === "코딩" || subject === "국어") return "subject-korean";
  if (subject === "수학") return "subject-science";
  return "subject-etc";
}

function getStageData(affection) {
  if (affection >= 800) {
    return {
      stage: "연인 직전",
      dialogue: "\"오늘도 왔네... 이제 네가 없으면 심심해.\"",
    };
  }
  if (affection >= 500) {
    return {
      stage: "썸",
      dialogue: "\"너 진짜 꾸준하네. 같이 더 멀리 가보자.\"",
    };
  }
  if (affection >= 250) {
    return {
      stage: "친밀",
      dialogue: "\"네가 공부하는 모습, 보기 좋아.\"",
    };
  }
  if (affection >= 100) {
    return {
      stage: "어색한 친구",
      dialogue: "\"오... 또 공부했네? 조금 인상 달라졌어.\"",
    };
  }
  return {
    stage: "낯섦",
    dialogue: "\"안녕... 공부 열심히 해볼래?\"",
  };
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

function unlockEvents() {
  const rules = [
    { key: "e1", min: 100, title: "첫 칭찬 이벤트 해금" },
    { key: "e2", min: 300, title: "방과 후 데이트 스토리 해금" },
    { key: "e3", min: 600, title: "특별 일러스트 해금" },
    { key: "e4", min: 900, title: "엔딩 분기 조건 오픈" },
  ];
  for (const rule of rules) {
    if (state.affection >= rule.min && !state.unlockedEvents.includes(rule.key)) {
      state.unlockedEvents.push(rule.key);
    }
  }
}

function getEarnedAffection(durationMs) {
  return Math.max(5, Math.floor(durationMs / (5 * 60 * 1000)) * 10);
}

function recalculateAffectionAndUnlocks() {
  let totalAffection = 0;
  for (const session of state.sessions) {
    totalAffection += getEarnedAffection(session.durationMs || 0);
  }
  state.affection = Math.min(MAX_AFFECTION, totalAffection);
  state.unlockedEvents = [];
  unlockEvents();
}

function renderUnlockList() {
  const labelMap = {
    e1: "첫 칭찬 이벤트 해금",
    e2: "방과 후 데이트 스토리 해금",
    e3: "특별 일러스트 해금",
    e4: "엔딩 분기 조건 오픈",
  };
  ui.unlockList.innerHTML = "";
  if (state.unlockedEvents.length === 0) {
    const li = document.createElement("li");
    li.textContent = "아직 해금된 이벤트가 없습니다.";
    ui.unlockList.appendChild(li);
    return;
  }
  state.unlockedEvents.forEach((key) => {
    const li = document.createElement("li");
    li.textContent = `- ${labelMap[key]}`;
    ui.unlockList.appendChild(li);
  });
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
    text.textContent = `${s.dateKey} | ${s.subject} | ${Math.floor(s.durationMs / 60000)}분`;
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

  for (const hour of hourOrder) {
    const label = document.createElement("span");
    label.textContent = `${hour}`;
    ui.heatmapHourLabels.appendChild(label);
  }

  for (const day of labels) {
    const d = getDateFromKey(day);
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    const dayLabel = document.createElement("span");
    dayLabel.textContent = `${weekday}`;
    ui.heatmapDayLabels.appendChild(dayLabel);
  }

  for (const session of state.sessions) {
    if (!session.durationMs || session.durationMs <= 0) continue;
    let cursor = session.createdAt ? new Date(session.createdAt) : new Date(`${session.dateKey}T23:59:00`);
    let remainingMinutes = Math.max(1, Math.floor(session.durationMs / 60000));
    while (remainingMinutes > 0) {
      const dayKey = getTodayKey(cursor);
      if (dayMap.has(dayKey)) {
        const hour = cursor.getHours();
        const subject = session.subject || "기타";
        const hourBucket = dayMap.get(dayKey).get(hour) || { total: 0, bySubject: new Map() };
        hourBucket.total += 1;
        hourBucket.bySubject.set(subject, (hourBucket.bySubject.get(subject) || 0) + 1);
        dayMap.get(dayKey).set(hour, hourBucket);
      }
      cursor = new Date(cursor.getTime() - 60 * 1000);
      remainingMinutes -= 1;
    }
  }

  for (const day of labels) {
    for (const hour of hourOrder) {
      const bucket = dayMap.get(day).get(hour);
      const total = bucket?.total || 0;
      let maxSubject = "기타";
      if (bucket && bucket.bySubject.size > 0) {
        let max = 0;
        bucket.bySubject.forEach((value, subject) => {
          if (value > max) {
            max = value;
            maxSubject = subject;
          }
        });
      }
      const subjectClass = getSubjectClass(maxSubject);
      const opacity = total > 0 ? Math.min(1, 0.35 + total / 60) : 1;
      const d = getDateFromKey(day);
      const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    const cell = document.createElement("div");
      cell.className = `heatmap-cell ${total > 0 ? `active ${subjectClass}` : ""}`.trim();
      cell.style.opacity = String(opacity);
      cell.title = `${day}(${weekday}) ${String(hour).padStart(2, "0")}시: ${total}분`;
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
  ui.dialogueText.textContent = stage.dialogue;
  ui.affectionBar.style.width = `${Math.min(100, (state.affection / MAX_AFFECTION) * 100)}%`;
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
    const subject = ui.subjectSelect.value;
    state.sessions.push({
      id: crypto.randomUUID(),
      subject,
      dateKey,
      durationMs,
      createdAt: new Date().toISOString(),
    });
    recalculateAffectionAndUnlocks();
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
  ui.editSubject.value = session.subject || "기타";
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
  const nextSubject = ui.editSubject.value;
  if (!sessionId || !nextDate || !Number.isFinite(nextMinutes) || nextMinutes < 1) return;

  const target = state.sessions.find((s) => s.id === sessionId);
  if (!target) return;

  target.dateKey = nextDate;
  target.subject = nextSubject;
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
  renderUnlockList();
  renderSessions();
  renderWeeklyChart();
  renderHeatmap();
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
renderAll();
