// ========================================================
// Supabase 設定與實例化
// ========================================================
const SUPABASE_URL = "https://hqjqnbzzrduhdiwaxoxp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-xqiL_LXkK2pWt5UopJ5Nw__OxyEmOH";

let supabaseClient = null;
let currentUser = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 5) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase SDK 未載入或設定不正確，將以純本機模式運行。");
}

function triggerHaptic(duration = 20) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

let isSaving = false;
window.addEventListener('beforeunload', (e) => {
  if (isSaving) {
    e.preventDefault();
    e.returnValue = '資料正在儲存中，確定要離開嗎？';
  }
});

// ========================================================
// 主題清單
// ========================================================
const THEME_OPTIONS = {
  light: [
    { id: "light-swiss-blue", name: "1. 瑞士極簡蔚藍" }, { id: "light-sage-mist", name: "2. 鼠尾草晨霧綠" },
    { id: "light-cream-oat", name: "3. 奶油燕麥暖棕" }, { id: "light-nord-pastel", name: "4. 北歐粉彩晨曦" },
    { id: "light-raspberry", name: "5. 櫻桃木覆盆子" }, { id: "light-mint-aqua", name: "6. 薄荷海鹽沁藍" },
    { id: "light-lavender", name: "7. 法式薰衣草紫" }, { id: "light-sunset-gold", name: "8. 加州暖陽夕陽橘" },
    { id: "light-morandi", name: "9. 莫蘭迪石英灰" }, { id: "light-champagne", name: "10. 頂級香檳金" },
    { id: "light-mediterranean", name: "11. 地中海群青" }, { id: "light-matcha", name: "12. 京都抹茶焙茶" },
    { id: "light-apricot", name: "13. 甜杏馬卡龍" }, { id: "light-editorial", name: "14. 出版雜誌黑白" },
    { id: "light-iced-latte", name: "15. 淺焙冰滴拿鐵" }
  ],
  dark: [
    { id: "dark-tokyo-night", name: "1. 東京暗夜極光" }, { id: "dark-dracula", name: "2. 吸血鬼傳說" },
    { id: "dark-nord", name: "3. 北歐極光灰藍" }, { id: "dark-catppuccin", name: "4. 貓咪摩卡深棕" },
    { id: "dark-cyberpunk", name: "5. 賽博龐克霓虹" }, { id: "dark-gruvbox", name: "6. 復古暖調" },
    { id: "dark-nebula", name: "7. 深空星雲紫" }, { id: "dark-forest", name: "8. 森林暗夜松綠" },
    { id: "dark-matrix", name: "9. 黑客矩陣綠" }, { id: "dark-crimson", name: "10. 黑曜石血石紅" },
    { id: "dark-cobalt", name: "11. 暮光深海鈷藍" }, { id: "dark-amber", name: "12. 暖夜復古琥珀" },
    { id: "dark-oled", name: "13. OLED 純黑單色" }, { id: "dark-rose-pine", name: "14. 暮色玫瑰金" },
    { id: "dark-solarized", name: "15. 太陽能微光" }
  ]
};

const initialDefaultPeriods = [
  { id: 1, name: "第一節", start: "08:10", end: "09:00" }, { id: 2, name: "第二節", start: "09:10", end: "10:00" },
  { id: 3, name: "第三節", start: "10:10", end: "11:00" }, { id: 4, name: "第四節", start: "11:10", end: "12:00" },
  { id: 5, name: "第五節", start: "13:10", end: "14:00" }, { id: 6, name: "第六節", start: "14:10", end: "15:00" },
  { id: 7, name: "第七節", start: "15:10", end: "16:00" }, { id: 8, name: "第八節", start: "16:10", end: "17:00" },
  { id: 9, name: "第九節", start: "17:10", end: "18:00", optional: true }, { id: 10, name: "第十節", start: "18:10", end: "19:00", optional: true }
];

// 將 CELL_HEIGHT 設為 57 以完美匹配「56px高度 + 1px框線」的 DOM 渲染
const CELL_HEIGHT = 57;

// ========================================================
// 預設資料狀態與全域變數
// ========================================================
function createDefaultState() {
  const defaultSchId = "sch_" + Date.now();
  return {
    themeMode: "light", themeStyle: "light-swiss-blue", lastLightStyle: "light-swiss-blue", lastDarkStyle: "dark-tokyo-night",
    isEditMode: false, showLatePeriods: false, showTutoring: false, showDeadlines: true, textAlign: "center",
    is24HourMode: false, 
    billings: [], workBillings: [], finances: [], recurringFinances: [], 
    customCategories: null, categoryOrder: null, showHiddenItems: false,
    activeScheduleId: defaultSchId,
    schedules: [{
      id: defaultSchId, title: "115學年度上學期課表", startDate: "2026-09-07", endDate: "2027-01-10",
      periods: JSON.parse(JSON.stringify(initialDefaultPeriods)), courses: {}, tutorings: [], works: [], overrides: [], temporaryEvents: [], weeklyMemos: {}
    }]
  };
}

let state = createDefaultState();
let currentEditingSlot = null, currentEditingTutoringId = null, currentEditingWorkId = null, currentEditingBillingIndex = null, currentEditingWorkBillingIndex = null;
let currentViewingOverrideId = null, currentViewingTempEventId = null, currentEditingOverrideId = null, currentEditingTempEventId = null;
let currentWeekOffset = 0, currentSelectedStudentFilter = "__FILTER_ALL__", currentBillingType = "tutoring";
let financeActiveMode = "all", financeActiveMainCat = "all", financeActiveSubCat = "all", isExpenseChartVisible = false;
let activeCatTask = { type: "", pCat: "", sIdx: "" };

let tempDeadlines = [];
let currentEditingDeadlineIdx = null;

function getActiveSchedule() {
  if (!state.schedules || !Array.isArray(state.schedules) || state.schedules.length === 0) {
    const dId = "sch_" + Date.now();
    state.schedules = [{ id: dId, title: "115學年度上學期課表", startDate: "2026-09-07", endDate: "2027-01-10", periods: JSON.parse(JSON.stringify(initialDefaultPeriods)), courses: {}, tutorings: [], works: [], overrides: [], temporaryEvents: [], weeklyMemos: {} }];
    state.activeScheduleId = dId;
  }
  let sch = state.schedules.find((s) => s.id === state.activeScheduleId) || state.schedules[0];
  state.activeScheduleId = sch.id;
  sch.courses = sch.courses || {}; sch.tutorings = sch.tutorings || []; sch.works = sch.works || []; sch.overrides = sch.overrides || []; sch.temporaryEvents = sch.temporaryEvents || []; sch.weeklyMemos = sch.weeklyMemos || {}; sch.periods = sch.periods || JSON.parse(JSON.stringify(initialDefaultPeriods));
  return sch;
}

const DEFAULT_CATEGORIES = {
  expense: {
    "🍽️ 飲食": ["早餐", "午餐", "晚餐", "飲料零食", "外食聚餐", "食材買菜", "還款"], "🚗 交通": ["大眾運輸", "計程車", "油錢", "停車費", "維修保養"],
    "🛍️ 購物": ["服飾配件", "日用品", "3C科技", "美妝保養"], "🎉 娛樂": ["電影展覽", "旅遊度假", "手遊課金", "運動健身"],
    "🏠 居住": ["房租房貸", "水電瓦斯", "管理費", "家具家電"], "📚 教育": ["書籍雜誌", "線上課程", "學費考試"],
    "💊 醫療": ["門診藥品", "保險費", "體檢"], "📦 其他": ["還款", "其他支出"]
  },
  income: { "💰 工作收入": ["本業薪資", "家教收入", "兼職外快", "獎金紅利"], "📈 理財收入": ["股息股利", "利息收入", "投資變現"], "🧧 其他收入": ["中獎發票", "禮金紅包", "還款", "其他"] },
  transfer: { "🔄 帳戶轉帳": ["銀行互轉", "提款", "存款"] },
  receivable: { "📥 應收款項": ["代墊款項", "借出款項"] },
  payable: { "📤 應付款項": ["刷卡應付", "跟人借款"] }
};

function getCategories() { 
  if (!state.customCategories) state.customCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)); 
  return state.customCategories; 
}

function getCategoryKeys(type) {
  const cats = getCategories();
  if (!state.categoryOrder) state.categoryOrder = {};
  if (!state.categoryOrder[type]) {
    state.categoryOrder[type] = Object.keys(cats[type] || {});
  }
  const currentKeys = Object.keys(cats[type] || {});
  state.categoryOrder[type] = state.categoryOrder[type].filter(k => currentKeys.includes(k));
  currentKeys.forEach(k => {
    if (!state.categoryOrder[type].includes(k)) state.categoryOrder[type].push(k);
  });
  return state.categoryOrder[type];
}

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  return new Date(dateStr.replace(/-/g, '/'));
}

function timeToMinutes(timeStr) { if (!timeStr) return 0; const [h, m] = timeStr.split(":").map(Number); return (h || 0) * 60 + (m || 0); }
function isDaytimeSlot(startTime, endTime) { const startMin = timeToMinutes(startTime), endMin = timeToMinutes(endTime), dayStart = 8 * 60, dayEnd = 17 * 60; return (startMin >= dayStart && startMin <= dayEnd) || (endMin >= dayStart && endMin <= dayEnd); }

// 加入 hasNoonEvents 的判定，確保午休時間的渲染高度能精準偏移
function timeToPixelOffset(timeMins, periods, hasNoon = false) {
  if (!periods || periods.length === 0) return 0;
  const firstStart = timeToMinutes(periods[0].start); 
  if (timeMins <= firstStart) return 0;
  
  for (let i = 0; i < periods.length; i++) {
    const pStart = timeToMinutes(periods[i].start);
    const pEnd = timeToMinutes(periods[i].end);
    
    let currentNoonOffset = (hasNoon && periods[i].id >= 5) ? CELL_HEIGHT : 0;

    if (timeMins >= pStart && timeMins <= pEnd) {
      return i * CELL_HEIGHT + currentNoonOffset + ((timeMins - pStart) / (pEnd - pStart || 1)) * CELL_HEIGHT;
    }
    
    if (i < periods.length - 1) {
      const nextStart = timeToMinutes(periods[i + 1].start);
      if (timeMins > pEnd && timeMins < nextStart) {
         let nextNoonOffset = (hasNoon && periods[i + 1].id >= 5) ? CELL_HEIGHT : 0;
         return (i + 1) * CELL_HEIGHT + nextNoonOffset;
      }
    }
  }
  let finalNoonOffset = hasNoon ? CELL_HEIGHT : 0;
  return periods.length * CELL_HEIGHT + finalNoonOffset;
}

function getComputedThemeColor(variableName) { 
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim(); 
}
function getDefaultSchoolBgHex() { return rgbToHex(getComputedThemeColor("--school-def-bg")) || "#e0f2fe"; }
function getDefaultTutoringBgHex() { return rgbToHex(getComputedThemeColor("--tutoring-def-bg")) || "#fef3c7"; }
function getDefaultWorkBgHex() { return getDefaultTutoringBgHex(); }

function rgbToHex(rgbStr) {
  if (!rgbStr || rgbStr.startsWith("#")) return rgbStr; const match = rgbStr.match(/\d+/g); if (!match || match.length < 3) return null;
  return "#" + ((1 << 24) + (Number(match[0]) << 16) + (Number(match[1]) << 8) + Number(match[2])).toString(16).slice(1);
}
function getTextColorForBg(hexColor) {
  if (!hexColor || !hexColor.startsWith("#")) return "var(--text)"; let hex = hexColor.replace("#", ""); if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) >= 130 ? "#0f172a" : "#ffffff";
}

function clearAllCustomColors() {
  if (confirm("確定要清除所有自訂底色嗎？")) {
    triggerHaptic(25); const sch = getActiveSchedule();
    if (sch.courses) Object.keys(sch.courses).forEach((k) => delete sch.courses[k].color);
    if (sch.tutorings) sch.tutorings.forEach((t) => delete t.color);
    if (sch.works) sch.works.forEach((w) => delete w.color);
    saveToStorage(); renderSchedule(); alert("已清除！");
  }
}

function onTextAlignChange(val) { triggerHaptic(15); state.textAlign = val; saveToStorage(); renderSchedule(); }

function updatePresetDropdowns() {
  const sch = getActiveSchedule();
  const cSel = document.getElementById("sch-preset-select");
  if (cSel) {
    cSel.innerHTML = '<option value="">-- 選擇歷史課程 --</option>'; const uC = {};
    Object.values(sch.courses || {}).forEach((c) => { if (c.name && !uC[c.name]) { uC[c.name] = c; cSel.appendChild(new Option(c.name, JSON.stringify(c))); } });
  }
  const tSel = document.getElementById("tut-preset-select");
  if (tSel) {
    tSel.innerHTML = '<option value="">-- 選擇歷史家教 --</option>'; const uT = {};
    (sch.tutorings || []).forEach((t) => { if (t.student && !uT[t.student]) { uT[t.student] = t; tSel.appendChild(new Option(t.student, JSON.stringify(t))); } });
  }
  const wSel = document.getElementById("work-preset-select");
  if (wSel) {
    wSel.innerHTML = '<option value="">-- 選擇歷史工作 --</option>'; const uW = {};
    (state.schedules || []).forEach(s => (s.works || []).forEach(w => { if (w.name && !uW[w.name]) { uW[w.name] = w; wSel.appendChild(new Option(w.name, JSON.stringify(w))); } }));
  }
}

function onSelectPresetCourse(jsonStr) {
  if (!jsonStr) return;
  try {
    const c = JSON.parse(jsonStr);
    document.getElementById("sch-name").value = c.name || ""; document.getElementById("sch-room").value = c.room || ""; document.getElementById("sch-teacher").value = c.teacher || ""; document.getElementById("sch-memo").value = c.memo || "";
    if (c.type) {
      const typeSelect = document.getElementById("sch-type-select");
      if (Array.from(typeSelect.options).some(o => o.value === c.type)) { typeSelect.value = c.type; document.getElementById("sch-type-custom-wrap").style.display = "none"; }
      else { typeSelect.value = "custom"; document.getElementById("sch-type-custom-wrap").style.display = "block"; document.getElementById("sch-type-custom").value = c.type; }
    }
    document.getElementById("sch-color").value = c.color || getDefaultSchoolBgHex();
    if (c.deadlines) { tempDeadlines = JSON.parse(JSON.stringify(c.deadlines)); renderModalDeadlines(); }
  } catch (e) {
    console.error("Parse error:", e);
  }
}

function onSchTypeChange(val) { document.getElementById("sch-type-custom-wrap").style.display = val === "custom" ? "block" : "none"; }

function onSelectPresetTutoring(jsonStr) {
  if (!jsonStr) return;
  try {
    const t = JSON.parse(jsonStr);
    document.getElementById("tut-student").value = t.student || ""; if (t.day) document.getElementById("tut-day").value = t.day; if (t.startTime) document.getElementById("tut-start-time").value = t.startTime; if (t.endTime) document.getElementById("tut-end-time").value = t.endTime;
    document.getElementById("tut-subject").value = t.subject || ""; document.getElementById("tut-location").value = t.location || ""; document.getElementById("tut-line").value = t.line || ""; document.getElementById("tut-fb").value = t.fb || ""; document.getElementById("tut-phone").value = t.phone || "";
    if (t.rate) document.getElementById("tut-rate").value = t.rate; document.getElementById("tut-memo").value = t.memo || ""; document.getElementById("tut-color").value = t.color || getDefaultTutoringBgHex();
  } catch (e) {
    console.error("Parse error:", e);
  }
}

function onSelectPresetWork(jsonStr) {
  if (!jsonStr) return;
  try {
    const w = JSON.parse(jsonStr);
    document.getElementById("work-name").value = w.name || ""; if (w.day) document.getElementById("work-day").value = w.day; if (w.startTime) document.getElementById("work-start-time").value = w.startTime; if (w.endTime) document.getElementById("work-end-time").value = w.endTime;
    document.getElementById("work-location").value = w.location || ""; if (w.rate) document.getElementById("work-rate").value = w.rate; document.getElementById("work-memo").value = w.memo || ""; document.getElementById("work-color").value = w.color || getDefaultWorkBgHex();
  } catch (e) {
    console.error("Parse error:", e);
  }
}

function resetSchoolColor() { document.getElementById("sch-color").value = getDefaultSchoolBgHex(); document.getElementById("sch-color-desc").innerText = "目前使用：主題最適色"; }
function resetTutoringColor() { document.getElementById("tut-color").value = getDefaultTutoringBgHex(); }
function resetWorkColor() { document.getElementById("work-color").value = getDefaultWorkBgHex(); }

// ========================================================
// 雲端帳號同步
// ========================================================
async function checkAuthSession() {
  if (!supabaseClient) { document.getElementById("sync-user-text").innerText = "本機模式 (未連線)"; return; }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) { currentUser = session.user; updateUserUI(true, currentUser.email); await pullCloudData(); }
    else { updateUserUI(false); }
  } catch (e) { updateUserUI(false); }
}

function updateUserUI(isLoggedIn, email = "") {
  const dot = document.getElementById("sync-dot"), text = document.getElementById("sync-user-text"), btn = document.getElementById("btn-auth-action");
  text.style.color = "inherit";
  if (isLoggedIn) { dot.className = "status-dot online"; text.innerText = `已同步: ${email}`; btn.innerText = "登出"; btn.onclick = handleAuthLogout; }
  else { dot.className = "status-dot"; text.innerText = "未登入 (離線)"; btn.innerText = "登入 / 註冊"; btn.onclick = openAuthModal; }
}

function openAuthModal() { document.getElementById("auth-msg").innerText = ""; document.getElementById("auth-modal").classList.add("active"); }

async function handleAuthLogin() {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim(), password = document.getElementById("auth-password").value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { document.getElementById("auth-msg").innerText = "登入失敗：" + error.message; }
  else { currentUser = data.user; updateUserUI(true, currentUser.email); closeModal("auth-modal"); await pullCloudData(); alert("登入成功！"); }
}

async function handleAuthRegister() {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim(), password = document.getElementById("auth-password").value;
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) document.getElementById("auth-msg").innerText = "註冊失敗：" + error.message; else alert("註冊成功！");
}

async function handleAuthLogout() {
  if (!supabaseClient) return;
  if (confirm("確定登出？")) { await supabaseClient.auth.signOut(); currentUser = null; updateUserUI(false); }
}

async function pushCloudData() {
  if (!supabaseClient || !currentUser) return false;
  try { 
    const { error } = await supabaseClient.from("user_schedules").upsert({ user_id: currentUser.id, data: state, updated_at: new Date() });
    if (error) {
      console.error("雲端同步寫入失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) { 
    console.error("雲端同步發生例外錯誤:", e);
    return false;
  }
}

async function pullCloudData() {
  if (!supabaseClient || !currentUser) return;
  try {
    const { data } = await supabaseClient.from("user_schedules").select("data").eq("user_id", currentUser.id).single();
    if (data && data.data) {
      state = { ...createDefaultState(), ...data.data };
      state.recurringFinances = state.recurringFinances || [];
      if (state.showDeadlines === undefined) state.showDeadlines = true;
      localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
      applyTheme(); updatePresetDropdowns(); checkRecurringFinances();
      document.getElementById("chk-show-tutor").checked = Boolean(state.showTutoring);
      document.getElementById("chk-show-deadlines").checked = state.showDeadlines !== false;
      document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節";
      document.getElementById("text-align-select").value = state.textAlign || "center";
      renderSchedule(); renderBillings(); renderFinances();
    } else { await pushCloudData(); }
  } catch (e) {
    console.error("Cloud pull error:", e);
  }
}

async function saveToStorage() { 
  isSaving = true;
  const syncText = document.getElementById("sync-user-text");
  
  if (syncText && syncText.innerText !== "儲存中...") {
     syncText.dataset.orig = syncText.innerText;
     syncText.innerText = "儲存中...";
  }

  let syncSuccess = false;
  try { 
    localStorage.setItem("local_schedule_v2_data", JSON.stringify(state)); 
    updatePresetDropdowns(); 
    if (supabaseClient && currentUser) {
      syncSuccess = await pushCloudData(); 
    }
  } catch (e) {
    console.error("Storage/Cloud sync error:", e);
  } finally {
    isSaving = false;
    if (syncText) {
      if (currentUser) {
        syncText.innerText = syncSuccess ? `已同步: ${currentUser.email}` : "同步失敗 / 請檢查網路";
        syncText.style.color = syncSuccess ? "inherit" : "#ef4444";
      } else {
        syncText.innerText = "未登入 (離線)";
        syncText.style.color = "inherit";
      }
    }
  }
}

function toggleEditMode() { triggerHaptic(25); state.isEditMode = !state.isEditMode; updateEditModeBtn(); saveToStorage(); renderSchedule(); }
function updateEditModeBtn() {
  const btn = document.getElementById("btn-edit-mode-toggle"); if (!btn) return;
  if (state.isEditMode) { btn.innerHTML = "編輯中"; btn.className = "btn btn-warning btn-edit-mode"; }
  else { btn.innerHTML = "唯讀模式"; btn.className = "btn btn-secondary"; }
}

function toggle24HourMode() { 
  triggerHaptic(25); 
  state.is24HourMode = !state.is24HourMode; 
  update24HourModeBtn(); 
  saveToStorage(); 
  renderSchedule(); 
}

function update24HourModeBtn() {
  const btn = document.getElementById("btn-24h-mode-toggle"); if (!btn) return;
  if (state.is24HourMode) { btn.innerHTML = "節次模式"; btn.className = "btn btn-warning"; }
  else { btn.innerHTML = "24小時模式"; btn.className = "btn btn-secondary"; }
}

function initThemeDropdown() {
  const select = document.getElementById("theme-style-select"); if (!select) return; select.innerHTML = "";
  THEME_OPTIONS[state.themeMode || "light"].forEach((opt) => {
    const optionEl = document.createElement("option"); optionEl.value = opt.id; optionEl.innerText = opt.name;
    if (opt.id === state.themeStyle) optionEl.selected = true; select.appendChild(optionEl);
  });
}

function toggleThemeMode() {
  triggerHaptic(20);
  if (state.themeMode === "light") { state.lastLightStyle = state.themeStyle; state.themeMode = "dark"; state.themeStyle = state.lastDarkStyle || "dark-tokyo-night"; }
  else { state.lastDarkStyle = state.themeStyle; state.themeMode = "light"; state.themeStyle = state.lastLightStyle || "light-swiss-blue"; }
  applyTheme();
}

function onThemeStyleSelect(styleId) {
  triggerHaptic(20); state.themeStyle = styleId; state.themeMode = styleId.startsWith("dark") ? "dark" : "light";
  if (state.themeMode === "dark") state.lastDarkStyle = styleId; else state.lastLightStyle = styleId;
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme-style", state.themeStyle);
  const btn = document.getElementById("theme-toggle-btn"); if (btn) btn.innerText = state.themeMode === "dark" ? "淺色" : "深色";
  initThemeDropdown(); renderSchedule(); saveToStorage();
}

function toggleDeadlineBanner() {
  state.showDeadlines = document.getElementById("chk-show-deadlines").checked;
  saveToStorage(); renderSchedule();
}

// ========================================================
// 固定收支自動入帳檢查
// ========================================================
function checkRecurringFinances() {
  if (!state.recurringFinances) state.recurringFinances = [];
  let modified = false;
  
  const today = new Date(); 
  const curYear = today.getFullYear(); 
  const curMonth = today.getMonth() + 1; // 1-12
  const curDay = today.getDate();

  state.recurringFinances.forEach(item => {
    if (!item.lastTriggeredMonth) {
      const pm = curMonth === 1 ? 12 : curMonth - 1;
      const py = curMonth === 1 ? curYear - 1 : curYear;
      item.lastTriggeredMonth = `${py}-${String(pm).padStart(2, '0')}`;
    }

    let [lastY, lastM] = item.lastTriggeredMonth.split('-').map(Number);
    let checkY = lastY;
    let checkM = lastM + 1;
    if (checkM > 12) { checkM = 1; checkY++; }

    while (checkY < curYear || (checkY === curYear && checkM <= curMonth)) {
      const daysInCheckMonth = new Date(checkY, checkM, 0).getDate();
      const targetDay = Math.min(item.dayOfMonth, daysInCheckMonth);

      if (checkY === curYear && checkM === curMonth && curDay < targetDay) {
        break;
      }

      const entryDate = `${checkY}-${String(checkM).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      if (!state.finances) state.finances = [];
      state.finances.unshift({
        id: "fin_rec_" + Date.now() + Math.floor(Math.random() * 1000),
        date: entryDate, type: item.type, parentCat: item.parentCat, subCat: item.subCat, 
        amount: Number(item.amount), notes: item.notes || "固定收支", 
        remaining: (item.type === 'receivable' || item.type === 'payable') ? Number(item.amount) : undefined, 
        isHidden: false
      });

      item.lastTriggeredMonth = `${checkY}-${String(checkM).padStart(2, '0')}`;
      modified = true;

      checkM++;
      if (checkM > 12) { checkM = 1; checkY++; }
    }
  });

  if (modified) { saveToStorage(); renderFinances(); }
}

function init() {
  const saved = localStorage.getItem("local_schedule_v2_data");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state = { ...createDefaultState(), ...parsed }; state.recurringFinances = state.recurringFinances || [];
        if (state.showDeadlines === undefined) state.showDeadlines = true;
        if (!parsed.schedules || !Array.isArray(parsed.schedules) || parsed.schedules.length === 0) {
          const dId = "sch_" + Date.now();
          state.schedules = [{
            id: dId, title: parsed.scheduleTitle || "115學年度上學期課表", startDate: parsed.scheduleStartDate || "2026-09-07", endDate: parsed.scheduleEndDate || "2027-01-10",
            periods: parsed.periods || JSON.parse(JSON.stringify(initialDefaultPeriods)), courses: parsed.courses || {}, tutorings: parsed.tutorings || [], works: parsed.works || [], overrides: parsed.overrides || [], temporaryEvents: parsed.temporaryEvents || [], weeklyMemos: parsed.weeklyMemos || {}
          }];
          state.activeScheduleId = dId;
        }
      }
    } catch (e) {
      console.error("Init parse error:", e);
    }
  }

  document.documentElement.setAttribute("data-theme-style", state.themeStyle);
  initThemeDropdown(); document.getElementById("theme-toggle-btn").innerText = state.themeMode === "dark" ? "淺色" : "深色";
  document.getElementById("chk-show-tutor").checked = Boolean(state.showTutoring);
  document.getElementById("chk-show-deadlines").checked = state.showDeadlines !== false;
  document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節";
  document.getElementById("text-align-select").value = state.textAlign || "center";

  const now = new Date(), ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!document.getElementById("bill-month-filter").value) document.getElementById("bill-month-filter").value = ym;
  if (!document.getElementById("fin-month-filter").value) document.getElementById("fin-month-filter").value = ym;

  updateEditModeBtn(); update24HourModeBtn(); updatePresetDropdowns(); checkRecurringFinances();
  renderSchedule(); renderBillings(); renderFinances(); checkAuthSession();
}

function getMondayOfWeek(d, offsetWeeks = 0) { const date = new Date(d), day = date.getDay(); date.setDate(date.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7); date.setHours(0, 0, 0, 0); return date; }
function getWeekKey(d) { return formatDate(getMondayOfWeek(d, currentWeekOffset)); }
function formatDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatSlashDate(dateStr) { const p = dateStr.split("-"); return p.length === 3 ? `${p[0]}/${Number(p[1])}/${Number(p[2])}` : dateStr; }
function formatShortDate(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }

function changeWeek(offset) { triggerHaptic(15); currentWeekOffset += offset; renderSchedule(); }
function resetCurrentWeek() { triggerHaptic(15); currentWeekOffset = 0; renderSchedule(); }
function toggleTutorView() { state.showTutoring = document.getElementById("chk-show-tutor").checked; saveToStorage(); renderSchedule(); }
function toggleLatePeriods() { state.showLatePeriods = !state.showLatePeriods; document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節"; saveToStorage(); renderSchedule(); }

function switchView(view) {
  triggerHaptic(20);
  document.getElementById("tab-btn-schedule").classList.toggle("active", view === "schedule");
  document.getElementById("tab-btn-billing").classList.toggle("active", view === "billing");
  document.getElementById("tab-btn-finance").classList.toggle("active", view === "finance");
  document.getElementById("schedule-view").style.display = view === "schedule" ? "block" : "none";
  document.getElementById("billing-view").style.display = view === "billing" ? "block" : "none";
  document.getElementById("finance-view").style.display = view === "finance" ? "block" : "none";
  if (view === "billing") renderBillings(); if (view === "finance") renderFinances();
}

function openScheduleSelectModal() {
  const listEl = document.getElementById("schedule-select-list"); listEl.innerHTML = "";
  (state.schedules || []).forEach((sch) => {
    const isActive = sch.id === state.activeScheduleId;
    const item = document.createElement("div");
    item.style = `display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border); background:${isActive ? "var(--today-header-bg)" : "transparent"}; border-radius:6px; margin-bottom:4px;`;
    item.innerHTML = `<div><div style="font-weight:700; font-size:0.85rem; color:${isActive ? "var(--today-header-text)" : "var(--text)"};">${escapeHtml(sch.title)}</div><div style="font-size:0.68rem; color:var(--text-muted);">${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}</div></div>
      <div style="display:flex; gap:4px;">${!isActive ? `<button class="btn" style="padding:2px 6px; font-size:0.68rem;" onclick="switchActiveSchedule('${sch.id}')">切換</button>` : `<span class="tag-paid" style="font-size:0.68rem;">目前使用</span>`}
      ${state.schedules.length > 1 ? `<button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteSchedule('${sch.id}')">刪除</button>` : ""}</div>`;
    listEl.appendChild(item);
  });
  document.getElementById("schedule-select-modal").classList.add("active");
}
function switchActiveSchedule(schId) { triggerHaptic(20); state.activeScheduleId = schId; saveToStorage(); updatePresetDropdowns(); renderSchedule(); closeModal("schedule-select-modal"); }
function openCreateScheduleModal() { document.getElementById("new-sch-title").value = ""; document.getElementById("new-sch-start").value = formatDate(new Date()); document.getElementById("new-sch-end").value = "2027-01-10"; closeModal("schedule-select-modal"); document.getElementById("create-schedule-modal").classList.add("active"); }
function confirmCreateSchedule() {
  const title = document.getElementById("new-sch-title").value.trim(), start = document.getElementById("new-sch-start").value, end = document.getElementById("new-sch-end").value;
  if (!title || !start || !end) return alert("請完整填寫！");
  const newId = "sch_" + Date.now();
  state.schedules.push({ id: newId, title, startDate: start, endDate: end, periods: JSON.parse(JSON.stringify(initialDefaultPeriods)), courses: {}, tutorings: [], works: [], overrides: [], temporaryEvents: [], weeklyMemos: {} });
  state.activeScheduleId = newId; saveToStorage(); updatePresetDropdowns(); renderSchedule(); closeModal("create-schedule-modal"); alert(`已建立並切換至「${title}」！`);
}
function deleteSchedule(schId) { if (state.schedules.length <= 1) return alert("必須保留至少一個課表！"); if (confirm("確定刪除此課表？")) { state.schedules = state.schedules.filter((s) => s.id !== schId); if (state.activeScheduleId === schId) state.activeScheduleId = state.schedules[0].id; saveToStorage(); updatePresetDropdowns(); renderSchedule(); openScheduleSelectModal(); } }
function openScheduleConfigModal() { const sch = getActiveSchedule(); document.getElementById("sch-conf-title").value = sch.title || "學期課表"; document.getElementById("sch-conf-start").value = sch.startDate || "2026-09-07"; document.getElementById("sch-conf-end").value = sch.endDate || "2027-01-10"; document.getElementById("schedule-config-modal").classList.add("active"); }
function saveScheduleConfig() { const title = document.getElementById("sch-conf-title").value.trim() || "學期課表", start = document.getElementById("sch-conf-start").value, end = document.getElementById("sch-conf-end").value; if (!start || !end) return alert("請完整填寫日期！"); const sch = getActiveSchedule(); sch.title = title; sch.startDate = start; sch.endDate = end; saveToStorage(); renderSchedule(); closeModal("schedule-config-modal"); }

// ==========================================
// 點擊事件與詳細
// ==========================================
function handleSlotClick(day, periodId) { triggerHaptic(15); const sch = getActiveSchedule(); const course = sch.courses ? sch.courses[`${day}_${periodId}`] : null; if (!state.isEditMode) openViewDetailModal("school", { day, periodId, course: course || {} }); else openSchoolModal(day, periodId); }
function handleTutoringClick(tId) { triggerHaptic(15); const sch = getActiveSchedule(); const tut = (sch.tutorings || []).find((t) => t.id === tId); if (!tut) return; if (!state.isEditMode) openViewDetailModal("tutoring", { tut }); else openTutoringModal(tId); }
function handleWorkClick(wId) { triggerHaptic(15); const sch = getActiveSchedule(); const work = (sch.works || []).find((w) => w.id === wId); if (!work) return; if (!state.isEditMode) openViewDetailModal("work", { work }); else openWorkModal(wId); }
function handleOverrideClick(ovrId) { triggerHaptic(15); const sch = getActiveSchedule(); const ovr = (sch.overrides || []).find((o) => o.id === ovrId); if (!ovr) return; if (!state.isEditMode) openViewDetailModal("override", { ovr }); else openOverrideModal(ovrId); }
function handleTempEventClick(tmpId) { triggerHaptic(15); const sch = getActiveSchedule(); const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId); if (!tmp) return; if (!state.isEditMode) openViewDetailModal("temp_event", { tmp }); else openTempEventModal(tmpId); }

function openViewDetailModal(type, payload) {
  const sch = getActiveSchedule(), dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  const titleEl = document.getElementById("view-detail-title"), bodyEl = document.getElementById("view-detail-body"), switchBtn = document.getElementById("btn-switch-to-edit"), revertBtn = document.getElementById("btn-revert-override");
  revertBtn.style.display = "none"; switchBtn.style.display = "inline-flex"; switchBtn.innerText = "進入編輯"; currentViewingOverrideId = null; currentViewingTempEventId = null; const weekKey = getWeekKey(new Date());

  if (type === "school") {
    const { day, periodId, course } = payload; titleEl.innerText = course.name || "空堂";
    const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`school_${day}_${periodId}`]) || "";
    bodyEl.innerHTML = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[day]} 第 ${periodId} 節</div>${course.type ? `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(course.type)}</div>` : ""}${course.room ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(course.room)}</div>` : ""}${course.teacher ? `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(course.teacher)}</div>` : ""}${course.memo ? `<div class="detail-label">總備忘錄</div><div class="detail-value">${escapeHtmlWithBr(course.memo)}</div>` : ""}${weeklyMemo ? `<div class="detail-label">每周備忘錄</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(weeklyMemo)}</div>` : ""}</div>`;
    switchBtn.onclick = () => { closeModal("view-detail-modal"); openSchoolModal(day, periodId); };
  } else if (type === "tutoring") {
    const { tut } = payload; titleEl.innerText = `家教: ${tut.student}`;
    const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${tut.id}`]) || "";
    bodyEl.innerHTML = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[tut.day]} ${tut.startTime} ~ ${tut.endTime}</div>${tut.subject ? `<div class="detail-label">科目</div><div class="detail-value">${escapeHtml(tut.subject)}</div>` : ""}${tut.location ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tut.location)}</div>` : ""}${tut.memo ? `<div class="detail-label">備忘錄</div><div class="detail-value">${escapeHtmlWithBr(tut.memo)}</div>` : ""}${weeklyMemo ? `<div class="detail-label">每周備忘錄</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(weeklyMemo)}</div>` : ""}</div>`;
    switchBtn.onclick = () => { closeModal("view-detail-modal"); openTutoringModal(tut.id); };
  } else if (type === "work") {
    const { work } = payload; titleEl.innerText = `工作: ${work.name}`;
    bodyEl.innerHTML = `<div class="detail-card"><div class="detail-label">類型</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${work.type === "weekly" ? "每週工作" : "固定工作"}</div><div class="detail-label">時間</div><div class="detail-value">${dayNames[work.day]} ${work.startTime} ~ ${work.endTime}</div>${work.location ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(work.location)}</div>` : ""}${work.memo ? `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(work.memo)}</div>` : ""}</div>`;
    switchBtn.onclick = () => { closeModal("view-detail-modal"); openWorkModal(work.id); };
  } else if (type === "override") {
    const { ovr } = payload; currentViewingOverrideId = ovr.id; titleEl.innerText = `調課: ${ovr.title}`;
    bodyEl.innerHTML = `<div class="detail-card"><div class="detail-label">目標時間</div><div class="detail-value">${ovr.targetDate} (${ovr.startTime}~${ovr.endTime})</div>${ovr.memo ? `<div class="detail-label">備註</div><div class="detail-value">${escapeHtmlWithBr(ovr.memo)}</div>` : ""}</div>`;
    switchBtn.onclick = () => { closeModal("view-detail-modal"); openOverrideModal(ovr.id); }; revertBtn.style.display = "inline-flex";
  } else if (type === "temp_event") {
    const { tmp } = payload; currentViewingTempEventId = tmp.id; titleEl.innerText = `事件: ${tmp.title}`;
    bodyEl.innerHTML = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[tmp.day]} ${tmp.startTime}~${tmp.endTime}</div>${tmp.location ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tmp.location)}</div>` : ""}${tmp.memo ? `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(tmp.memo)}</div>` : ""}</div>`;
    switchBtn.onclick = () => { closeModal("view-detail-modal"); openTempEventModal(tmp.id); };
  }
  document.getElementById("view-detail-modal").classList.add("active");
}

function revertCurrentOverride() { if (confirm("確定取消此調課？")) { const sch = getActiveSchedule(); sch.overrides = (sch.overrides || []).filter(o => o.id !== currentViewingOverrideId); saveToStorage(); renderSchedule(); closeModal("view-detail-modal"); } }
function deleteOverrideFromModal() { if (confirm("確定刪除此調課？")) { const sch = getActiveSchedule(); sch.overrides = (sch.overrides || []).filter(o => o.id !== currentEditingOverrideId); saveToStorage(); renderSchedule(); closeModal("override-modal"); } }
function deleteTempEventFromModal() { if (confirm("確定刪除此事件？")) { const sch = getActiveSchedule(); sch.temporaryEvents = (sch.temporaryEvents || []).filter(t => t.id !== currentEditingTempEventId); saveToStorage(); renderSchedule(); closeModal("temp-event-modal"); } }

function openPeriodConfigModal() {
  const sch = getActiveSchedule(), tbody = document.getElementById("period-config-body"); tbody.innerHTML = "";
  (sch.periods || initialDefaultPeriods).forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td style="font-weight:700;">${p.id}</td><td><input type="text" id="cfg-pname-${idx}" value="${escapeHtml(p.name)}"></td><td><input type="time" id="cfg-pstart-${idx}" value="${p.start}"></td><td><input type="time" id="cfg-pend-${idx}" value="${p.end}"></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("period-config-modal").classList.add("active");
}
function savePeriodConfig() {
  const sch = getActiveSchedule(), updated = [], current = sch.periods || initialDefaultPeriods;
  for (let i = 0; i < current.length; i++) {
    const name = document.getElementById(`cfg-pname-${i}`).value.trim() || `第 ${i + 1} 節`, start = document.getElementById(`cfg-pstart-${i}`).value, end = document.getElementById(`cfg-pend-${i}`).value;
    if (!start || !end) return alert(`請填寫第 ${i + 1} 節時間！`);
    updated.push({ id: current[i].id, name, start, end, optional: Boolean(current[i].optional) });
  }
  sch.periods = updated; saveToStorage(); renderSchedule(); closeModal("period-config-modal");
}
function resetPeriodsToDefault() { if (confirm("恢復預設節次？")) { getActiveSchedule().periods = JSON.parse(JSON.stringify(initialDefaultPeriods)); saveToStorage(); openPeriodConfigModal(); renderSchedule(); } }

// ==========================================
// 死線與倒數看板 (Deadlines)
// ==========================================
function toggleDeadlineList() {
  document.getElementById("deadline-list").classList.toggle("active");
  document.getElementById("deadline-toggle-icon").innerText = document.getElementById("deadline-list").classList.contains("active") ? "▲ 收合" : "▼ 展開全部";
}

function renderDeadlinesBanner() {
  const banner = document.getElementById("deadline-banner");
  if (state.showDeadlines === false) { banner.style.display = "none"; return; }

  const sch = getActiveSchedule();
  let rawDl = [];
  if (sch.courses) {
    Object.keys(sch.courses).forEach(k => {
      const c = sch.courses[k];
      if (c && c.deadlines) c.deadlines.forEach(dl => { rawDl.push({ ...dl, courseName: c.name }); });
    });
  }

  const uniqueMap = {}; let allDl = [];
  rawDl.forEach(dl => {
    const key = `${dl.courseName}_${dl.title}_${dl.date}`;
    if (!uniqueMap[key]) { uniqueMap[key] = true; allDl.push(dl); }
  });

  const today = new Date(); today.setHours(0,0,0,0);
  allDl = allDl.filter(dl => { 
    const dDate = parseLocalDate(dl.date); 
    dDate.setHours(0,0,0,0); 
    return dDate >= today; 
  });
  allDl.sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  if (allDl.length === 0) { banner.style.display = "none"; return; }
  banner.style.display = "block";

  const urgentDl = [], normalDl = [];
  allDl.forEach(dl => {
    const d = parseLocalDate(dl.date); 
    d.setHours(0,0,0,0);
    const df = Math.round((d - today) / (1000*60*60*24));
    dl.diffDays = df; dl.diffText = df === 0 ? "今天" : `${df} 天後`;
    if (df < 7) urgentDl.push(dl); else normalDl.push(dl);
  });

  const headerTextEl = document.getElementById("deadline-closest-text");
  if (urgentDl.length > 0) {
    headerTextEl.innerHTML = urgentDl.map(dl => `距 [${escapeHtml(dl.courseName)}] ${escapeHtml(dl.title)} <span style="color:var(--primary); margin-left:4px;">${dl.diffText}</span>`).join('');
  } else {
    const closest = normalDl[0];
    headerTextEl.innerHTML = `距 [${escapeHtml(closest.courseName)}] ${escapeHtml(closest.title)} 還有 ${closest.diffDays} 天`;
  }

  const listEl = document.getElementById("deadline-list"); listEl.innerHTML = "";
  allDl.forEach(dl => {
    const d = parseLocalDate(dl.date);
    const item = document.createElement("div"); item.className = "deadline-item";
    item.innerHTML = `<span><b>[${escapeHtml(dl.courseName)}]</b> ${escapeHtml(dl.title)}</span> <span style="color:var(--primary); font-weight:600;">${dl.diffText} (${formatShortDate(d)})</span>`;
    listEl.appendChild(item);
  });
}

function renderModalDeadlines() {
  const container = document.getElementById("sch-deadlines-container"); container.innerHTML = "";
  if (tempDeadlines.length === 0) { container.innerHTML = `<div style="font-size:0.7rem; color:var(--text-muted);">無排定日程</div>`; return; }
  tempDeadlines.sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));
  tempDeadlines.forEach((dl, idx) => {
    const row = document.createElement("div");
    row.style = "display:flex; justify-content:space-between; align-items:center; background:var(--table-th-bg); padding:4px 6px; border-radius:4px; margin-bottom:4px; font-size:0.75rem;";
    row.innerHTML = `<span>${escapeHtml(dl.title)} <b style="color:var(--primary);">${formatSlashDate(dl.date)}</b></span>
    <div><button class="btn btn-secondary" style="padding:1px 4px; font-size:0.6rem; margin-right:4px;" onclick="editSchoolDeadline(${idx})">編</button><button class="btn btn-danger" style="padding:1px 4px; font-size:0.6rem;" onclick="removeSchoolDeadline(${idx})">刪</button></div>`;
    container.appendChild(row);
  });
}

function addSchoolDeadline() {
  const title = document.getElementById("sch-new-dl-title").value.trim(), date = document.getElementById("sch-new-dl-date").value;
  if (!title || !date) return alert("請填寫日程名稱與日期！");
  
  if (currentEditingDeadlineIdx !== null) {
    tempDeadlines[currentEditingDeadlineIdx] = { id: tempDeadlines[currentEditingDeadlineIdx].id, title, date };
    currentEditingDeadlineIdx = null; document.getElementById("btn-add-dl").innerText = "新增";
  } else {
    tempDeadlines.push({ id: "dl_" + Date.now(), title, date });
  }
  document.getElementById("sch-new-dl-title").value = ""; renderModalDeadlines();
}

function editSchoolDeadline(idx) {
  currentEditingDeadlineIdx = idx; const dl = tempDeadlines[idx];
  document.getElementById("sch-new-dl-title").value = dl.title;
  document.getElementById("sch-new-dl-date").value = dl.date;
  document.getElementById("btn-add-dl").innerText = "儲存";
}

function removeSchoolDeadline(idx) { tempDeadlines.splice(idx, 1); renderModalDeadlines(); }

// ==========================================
// 渲染課表
// ==========================================
function renderSchedule() {
  if (state.is24HourMode) {
    render24HourSchedule();
  } else {
    renderOriginalSchedule();
  }
}

function render24HourSchedule() {
  try {
    const sch = getActiveSchedule(), monday = getMondayOfWeek(new Date(), currentWeekOffset);
    const maxDays = state.showTutoring ? 7 : 5, rangeEnd = new Date(monday); rangeEnd.setDate(monday.getDate() + (maxDays - 1));
    const weekKey = getWeekKey(new Date()), alignClass = `align-${state.textAlign || "center"}`;

    document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
    document.getElementById("schedule-footer-banner").innerHTML = `📅 ${escapeHtml(sch.title)} (${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[切換/新增]</span>`;

    const tableEl = document.getElementById("schedule-table");
    if (tableEl) tableEl.style.width = state.showTutoring ? "calc(68px + (100% - 68px) / 5 * 7)" : "100%";

    const thead = document.getElementById("schedule-head"); thead.innerHTML = "";
    const headTr = document.createElement("tr"); headTr.innerHTML = `<th class="col-time">時間</th>`;
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"], todayStr = formatDate(new Date()), weekDates = [];

    for (let i = 0; i < maxDays; i++) {
      const curDate = new Date(monday); curDate.setDate(monday.getDate() + i);
      const dateStr = formatDate(curDate); weekDates.push(dateStr);
      const th = document.createElement("th"); if (dateStr === todayStr) th.className = "today-header";
      th.innerHTML = `<div>${dayNames[i + 1]}</div><div style="font-size:0.62rem; font-weight:normal;">${formatShortDate(curDate)}</div>`;
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);

    const tbody = document.getElementById("schedule-body"); tbody.innerHTML = "";
    const schStart = parseLocalDate(sch.startDate || "2026-09-07"), schEnd = parseLocalDate(sch.endDate || "2027-01-10");
    schStart.setHours(0,0,0,0); schEnd.setHours(23,59,59,999);

    if (rangeEnd < schStart || monday > schEnd) {
      tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`;
      renderDeadlinesBanner(); return;
    }
    renderDeadlinesBanner();

    const periods24 = Array.from({length: 24}, (_, i) => ({ 
      id: `h${i}`, name: `${i}:00`, 
      start: `${String(i).padStart(2, '0')}:00`, 
      end: `${String(i + 1).padStart(2, '0')}:00` 
    }));
    
    const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
    const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);
    const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));
    const overriddenCourseKeys = new Set((sch.overrides || []).filter((o) => o.type === "school").map((o) => o.sourceKey));

    periods24.forEach((p, pIdx) => {
      const tr = document.createElement("tr");
      const timeTh = document.createElement("td");
      timeTh.className = "col-time"; 
      timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div>`; 
      tr.appendChild(timeTh);

      for (let d = 1; d <= maxDays; d++) {
        const td = document.createElement("td");
        const currentCellDateStr = weekDates[d - 1];
        const wrapper = document.createElement("div"); wrapper.className = "table-col-wrapper";
        const slotDiv = document.createElement("div"); slotDiv.className = "cell-slot";
        slotDiv.innerHTML = `<span style="color:transparent; font-size:0.75rem;">+</span>`;
        wrapper.appendChild(slotDiv);

        if (pIdx === 0) {
          const overlayContainer = document.createElement("div"); 
          overlayContainer.className = "col-overlay-container";
          overlayContainer.style.height = `${24 * CELL_HEIGHT}px`;

          const renderList = [];
          
          const prevCellDateObj = new Date(monday);
          prevCellDateObj.setDate(monday.getDate() + (d - 1) - 1);
          const prevCellDateStr = formatDate(prevCellDateObj);
          const prevD = d === 1 ? 7 : d - 1;

          // 核心跨夜切分與佈局邏輯
          const addSegments = (item, itemDay, itemDate, clickFn, getInnerHtml, defBgVar, defTextVar, itemType) => {
              const sm = timeToMinutes(item.startTime || "00:00");
              const em = timeToMinutes(item.endTime || "00:00");
              const isCross = sm > em; 

              let segments = [];
              if (itemDate !== undefined) {
                  if (itemDate === currentCellDateStr && !isCross) segments.push({ ...item });
                  if (itemDate === currentCellDateStr && isCross) segments.push({ ...item, endTime: "24:00", isStartSegment: true });
                  if (itemDate === prevCellDateStr && isCross) segments.push({ ...item, startTime: "00:00", isEndSegment: true });
              } else {
                  if (Number(itemDay) === d && !isCross) segments.push({ ...item });
                  if (Number(itemDay) === d && isCross) segments.push({ ...item, endTime: "24:00", isStartSegment: true });
                  if (Number(itemDay) === prevD && isCross) segments.push({ ...item, startTime: "00:00", isEndSegment: true });
              }

              segments.forEach(seg => {
                  renderList.push({
                      color: seg.color, startTime: seg.startTime, endTime: seg.endTime, 
                      itemType: itemType, clickFn: () => clickFn(item.id), 
                      innerHtml: getInnerHtml(seg), defBgVar, defTextVar,
                      isStartSegment: seg.isStartSegment, isEndSegment: seg.isEndSegment
                  });
              });
          };

          // 1. 學校正規課程 (自動合併連續同名課程)
          const dayCourses = [];
          (sch.periods || initialDefaultPeriods).forEach(sp => {
              const key = `${d}_${sp.id}`;
              const course = sch.courses ? sch.courses[key] : null;
              if (course && course.name && !overriddenCourseKeys.has(key)) {
                  dayCourses.push({ sp: { ...sp }, course, key });
              }
          });
          const mergedCourses = [];
          dayCourses.forEach(curr => {
              if (mergedCourses.length > 0) {
                  const last = mergedCourses[mergedCourses.length - 1];
                  if (last.course.name === curr.course.name) {
                      last.sp.end = curr.sp.end; // 同名且接續，自動合併
                      return;
                  }
              }
              mergedCourses.push(curr);
          });
          mergedCourses.forEach(item => {
              renderList.push({ 
                  color: item.course.color, startTime: item.sp.start, endTime: item.sp.end, itemType: 'is-school', 
                  clickFn: () => handleSlotClick(d, item.sp.id), 
                  innerHtml: `${(sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`school_${item.key}`]) ? `<span class="memo-badge">📌</span>` : ""}<div class="item-title">${escapeHtml(item.course.name)}</div>${item.course.room ? `<div class="item-sub">${escapeHtml(item.course.room)}</div>` : ""}`, 
                  defBgVar: '--school-def-bg', defTextVar: '--school-def-text' 
              });
          });

          // 2. 家教
          (sch.tutorings || []).forEach(t => {
              if (overriddenSourceIds.has(t.id)) return;
              addSegments(t, t.day, undefined, handleTutoringClick, 
                  (seg) => `${(sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${t.id}`]) ? `<span class="memo-badge">📌</span>` : ""}<div class="item-title">${escapeHtml(t.student)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`, 
                  '--tutoring-def-bg', '--tutoring-def-text', 'is-tutoring');
          });

          // 3. 工作
          currentWeekWorks.forEach(w => {
              if (overriddenSourceIds.has(w.id)) return;
              addSegments(w, w.day, undefined, handleWorkClick, 
                  (seg) => `<div class="item-title">${escapeHtml(w.name)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`, 
                  '--work-def-bg', '--work-def-text', 'is-work');
          });

          // 4. Overrides
          (sch.overrides || []).forEach(o => {
              addSegments(o, undefined, o.targetDate, handleOverrideClick, 
                  (seg) => `<div class="item-title">${escapeHtml(o.title)}</div>`, 
                  '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp');
          });

          // 5. 臨時事件
          currentWeekTempEvents.forEach(t => {
              let st = t.startTime, et = t.endTime;
              if (t.slotType === "noon") { st = "12:00"; et = "13:00"; }
              if (t.slotType === "period") {
                  const spObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId));
                  if (spObj) { st = spObj.start; et = spObj.end; }
              }
              const proxyItem = { ...t, startTime: st || "12:00", endTime: et || "13:00" };
              addSegments(proxyItem, t.day, undefined, handleTempEventClick, 
                  (seg) => `<div class="item-title">${escapeHtml(t.title)}</div>${t.location ? `<div class="item-sub">${escapeHtml(t.location)}</div>` : ""}`, 
                  '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp');
          });

          // 開始繪製
          renderList.forEach(item => {
              const sm = timeToMinutes(item.startTime);
              const em = timeToMinutes(item.endTime === "24:00" ? "24:00" : item.endTime); 
              
              const topPx = timeToPixelOffset(sm, periods24);
              const bottomPx = timeToPixelOffset(em, periods24);
              
              let cardTop = topPx + 2; 
              let cardHeight = Math.max(bottomPx - topPx, 20) - 4;
              let radiusStyle = "";
              
              if (item.isStartSegment) {
                  radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none;";
                  cardHeight = bottomPx - topPx - 2; 
              }
              if (item.isEndSegment) {
                  radiusStyle = "border-top-left-radius: 0; border-top-right-radius: 0; border-top: none;";
                  cardTop = topPx; 
                  cardHeight = bottomPx - topPx - 2; 
              }

              const floatCard = document.createElement("div"); 
              floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
              floatCard.style = `${item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`} top: ${cardTop}px; height: ${cardHeight}px; ${radiusStyle}`;
              floatCard.onclick = (e) => { e.stopPropagation(); item.clickFn(); };
              floatCard.innerHTML = item.innerHtml; 
              overlayContainer.appendChild(floatCard);
          });

          wrapper.appendChild(overlayContainer);
        }
        td.appendChild(wrapper); tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  } catch (err) { console.error("Render 24h schedule error:", err); }
}

function renderOriginalSchedule() {
  try {
    const sch = getActiveSchedule(), monday = getMondayOfWeek(new Date(), currentWeekOffset);
    const maxDays = state.showTutoring ? 7 : 5, rangeEnd = new Date(monday); rangeEnd.setDate(monday.getDate() + (maxDays - 1));
    const weekKey = getWeekKey(new Date()), alignClass = `align-${state.textAlign || "center"}`;

    document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
    document.getElementById("schedule-footer-banner").innerHTML = `📅 ${escapeHtml(sch.title)} (${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[切換/新增]</span>`;

    const tableEl = document.getElementById("schedule-table");
    if (tableEl) tableEl.style.width = state.showTutoring ? "calc(68px + (100% - 68px) / 5 * 7)" : "100%";

    const thead = document.getElementById("schedule-head"); thead.innerHTML = "";
    const headTr = document.createElement("tr"); headTr.innerHTML = `<th class="col-time">節次</th>`;
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"], todayStr = formatDate(new Date()), weekDates = [];

    for (let i = 0; i < maxDays; i++) {
      const curDate = new Date(monday); curDate.setDate(monday.getDate() + i);
      const dateStr = formatDate(curDate); weekDates.push(dateStr);
      const th = document.createElement("th"); if (dateStr === todayStr) th.className = "today-header";
      th.innerHTML = `<div>${dayNames[i + 1]}</div><div style="font-size:0.62rem; font-weight:normal;">${formatShortDate(curDate)}</div>`;
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);

    const tbody = document.getElementById("schedule-body"); tbody.innerHTML = "";
    
    const schStart = parseLocalDate(sch.startDate || "2026-09-07"), schEnd = parseLocalDate(sch.endDate || "2027-01-10");
    schStart.setHours(0,0,0,0); schEnd.setHours(23,59,59,999);

    if (rangeEnd < schStart || monday > schEnd) {
      tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`;
      renderDeadlinesBanner(); return;
    }

    renderDeadlinesBanner();

    const periodsToRender = (sch.periods || initialDefaultPeriods).filter((p) => !p.optional || state.showLatePeriods);
    const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
    const hasNoonEvents = currentWeekTempEvents.some((t) => t.slotType === "noon");
    const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);

    const lastPeriodEndMins = periodsToRender.length > 0 ? timeToMinutes(periodsToRender[periodsToRender.length - 1].end) : 17 * 60;
    
    const overlapsDaytime = (st, et) => timeToMinutes(st) < lastPeriodEndMins;
    const overlapsEvening = (st, et) => {
        const sm = timeToMinutes(st), em = timeToMinutes(et);
        return sm > em || em > lastPeriodEndMins; 
    };

    periodsToRender.forEach((p, pIdx) => {
      const tr = document.createElement("tr"), timeTh = document.createElement("td");
      timeTh.className = "col-time"; 
      timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div><div style="color:var(--text-muted); font-size:0.58rem;">${escapeHtml(p.start)}</div>`; 
      tr.appendChild(timeTh);

      for (let d = 1; d <= maxDays; d++) {
        const td = document.createElement("td"), key = `${d}_${p.id}`, currentCellDate = weekDates[d - 1];
        const wrapper = document.createElement("div"); wrapper.className = "table-col-wrapper";
        const slotDiv = document.createElement("div"); slotDiv.className = "cell-slot";

        const course = sch.courses ? sch.courses[key] : null;
        const overriddenCourseKeys = new Set((sch.overrides || []).filter((o) => o.type === "school").map((o) => o.sourceKey));

        if (course && course.name && !overriddenCourseKeys.has(key)) {
          slotDiv.onclick = (e) => { e.stopPropagation(); handleSlotClick(d, p.id); };
          const bgStyle = course.color ? `background-color: ${course.color}; color: ${getTextColorForBg(course.color)};` : `background-color: var(--school-def-bg); color: var(--school-def-text);`;
          const hasWeeklyMemo = sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`school_${key}`];
          slotDiv.innerHTML = `<div class="slot-item ${alignClass}" style="${bgStyle}">${hasWeeklyMemo ? `<span class="memo-badge">📌</span>` : ""}<div class="item-title">${escapeHtml(course.name)}</div>${course.room ? `<div class="item-sub">${escapeHtml(course.room)}</div>` : ""}</div>`;
        } else {
          slotDiv.onclick = (e) => { e.stopPropagation(); handleSlotClick(d, p.id); };
          slotDiv.innerHTML = `<span style="color:var(--border); font-size:0.75rem;">+</span>`;
        }
        wrapper.appendChild(slotDiv);

        if (pIdx === 0) {
          const overlayContainer = document.createElement("div"); overlayContainer.className = "col-overlay-container";
          const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));

          const renderFloat = (list, itemType, getInnerHtml, defBgVar, defTextVar) => {
            list.forEach(item => {
              const sm = timeToMinutes(item.startTime);
              let em = timeToMinutes(item.endTime);
              if (sm > em) em = 24 * 60; 
              
              const topPx = timeToPixelOffset(sm, periodsToRender, hasNoonEvents);
              const bottomPx = timeToPixelOffset(em, periodsToRender, hasNoonEvents);
              
              const extendsToEvening = em > lastPeriodEndMins;
              let cardTop = topPx + 2;
              let cardHeight = Math.max(bottomPx - topPx, 20) - 4;
              let radiusStyle = "";

              if (extendsToEvening) {
                  if (state.showTutoring) {
                      // 改為一體成型覆蓋到夜間區塊，文字才能整體置中且不重複
                      cardHeight = (bottomPx - topPx) + CELL_HEIGHT - 4; 
                      radiusStyle = "z-index: 15;";
                  } else {
                      // 若未開啟夜間區塊，則切平底部
                      radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-width: 0; box-shadow: 0 -1px 2px rgba(0,0,0,0.06); z-index: 15;";
                  }
              }

              const floatCard = document.createElement("div"); floatCard.className = `tutoring-float-card ${itemType} ${alignClass}`;
              floatCard.style = `${item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` : `background-color: var(${defBgVar}); color: var(${defTextVar});`} top: ${cardTop}px; height: ${cardHeight}px; ${radiusStyle}`;
              floatCard.onclick = (e) => { e.stopPropagation(); item.clickFn(item.id); };
              floatCard.innerHTML = getInnerHtml(item); overlayContainer.appendChild(floatCard);
            });
          };

          renderFloat((sch.tutorings || []).filter((t) => Number(t.day) === d && !overriddenSourceIds.has(t.id) && overlapsDaytime(t.startTime, t.endTime)).map(t => ({...t, clickFn: handleTutoringClick})), "is-tutoring", (t) => `${(sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${t.id}`]) ? `<span class="memo-badge">📌</span>` : ""}<div class="item-title">${escapeHtml(t.student)}</div><div class="item-sub">${escapeHtml(t.startTime)}</div><div class="item-sub">${escapeHtml(t.endTime)}</div>`, "--tutoring-def-bg", "--tutoring-def-text");
          renderFloat(currentWeekWorks.filter((w) => Number(w.day) === d && !overriddenSourceIds.has(w.id) && overlapsDaytime(w.startTime, w.endTime)).map(w => ({...w, clickFn: handleWorkClick})), "is-work", (w) => `<div class="item-title">${escapeHtml(w.name)}</div><div class="item-sub">${escapeHtml(w.startTime)}</div><div class="item-sub">${escapeHtml(w.endTime)}</div>`, "--work-def-bg", "--work-def-text");
          renderFloat((sch.overrides || []).filter((o) => o.targetDate === currentCellDate && overlapsDaytime(o.startTime, o.endTime)).map(o => ({...o, clickFn: handleOverrideClick})), "is-override-temp", (o) => `<div class="item-title">${escapeHtml(o.title)}</div>`, "--override-temp-def-bg", "--override-temp-def-text");
          renderFloat(currentWeekTempEvents.filter((t) => Number(t.day) === d && t.slotType !== "noon" && overlapsDaytime(t.startTime, t.endTime)).map(t => ({...t, clickFn: handleTempEventClick})), "is-override-temp", (t) => `<div class="item-title">${escapeHtml(t.title)}</div>${t.location ? `<div class="item-sub">${escapeHtml(t.location)}</div>` : ""}`, "--override-temp-def-bg", "--override-temp-def-text");

          wrapper.appendChild(overlayContainer);
        }
        td.appendChild(wrapper); tr.appendChild(td);
      }
      tbody.appendChild(tr);

      if (p.id === 4 && hasNoonEvents) {
        const noonTr = document.createElement("tr"); noonTr.className = "noon-row";
        noonTr.innerHTML = `<td class="col-time"><div>中午</div><div style="color:var(--text-muted); font-size:0.58rem;">午休</div></td>`;
        for (let d = 1; d <= maxDays; d++) {
          const td = document.createElement("td"), noonCell = document.createElement("div"); noonCell.className = "noon-cell";
          const dayNoonTemps = currentWeekTempEvents.filter((t) => Number(t.day) === d && t.slotType === "noon");
          if (dayNoonTemps.length > 0) {
            dayNoonTemps.forEach((tmp) => {
              const card = document.createElement("div"); card.className = `noon-card is-override-temp ${alignClass}`; card.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text);`;
              card.onclick = (e) => { e.stopPropagation(); handleTempEventClick(tmp.id); }; card.innerHTML = `<div class="item-title">${escapeHtml(tmp.title)}</div>`; noonCell.appendChild(card);
            });
          } else { noonCell.innerHTML = `<span class="noon-empty">-</span>`; }
          td.appendChild(noonCell); noonTr.appendChild(td);
        }
        tbody.appendChild(noonTr);
      }
    });

    if (state.showTutoring) {
      const eveningTr = document.createElement("tr"); eveningTr.className = "evening-row";
      eveningTr.innerHTML = `<td class="col-time"><div>課後</div><div style="color:var(--text-muted); font-size:0.58rem;">夜間</div></td>`;
      const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));

      for (let d = 1; d <= maxDays; d++) {
        const td = document.createElement("td"), currentCellDate = weekDates[d - 1], eveningCell = document.createElement("div"); eveningCell.className = "evening-cell";
        let hasContent = false;

        const renderEvening = (list, itemType, getInnerHtml, defBgVar, defTextVar) => {
          list.forEach(item => {
            hasContent = true; 
            const sm = timeToMinutes(item.startTime);
            const extendsFromDaytime = sm < lastPeriodEndMins;
            
            // 白天區塊已一體成型延伸覆蓋，此處僅作為隱形佔位符維持排版高度
            let radiusStyle = extendsFromDaytime ? "opacity: 0; pointer-events: none;" : "";

            const card = document.createElement("div"); card.className = `evening-card ${itemType} ${alignClass}`;
            card.style = item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)}; ${radiusStyle}` : `background-color: var(${defBgVar}); color: var(${defTextVar}); ${radiusStyle}`;
            card.onclick = (e) => { e.stopPropagation(); item.clickFn(item.id); }; card.innerHTML = getInnerHtml(item); eveningCell.appendChild(card);
          });
        };

        renderEvening((sch.tutorings || []).filter((t) => Number(t.day) === d && !overriddenSourceIds.has(t.id) && overlapsEvening(t.startTime, t.endTime)).map(t => ({...t, clickFn: handleTutoringClick})), "is-tutoring", (t) => `${(sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${t.id}`]) ? `<span class="memo-badge">📌</span>` : ""}<div class="item-title">${escapeHtml(t.student)}</div><div class="item-sub">${escapeHtml(t.startTime)}</div><div class="item-sub">${escapeHtml(t.endTime)}</div>`, "--tutoring-def-bg", "--tutoring-def-text");
        renderEvening(currentWeekWorks.filter((w) => Number(w.day) === d && !overriddenSourceIds.has(w.id) && overlapsEvening(w.startTime, w.endTime)).map(w => ({...w, clickFn: handleWorkClick})), "is-work", (w) => `<div class="item-title">${escapeHtml(w.name)}</div><div class="item-sub">${escapeHtml(w.startTime)}</div><div class="item-sub">${escapeHtml(w.endTime)}</div>`, "--work-def-bg", "--work-def-text");
        renderEvening((sch.overrides || []).filter((o) => o.targetDate === currentCellDate && overlapsEvening(o.startTime, o.endTime)).map(o => ({...o, clickFn: handleOverrideClick})), "is-override-temp", (o) => `<div class="item-title">${escapeHtml(o.title)}</div>`, "--override-temp-def-bg", "--override-temp-def-text");
        renderEvening(currentWeekTempEvents.filter((t) => Number(t.day) === d && t.slotType !== "noon" && overlapsEvening(t.startTime, t.endTime)).map(t => ({...t, clickFn: handleTempEventClick})), "is-override-temp", (t) => `<div class="item-title">${escapeHtml(t.title)}</div>`, "--override-temp-def-bg", "--override-temp-def-text");

        if (!hasContent) eveningCell.innerHTML = `<span class="evening-empty">無夜間行程</span>`;
        td.appendChild(eveningCell); eveningTr.appendChild(td);
      }
      tbody.appendChild(eveningTr);
    }
  } catch (err) {
    console.error("Render schedule error:", err);
  }
}

function openSchoolModal(day, period) {
  currentEditingSlot = { day, period }; const sch = getActiveSchedule(), key = `${day}_${period}`, course = (sch.courses && sch.courses[key]) || {};
  document.getElementById("sch-name").value = course.name || ""; document.getElementById("sch-room").value = course.room || "";
  document.getElementById("sch-teacher").value = course.teacher || ""; document.getElementById("sch-memo").value = course.memo || "";
  document.getElementById("sch-weekly-memo").value = (sch.weeklyMemos[getWeekKey(new Date())] && sch.weeklyMemos[getWeekKey(new Date())][`school_${key}`]) || "";

  tempDeadlines = course.deadlines ? JSON.parse(JSON.stringify(course.deadlines)) : [];
  currentEditingDeadlineIdx = null; document.getElementById("btn-add-dl").innerText = "新增";
  renderModalDeadlines();

  const typeSelect = document.getElementById("sch-type-select"), cType = course.type || "必修";
  if (Array.from(typeSelect.options).some(o => o.value === cType)) { typeSelect.value = cType; document.getElementById("sch-type-custom-wrap").style.display = "none"; }
  else { typeSelect.value = "custom"; document.getElementById("sch-type-custom-wrap").style.display = "block"; document.getElementById("sch-type-custom").value = cType; }

  document.getElementById("sch-color").value = course.color || getDefaultSchoolBgHex();
  document.getElementById("school-modal").classList.add("active");
}

function saveSchoolCourse() {
  triggerHaptic(20); if (!currentEditingSlot) return; const sch = getActiveSchedule(), key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
  const name = document.getElementById("sch-name").value.trim(), color = document.getElementById("sch-color").value;
  let typeVal = document.getElementById("sch-type-select").value; if (typeVal === "custom") typeVal = document.getElementById("sch-type-custom").value.trim() || "必修";
  
  const memo = document.getElementById("sch-memo").value.trim();
  const weeklyMemo = document.getElementById("sch-weekly-memo").value.trim();
  const weekKey = getWeekKey(new Date());

  if (!sch.courses) sch.courses = {};
  if (!sch.weeklyMemos) sch.weeklyMemos = {};
  if (!sch.weeklyMemos[weekKey]) sch.weeklyMemos[weekKey] = {};
  
  const oldCourse = sch.courses[key];
  const oldName = oldCourse ? oldCourse.name : null;

  if (!name) { 
    delete sch.courses[key]; 
    delete sch.weeklyMemos[weekKey][`school_${key}`];
  } else {
    sch.courses[key] = { name, type: typeVal, room: document.getElementById("sch-room").value.trim(), teacher: document.getElementById("sch-teacher").value.trim(), memo: memo, color: color.toLowerCase() === getDefaultSchoolBgHex().toLowerCase() ? undefined : color, deadlines: JSON.parse(JSON.stringify(tempDeadlines)) };
    
    Object.keys(sch.courses).forEach(k => {
      if (sch.courses[k].name === name || (oldName && sch.courses[k].name === oldName)) {
        sch.courses[k].name = name;
        sch.courses[k].deadlines = JSON.parse(JSON.stringify(tempDeadlines));
        sch.courses[k].memo = memo; 
        if (weeklyMemo) { 
          sch.weeklyMemos[weekKey][`school_${k}`] = weeklyMemo;
        } else {
          delete sch.weeklyMemos[weekKey][`school_${k}`];
        }
      }
    });
  }

  saveToStorage(); renderSchedule(); closeModal("school-modal");
}

function deleteSchoolCourse() {
  if (!currentEditingSlot) return;
  if (confirm("清空該節？")) { triggerHaptic(25); delete getActiveSchedule().courses[`${currentEditingSlot.day}_${currentEditingSlot.period}`]; saveToStorage(); renderSchedule(); closeModal("school-modal"); }
}

// ==========================================
// 臨時調課 
// ==========================================
function openOverrideModal(id = null) {
  currentEditingOverrideId = id;
  const sch = getActiveSchedule();
  const selectEl = document.getElementById("ovr-source-select");
  selectEl.innerHTML = '<option value="">-- 選擇 --</option>';
  
  const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  if (sch.courses) {
    Object.keys(sch.courses).forEach(key => {
      const c = sch.courses[key];
      const [day, pId] = key.split("_");
      const p = (sch.periods || initialDefaultPeriods).find(x => String(x.id) === pId);
      if (c && c.name && p) selectEl.appendChild(new Option(`[課程] ${dayNames[day]} ${p.name} - ${c.name}`, `school_${key}`));
    });
  }
  (sch.tutorings || []).forEach(t => selectEl.appendChild(new Option(`[家教] ${dayNames[t.day]} ${t.student}`, `tutoring_${t.id}`)));
  (sch.works || []).forEach(w => selectEl.appendChild(new Option(`[工作] ${dayNames[w.day]} ${w.name}`, `work_${w.id}`)));

  if (id) {
    const ovr = (sch.overrides || []).find(o => o.id === id);
    if (ovr) {
      const optionValue = `${ovr.type}_${ovr.sourceKey || ovr.sourceId}`;
      if (!Array.from(selectEl.options).some(opt => opt.value === optionValue)) {
        selectEl.appendChild(new Option(`[已刪除或失效項目] ${ovr.title}`, optionValue));
      }
      selectEl.value = optionValue;
      document.getElementById("ovr-target-date").value = ovr.targetDate;
      document.getElementById("ovr-start-time").value = ovr.startTime;
      document.getElementById("ovr-end-time").value = ovr.endTime;
      document.getElementById("ovr-memo").value = ovr.memo || "";
      document.getElementById("ovr-delete-btn").style.display = "inline-flex";
    }
  } else {
    document.getElementById("ovr-target-date").value = formatDate(new Date());
    document.getElementById("ovr-start-time").value = "18:00";
    document.getElementById("ovr-end-time").value = "20:00";
    document.getElementById("ovr-memo").value = "";
    document.getElementById("ovr-delete-btn").style.display = "none";
  }
  populateOverrideOriginal();
  document.getElementById("override-modal").classList.add("active");
}

function populateOverrideOriginal() {
  const val = document.getElementById("ovr-source-select").value;
  const descEl = document.getElementById("ovr-source-desc");
  if (!val) { descEl.value = ""; return; }
  descEl.value = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text;
}

function saveClassOverride() {
  const val = document.getElementById("ovr-source-select").value;
  const targetDate = document.getElementById("ovr-target-date").value;
  const startTime = document.getElementById("ovr-start-time").value;
  const endTime = document.getElementById("ovr-end-time").value;
  if (!val || !targetDate || !startTime || !endTime) return alert("請完整填寫！");

  const [type, ...keyParts] = val.split("_");
  const sourceIdOrKey = keyParts.join("_");
  const sch = getActiveSchedule();
  
  const title = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text.split("] ")[1];

  const obj = {
    id: currentEditingOverrideId || "ovr_" + Date.now(),
    type,
    sourceKey: type === "school" ? sourceIdOrKey : undefined,
    sourceId: type !== "school" ? sourceIdOrKey : undefined,
    title,
    targetDate,
    startTime,
    endTime,
    memo: document.getElementById("ovr-memo").value.trim()
  };

  if (currentEditingOverrideId) {
    const idx = sch.overrides.findIndex(o => o.id === currentEditingOverrideId);
    if (idx > -1) sch.overrides[idx] = obj;
  } else {
    sch.overrides.push(obj);
  }
  
  saveToStorage(); renderSchedule(); closeModal("override-modal");
}

// ==========================================
// 圖表生成 (Expense Donut Chart)
// ==========================================
function toggleExpenseChart() {
  triggerHaptic(20); isExpenseChartVisible = !isExpenseChartVisible;
  const container = document.getElementById("expense-chart-container");
  if (isExpenseChartVisible) {
    container.classList.add("active");
    financeActiveMode = "all_expense";
  } else {
    container.classList.remove("active");
    financeActiveMode = "all";
  }
  financeActiveMainCat = "all"; financeActiveSubCat = "all";
  renderFinances();
}

function renderChartData() {
  const container = document.getElementById("expense-chart-content"); container.innerHTML = "";
  const selectedMonth = document.getElementById("fin-month-filter").value; let totalExpense = 0; const catSums = {};

  (state.finances || []).forEach(item => {
    if (item.isHidden && !state.showHiddenItems) return; if (item.type !== "expense") return;
    if (selectedMonth && (item.date || "").slice(0,7) !== selectedMonth) return;
    const amt = Number(item.amount || 0); totalExpense += amt;
    if (!catSums[item.parentCat]) catSums[item.parentCat] = 0; catSums[item.parentCat] += amt;
  });

  if (totalExpense === 0) { container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted);">無支出資料</div>`; return; }

  const data = Object.keys(catSums).map(cat => ({ cat, amt: catSums[cat], pct: catSums[cat] / totalExpense })).sort((a,b) => b.amt - a.amt);
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#14b8a6', '#f43f5e'];

  let svgHTML = `<svg width="120" height="120" viewBox="0 0 32 32" style="transform: rotate(-90deg); border-radius:50%;">`, offset = 0, C = 2 * Math.PI * 10;
  data.forEach((item, idx) => {
    item.color = colors[idx % colors.length]; const slice = item.pct * C;
    svgHTML += `<circle r="10" cx="16" cy="16" fill="transparent" stroke="${item.color}" stroke-width="6" stroke-dasharray="${slice} ${C}" stroke-dashoffset="${-offset}"></circle>`; offset += slice;
  });
  svgHTML += `</svg>`;

  let legendHTML = `<div style="display:flex; flex-direction:column; gap:4px;">`;
  data.forEach(item => { legendHTML += `<div class="legend-item"><div class="legend-color" style="background:${item.color};"></div><span>${escapeHtml(item.cat)}: ${Math.round(item.pct * 100)}% ($${item.amt.toLocaleString()})</span></div>`; });
  legendHTML += `</div>`;
  container.innerHTML = svgHTML + legendHTML;
}

function openTutoringModal(id = null) {
  currentEditingTutoringId = id; const sch = getActiveSchedule(), defHex = getDefaultTutoringBgHex();
  if (id) {
    const tut = (sch.tutorings || []).find((t) => t.id === id); if (!tut) return;
    ["student","day","start-time","end-time","subject","location","line","fb","phone","rate","memo"].forEach(k => { document.getElementById(`tut-${k}`).value = tut[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || ""; });
    document.getElementById("tut-color").value = tut.color || defHex; document.getElementById("tut-weekly-memo").value = (sch.weeklyMemos[getWeekKey(new Date())] && sch.weeklyMemos[getWeekKey(new Date())][`tut_${id}`]) || ""; document.getElementById("tut-delete-btn").style.display = "block";
  } else {
    ["student","subject","location","line","fb","phone","rate","memo","weekly-memo"].forEach(k => document.getElementById(`tut-${k}`).value = "");
    document.getElementById("tut-day").value = "6"; document.getElementById("tut-start-time").value = "18:00"; document.getElementById("tut-end-time").value = "20:00";
    document.getElementById("tut-color").value = defHex; document.getElementById("tut-delete-btn").style.display = "none";
  }
  document.getElementById("tutoring-modal").classList.add("active");
}
function saveTutoringClass() {
  const student = document.getElementById("tut-student").value.trim(); if (!student) return alert("請填寫學生姓名！");
  const sch = getActiveSchedule(), color = document.getElementById("tut-color").value, savedColor = color.toLowerCase() === getDefaultTutoringBgHex().toLowerCase() ? undefined : color;
  const itemData = { id: currentEditingTutoringId || "tut_" + Date.now(), student, day: document.getElementById("tut-day").value, startTime: document.getElementById("tut-start-time").value, endTime: document.getElementById("tut-end-time").value, subject: document.getElementById("tut-subject").value.trim(), location: document.getElementById("tut-location").value.trim(), line: document.getElementById("tut-line").value.trim(), fb: document.getElementById("tut-fb").value.trim(), phone: document.getElementById("tut-phone").value.trim(), rate: document.getElementById("tut-rate").value, memo: document.getElementById("tut-memo").value.trim(), color: savedColor };
  if (currentEditingTutoringId) { const idx = sch.tutorings.findIndex((t) => t.id === currentEditingTutoringId); if (idx > -1) sch.tutorings[idx] = itemData; } else { sch.tutorings.push(itemData); }
  const wk = getWeekKey(new Date()), memo = document.getElementById("tut-weekly-memo").value.trim();
  if (!sch.weeklyMemos) sch.weeklyMemos = {}; if (!sch.weeklyMemos[wk]) sch.weeklyMemos[wk] = {};
  if (memo) sch.weeklyMemos[wk][`tut_${itemData.id}`] = memo; else delete sch.weeklyMemos[wk][`tut_${itemData.id}`];
  saveToStorage(); renderSchedule(); renderBillings(); closeModal("tutoring-modal");
}
function deleteTutoringClass() { if (confirm("刪除此家教？")) { getActiveSchedule().tutorings = getActiveSchedule().tutorings.filter(t => t.id !== currentEditingTutoringId); saveToStorage(); renderSchedule(); closeModal("tutoring-modal"); } }

function openWorkModal(id = null) {
  currentEditingWorkId = id; const sch = getActiveSchedule(), defHex = getDefaultWorkBgHex();
  if (id) {
    const work = (sch.works || []).find((w) => w.id === id); if (!work) return;
    ["type","name","day","start-time","end-time","location","rate","memo"].forEach(k => { document.getElementById(`work-${k}`).value = work[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || ""; });
    document.getElementById("work-color").value = work.color || defHex; document.getElementById("work-delete-btn").style.display = "block";
  } else {
    ["name","location","rate","memo"].forEach(k => document.getElementById(`work-${k}`).value = "");
    document.getElementById("work-type").value = "fixed"; document.getElementById("work-day").value = "1"; document.getElementById("work-start-time").value = "09:00"; document.getElementById("work-end-time").value = "12:00";
    document.getElementById("work-color").value = defHex; document.getElementById("work-delete-btn").style.display = "none";
  }
  document.getElementById("work-modal").classList.add("active");
}
function saveWorkClass() {
  const name = document.getElementById("work-name").value.trim(); if (!name) return alert("請填寫工作名稱！");
  const sch = getActiveSchedule(), color = document.getElementById("work-color").value, savedColor = color.toLowerCase() === getDefaultWorkBgHex().toLowerCase() ? undefined : color;
  const itemData = { id: currentEditingWorkId || "work_" + Date.now(), type: document.getElementById("work-type").value, weekKey: document.getElementById("work-type").value === "weekly" ? getWeekKey(new Date()) : undefined, name, day: document.getElementById("work-day").value, startTime: document.getElementById("work-start-time").value, endTime: document.getElementById("work-end-time").value, location: document.getElementById("work-location").value.trim(), rate: document.getElementById("work-rate").value, memo: document.getElementById("work-memo").value.trim(), color: savedColor };
  if (currentEditingWorkId) { const idx = sch.works.findIndex((w) => w.id === currentEditingWorkId); if (idx > -1) sch.works[idx] = itemData; } else { sch.works.push(itemData); }
  saveToStorage(); renderSchedule(); renderBillings(); closeModal("work-modal");
}
function deleteWorkClass() { if (confirm("刪除此工作排程？")) { getActiveSchedule().works = getActiveSchedule().works.filter((w) => w.id !== currentEditingWorkId); saveToStorage(); renderSchedule(); closeModal("work-modal"); } }

function openTempEventModal(tmpId = null) {
  currentEditingTempEventId = tmpId; const sch = getActiveSchedule();
  if (tmpId) {
    const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId);
    ["title","day","slot-type","start-time","end-time","location","memo"].forEach(k => document.getElementById(`tmp-${k}`).value = tmp[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || "");
    onTempSlotTypeChange(tmp.slotType || "period"); if (tmp.slotType === "period") document.getElementById("tmp-period-id").value = tmp.periodId || "1";
    document.getElementById("tmp-delete-btn").style.display = "inline-flex";
  } else {
    ["title","location","memo"].forEach(k => document.getElementById(`tmp-${k}`).value = "");
    document.getElementById("tmp-day").value = "1"; document.getElementById("tmp-slot-type").value = "period"; document.getElementById("tmp-period-id").value = "1"; document.getElementById("tmp-start-time").value = "12:00"; document.getElementById("tmp-end-time").value = "13:00";
    onTempSlotTypeChange("period"); document.getElementById("tmp-delete-btn").style.display = "none";
  }
  document.getElementById("temp-event-modal").classList.add("active");
}
function onTempSlotTypeChange(type) { document.getElementById("tmp-period-wrap").style.display = type === "period" ? "block" : "none"; document.getElementById("tmp-time-wrap").style.display = type !== "period" ? "flex" : "none"; }
function saveTempEvent() {
  const title = document.getElementById("tmp-title").value.trim(), slotType = document.getElementById("tmp-slot-type").value; if (!title) return alert("請輸入事件名稱！");
  const sch = getActiveSchedule(); let startTime = document.getElementById("tmp-start-time").value, endTime = document.getElementById("tmp-end-time").value;
  if (slotType === "period") { const pObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === document.getElementById("tmp-period-id").value); if (pObj) { startTime = pObj.start; endTime = pObj.end; } }
  const item = { id: currentEditingTempEventId || "tmp_" + Date.now(), weekKey: getWeekKey(new Date()), day: document.getElementById("tmp-day").value, slotType, periodId: slotType === "period" ? document.getElementById("tmp-period-id").value : null, title, startTime, endTime, location: document.getElementById("tmp-location").value.trim(), memo: document.getElementById("tmp-memo").value.trim() };
  if (currentEditingTempEventId) { const idx = sch.temporaryEvents.findIndex(t => t.id === currentEditingTempEventId); if (idx > -1) sch.temporaryEvents[idx] = item; } else { sch.temporaryEvents.push(item); }
  saveToStorage(); renderSchedule(); closeModal("temp-event-modal");
}

function switchBillingType(type) { currentBillingType = type; currentSelectedStudentFilter = "__FILTER_ALL__"; document.getElementById("btn-billing-type-tutoring").className = `billing-type-btn ${type === "tutoring" ? "active" : ""}`; document.getElementById("btn-billing-type-work").className = `billing-type-btn ${type === "work" ? "active" : ""}`; document.getElementById("nav-billing-text").innerText = type === "tutoring" ? "家教帳務" : "工作帳務"; renderBillings(); }
function openCurrentBillingModal() { currentBillingType === "work" ? openWorkBillingModal() : openBillingModal(); }
function setBillingMonthCurrent() { const now = new Date(); document.getElementById("bill-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; renderBillings(); }
function setBillingMonthAll() { document.getElementById("bill-month-filter").value = ""; renderBillings(); }
function setStudentFilter(name) { triggerHaptic(15); currentSelectedStudentFilter = name; renderBillings(); }

function renderBillings() {
  const tbody = document.getElementById("billing-body"); 
  const isWork = currentBillingType === "work", selectedMonth = document.getElementById("bill-month-filter").value, sortOrder = document.getElementById("bill-sort-order").value;
  document.getElementById("th-billing-target").innerText = isWork ? "工作名稱" : "學生"; document.getElementById("stat-unpaid-title").innerText = isWork ? "未領取金額" : "未繳清金額";
  
  const allNamesSet = new Set();
  (state.schedules || []).forEach(sch => { (isWork ? sch.works : sch.tutorings).forEach(x => { if(x.name || x.student) allNamesSet.add(x.name || x.student); }); });
  (isWork ? state.workBillings : state.billings).forEach(b => { if(b.name || b.student) allNamesSet.add(b.name || b.student); });
  
  const chips = document.getElementById("student-filter-chips"); 
  let chipsHtml = `<div class="student-chip ${currentSelectedStudentFilter === "__FILTER_ALL__" ? "active" : ""}" onclick="setStudentFilter('__FILTER_ALL__')">${isWork ? "全部工作" : "全部學生"}</div>`;
  Array.from(allNamesSet).forEach(item => chipsHtml += `<div class="student-chip ${currentSelectedStudentFilter === item ? "active" : ""}" onclick="setStudentFilter('${escapeJS(item)}')">${escapeHtml(item)}</div>`);
  chips.innerHTML = chipsHtml;

  let tH = 0, tI = 0, tU = 0, statMap = {};
  (isWork ? state.workBillings : state.billings).forEach(r => {
    if (selectedMonth && (r.date || '').slice(0, 7) !== selectedMonth) return;
    const targetName = (isWork ? r.name : r.student) || "未具名", h = Number(r.hours || 0), tot = Number(r.total || 0);
    if (!statMap[targetName]) statMap[targetName] = { h:0, i:0, u:0, p:0 };
    statMap[targetName].h += h; statMap[targetName].i += tot; if (r.status === "unpaid") statMap[targetName].u += tot; else statMap[targetName].p += tot;
    if (currentSelectedStudentFilter === "__FILTER_ALL__" || currentSelectedStudentFilter === targetName) { tH += h; tI += tot; if (r.status === "unpaid") tU += tot; }
  });

  const statsC = document.getElementById("student-stats-container");
  let statsHtml = "";
  Object.keys(statMap).forEach(k => {
    statsHtml += `<div class="student-stat-card"><div class="student-stat-name">${escapeHtml(k)}</div><div class="student-stat-row"><span>時數：</span><strong>${statMap[k].h} hr</strong></div><div class="student-stat-row"><span>應收：</span><strong>$${statMap[k].i.toLocaleString()}</strong></div><div class="student-stat-row"><span>已收：</span><span style="color:#15803d; font-weight:700;">$${statMap[k].p.toLocaleString()}</span></div><div class="student-stat-row"><span>未繳：</span><span style="color:#ef4444; font-weight:700;">$${statMap[k].u.toLocaleString()}</span></div></div>`;
  });
  statsC.innerHTML = statsHtml;

  const filtered = (isWork ? state.workBillings : state.billings).map((record, idx) => ({record, idx})).filter(({record}) => (!selectedMonth || (record.date||'').slice(0,7) === selectedMonth) && (currentSelectedStudentFilter === "__FILTER_ALL__" || (isWork ? record.name : record.student) === currentSelectedStudentFilter)).sort((a,b) => sortOrder === "asc" ? a.record.date.localeCompare(b.record.date) : b.record.date.localeCompare(a.record.date));
  
  let tbodyHtml = "";
  filtered.forEach(({record, idx}) => {
    tbodyHtml += `<tr><td>${record.date}</td><td><strong>${escapeHtml(isWork ? record.name : record.student)}</strong></td><td>${record.hours}h</td><td>$${record.rate}</td><td><strong style="color:var(--primary);">$${record.total}</strong></td><td><span class="${record.status === "paid" ? "tag-paid" : "tag-unpaid"}">${record.status === "paid" ? "已清" : "未清"}</span></td><td>${escapeHtml(record.notes || "-")}</td><td><button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'toggleWorkBillStatus' : 'toggleBillStatus'}(${idx})">切換</button> <button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'openWorkBillingModal' : 'openBillingModal'}(${idx})">編輯</button> <button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'deleteWorkBilling' : 'deleteBilling'}(${idx})">刪除</button></td></tr>`;
  });
  if (filtered.length === 0) tbodyHtml = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:12px;">無紀錄</td></tr>`;
  tbody.innerHTML = tbodyHtml;
  
  document.getElementById("stat-total-hours").innerText = `${tH} 小時`; document.getElementById("stat-total-income").innerText = `$${tI.toLocaleString()}`; document.getElementById("stat-unpaid").innerText = `$${tU.toLocaleString()}`;
}

function syncBillingToFinance(billId, date, total, notes, isWork = false) {
  const finIdx = state.finances.findIndex(f => f.id === "fin_sync_" + billId);
  if (finIdx > -1) {
    state.finances[finIdx].date = date;
    state.finances[finIdx].amount = Number(total);
    state.finances[finIdx].notes = notes;
  } else {
    const finObj = { id: "fin_sync_" + billId, date, type: "income", parentCat: "💰 工作收入", subCat: isWork ? "兼職外快" : "家教收入", amount: Number(total), notes, isHidden: false };
    state.finances.unshift(finObj);
  }
}

function openBillingModal(idx = null) {
  currentEditingBillingIndex = idx; const sel = document.getElementById("bill-student-select"); sel.innerHTML = '<option value="">-- 現有家教 --</option>';
  new Set((state.schedules||[]).flatMap(s => (s.tutorings||[]).map(t => t.student))).forEach(s => { if(s) sel.appendChild(new Option(s, s)); });
  if (idx !== null) { const item = state.billings[idx]; ["date","student","hours","rate","total","status","notes"].forEach(k => document.getElementById(`bill-${k}`).value = item[k] || ""); } else { ["student","notes"].forEach(k => document.getElementById(`bill-${k}`).value = ""); document.getElementById("bill-date").value = formatDate(new Date()); document.getElementById("bill-hours").value = "2"; document.getElementById("bill-status").value = "unpaid"; updateBillingRateByDateAndStudent(); }
  document.getElementById("billing-modal").classList.add("active");
}
function onSelectBillingStudent() { document.getElementById("bill-student").value = document.getElementById("bill-student-select").value; updateBillingRateByDateAndStudent(); }
function onBillingDateOrStudentChange() { updateBillingRateByDateAndStudent(); }
function updateBillingRateByDateAndStudent() {
  if (currentEditingBillingIndex !== null) return; const name = document.getElementById("bill-student").value.trim();
  const tuts = (state.schedules||[]).flatMap(s => (s.tutorings||[]).filter(t => t.student === name));
  document.getElementById("bill-rate").value = (tuts.find(t => Number(t.day) === (parseLocalDate(document.getElementById("bill-date").value).getDay()||7)) || tuts[0] || {rate:""}).rate || ""; calcBillAmount();
}
function calcBillAmount() { document.getElementById("bill-total").value = Math.round((Number(document.getElementById("bill-hours").value)||0) * (Number(document.getElementById("bill-rate").value)||0)); }
function saveBillingRecord() {
  const date = document.getElementById("bill-date").value, student = document.getElementById("bill-student").value.trim(), hours = document.getElementById("bill-hours").value, rate = document.getElementById("bill-rate").value, total = document.getElementById("bill-total").value;
  if (!date || !student || !hours || !rate) return alert("請完整填寫！");
  const obj = { id: currentEditingBillingIndex !== null ? state.billings[currentEditingBillingIndex].id : "bill_" + Date.now(), date, student, hours, rate, total, status: document.getElementById("bill-status").value, notes: document.getElementById("bill-notes").value.trim() };
  if (currentEditingBillingIndex !== null) state.billings[currentEditingBillingIndex] = obj; else state.billings.unshift(obj);
  syncBillingToFinance(obj.id, date, total, `家教: ${student} (${hours}hr)`); saveToStorage(); renderBillings(); renderFinances(); closeModal("billing-modal");
}
function toggleBillStatus(idx) { state.billings[idx].status = state.billings[idx].status === "paid" ? "unpaid" : "paid"; saveToStorage(); renderBillings(); }
function deleteBilling(idx) { if(confirm("刪除？")) { state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.billings[idx].id); state.billings.splice(idx, 1); saveToStorage(); renderBillings(); renderFinances(); } }

function openWorkBillingModal(idx = null) {
  currentEditingWorkBillingIndex = idx; const sel = document.getElementById("wbill-name-select"); sel.innerHTML = '<option value="">-- 現有工作 --</option>';
  new Set((state.schedules||[]).flatMap(s => (s.works||[]).map(w => w.name))).forEach(n => { if(n) sel.appendChild(new Option(n, n)); });
  if (idx !== null) { const item = state.workBillings[idx]; ["date","name","hours","rate","total","status","notes"].forEach(k => document.getElementById(`wbill-${k}`).value = item[k] || ""); } else { ["name","notes"].forEach(k => document.getElementById(`wbill-${k}`).value = ""); document.getElementById("wbill-date").value = formatDate(new Date()); document.getElementById("wbill-hours").value = "4"; document.getElementById("wbill-status").value = "unpaid"; updateWorkBillingRateByDateAndName(); }
  document.getElementById("work-billing-modal").classList.add("active");
}
function onSelectBillingWork() { document.getElementById("wbill-name").value = document.getElementById("wbill-name-select").value; updateWorkBillingRateByDateAndName(); }
function onWorkBillingDateOrNameChange() { updateWorkBillingRateByDateAndName(); }
function updateWorkBillingRateByDateAndName() {
  if (currentEditingWorkBillingIndex !== null) return; const name = document.getElementById("wbill-name").value.trim();
  document.getElementById("wbill-rate").value = ((state.schedules||[]).flatMap(s => (s.works||[]).filter(w => w.name === name))[0] || {rate:""}).rate || ""; calcWorkBillAmount();
}
function calcWorkBillAmount() { document.getElementById("wbill-total").value = Math.round((Number(document.getElementById("wbill-hours").value)||0) * (Number(document.getElementById("wbill-rate").value)||0)); }
function saveWorkBillingRecord() {
  const date = document.getElementById("wbill-date").value, name = document.getElementById("wbill-name").value.trim(), hours = document.getElementById("wbill-hours").value, rate = document.getElementById("wbill-rate").value, total = document.getElementById("wbill-total").value;
  if (!date || !name || !hours || !rate) return alert("請完整填寫！");
  const obj = { id: currentEditingWorkBillingIndex !== null ? state.workBillings[currentEditingWorkBillingIndex].id : "wbill_" + Date.now(), date, name, hours, rate, total, status: document.getElementById("wbill-status").value, notes: document.getElementById("wbill-notes").value.trim() };
  if (currentEditingWorkBillingIndex !== null) state.workBillings[currentEditingWorkBillingIndex] = obj; else state.workBillings.unshift(obj);
  syncBillingToFinance(obj.id, date, total, `工作: ${name} (${hours}hr)`, true); saveToStorage(); renderBillings(); renderFinances(); closeModal("work-billing-modal");
}
function toggleWorkBillStatus(idx) { state.workBillings[idx].status = state.workBillings[idx].status === "paid" ? "unpaid" : "paid"; saveToStorage(); renderBillings(); }
function deleteWorkBilling(idx) { if(confirm("刪除？")) { state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.workBillings[idx].id); state.workBillings.splice(idx, 1); saveToStorage(); renderBillings(); renderFinances(); } }

function setFinanceMonthCurrent() { const now = new Date(); document.getElementById("fin-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; renderFinances(); }
function setFinanceMonthAll() { document.getElementById("fin-month-filter").value = ""; renderFinances(); }
function setFinanceAllMode(mode) { financeActiveMode = mode; financeActiveMainCat = "all"; financeActiveSubCat = "all"; renderFinances(); }
function selectFinanceMainCategory(cat) { financeActiveMode = "main"; financeActiveMainCat = cat; financeActiveSubCat = "all"; renderFinances(); }
function selectFinanceSubCategory(cat) { financeActiveMode = "sub"; financeActiveSubCat = cat; renderFinances(); }
function toggleShowHiddenItems() { state.showHiddenItems = !state.showHiddenItems; const btn = document.getElementById("btn-toggle-hidden"); btn.style.borderColor = state.showHiddenItems ? "var(--primary)" : "var(--border)"; btn.style.color = state.showHiddenItems ? "var(--primary)" : "var(--text)"; btn.innerText = state.showHiddenItems ? "👁️ 隱藏項目顯示中" : "👁️ 顯示隱藏"; saveToStorage(); renderFinances(); }
function toggleRecordHidden(id) { const item = state.finances.find(f => f.id === id); if (item) { item.isHidden = !item.isHidden; saveToStorage(); renderFinances(); } }
function onFinanceTypeChange() { const pSel = document.getElementById("fin-parent-cat"); pSel.innerHTML = ""; getCategoryKeys(document.getElementById("fin-type").value).forEach(p => pSel.appendChild(new Option(p, p))); onFinanceParentCatChange(); }
function onFinanceParentCatChange() { const sSel = document.getElementById("fin-sub-cat"); sSel.innerHTML = ""; (getCategories()[document.getElementById("fin-type").value][document.getElementById("fin-parent-cat").value] || []).forEach(s => sSel.appendChild(new Option(s, s))); }

function openFinanceModal(id = null) {
  document.getElementById("fin-edit-id").value = id || "";
  if (id) {
    const item = state.finances.find(f => f.id === id);
    document.getElementById("fin-modal-title").innerText = "編輯收支"; document.getElementById("fin-date").value = item.date; document.getElementById("fin-type").value = item.type; onFinanceTypeChange(); document.getElementById("fin-parent-cat").value = item.parentCat; onFinanceParentCatChange(); document.getElementById("fin-sub-cat").value = item.subCat; document.getElementById("fin-amount").value = item.amount; document.getElementById("fin-notes").value = item.notes || "";
  } else {
    document.getElementById("fin-modal-title").innerText = "新增收支"; document.getElementById("fin-date").value = formatDate(new Date()); document.getElementById("fin-type").value = "expense"; onFinanceTypeChange(); document.getElementById("fin-amount").value = ""; document.getElementById("fin-notes").value = "";
  }
  document.getElementById("finance-modal").classList.add("active");
}
function saveFinanceRecord() {
  const id = document.getElementById("fin-edit-id").value, date = document.getElementById("fin-date").value, type = document.getElementById("fin-type").value, parentCat = document.getElementById("fin-parent-cat").value, subCat = document.getElementById("fin-sub-cat").value, amount = Number(document.getElementById("fin-amount").value), notes = document.getElementById("fin-notes").value.trim();
  if (!date || !amount) return alert("填寫完整！");
  if (id) { 
    const idx = state.finances.findIndex(f => f.id === id); 
    const oldItem = state.finances[idx];
    
    if (oldItem.targetDebtId && oldItem.subCat === "還款") {
      const diff = amount - oldItem.amount;
      const targetDebt = state.finances.find(f => f.id === oldItem.targetDebtId);
      if (targetDebt && targetDebt.remaining !== undefined) {
        targetDebt.remaining -= diff;
      }
    }
    state.finances[idx] = { ...oldItem, date, type, parentCat, subCat, amount, notes }; 
  }
  else { state.finances.unshift({ id: "fin_" + Date.now(), date, type, parentCat, subCat, amount, notes, remaining: (type === "receivable" || type === "payable") ? amount : undefined, isHidden: false }); }
  saveToStorage(); renderFinances(); closeModal("finance-modal");
}

function openRepayModal(id) { 
  const item = state.finances.find(f => f.id === id); 
  document.getElementById("repay-id").value = id; 
  document.getElementById("repay-info").value = `[${item.subCat}] 未結清: $${(item.remaining !== undefined ? item.remaining : item.amount)}`; 
  document.getElementById("repay-date").value = formatDate(new Date()); 
  document.getElementById("repay-amount").value = (item.remaining !== undefined ? item.remaining : item.amount); 
  document.getElementById("repay-notes").value = ""; 
  document.getElementById("repay-modal").classList.add("active"); 
}

function confirmRepay() {
  const id = document.getElementById("repay-id").value, date = document.getElementById("repay-date").value, amt = Number(document.getElementById("repay-amount").value);
  const item = state.finances.find(f => f.id === id); const rem = item.remaining !== undefined ? item.remaining : item.amount;
  if (!date || amt <= 0 || amt > rem) return alert("金額錯誤！請輸入大於零的有效金額。");
  item.remaining = rem - amt;
  state.finances.unshift({ id: "fin_repay_" + Date.now(), targetDebtId: id, date, type: item.type === "receivable" ? "income" : "expense", parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他", subCat: "還款", amount: amt, notes: document.getElementById("repay-notes").value, isHidden: false });
  saveToStorage(); renderFinances(); closeModal("repay-modal");
}

function deleteFinanceRecord(id) { 
  const target = state.finances.find(f => f.id === id); 
  if (!target) return;

  if (target.type === "receivable" || target.type === "payable") {
    const relatedRepayments = state.finances.filter(f => f.targetDebtId === id);
    if (relatedRepayments.length > 0) {
      if (!confirm("此紀錄包含已還款紀錄，確定要連帶刪除所有關聯的還款紀錄嗎？")) return;
      state.finances = state.finances.filter(f => f.targetDebtId !== id);
    } else {
      if (!confirm("確定刪除此紀錄？")) return;
    }
  } else {
    if (!confirm("確定刪除此紀錄？")) return;
  }

  if (target.subCat === "還款" && target.targetDebtId) { 
    const m = state.finances.find(f => f.id === target.targetDebtId); 
    if (m && m.remaining !== undefined) m.remaining += target.amount; 
  } 
  
  state.finances = state.finances.filter(f => f.id !== id); 
  saveToStorage(); 
  renderFinances(); 
}

function renderFinances() {
  const tbody = document.getElementById("finance-body");
  const selectedMonth = document.getElementById("fin-month-filter").value, sortOrder = document.getElementById("fin-sort-order").value;
  let tE = 0, tI = 0, tR = 0, tP = 0;

  (state.finances || []).forEach((item) => {
    const amt = Number(item.amount || 0), rem = item.remaining !== undefined ? item.remaining : amt, mo = (item.date || '').slice(0, 7);
    if (item.type === "receivable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) tR += rem;
    if (item.type === "payable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) tP += rem;
    if (item.isHidden && !state.showHiddenItems) return;
    if (selectedMonth && mo !== selectedMonth) return;
    if (item.type === "expense") tE += amt; if (item.type === "income") tI += amt;
  });

  const chips = document.getElementById("finance-filter-chips"); 
  let chipsHtml = `<div class="finance-chip ${financeActiveMode === "all" ? "active" : ""}" onclick="setFinanceAllMode('all')">全部類型</div>`;
  
  const cats = getCategories();
  if (financeActiveMode.startsWith("all")) {
    Object.keys(cats).forEach(k => getCategoryKeys(k).forEach(p => chipsHtml += `<div class="finance-chip" onclick="selectFinanceMainCategory('${escapeJS(p)}')">${escapeHtml(p)}</div>`));
  } else {
    chipsHtml += `<div class="finance-chip" style="background:var(--primary);color:#fff;" onclick="setFinanceAllMode('all')">◀ 返回</div><div class="finance-chip ${financeActiveSubCat === "all" ? "active" : ""}" onclick="selectFinanceSubCategory('all')">全部 (${escapeHtml(financeActiveMainCat)})</div>`;
    let subs = []; Object.values(cats).forEach(t => { if(t[financeActiveMainCat]) subs = t[financeActiveMainCat]; });
    subs.forEach(s => chipsHtml += `<div class="finance-chip ${financeActiveSubCat === s ? "active" : ""}" onclick="selectFinanceSubCategory('${escapeJS(s)}')">${escapeHtml(s)}</div>`);
  }
  chips.innerHTML = chipsHtml;

  const lbls = { expense: { n: "支出", c: "tag-expense" }, income: { n: "收入", c: "tag-income" }, transfer: { n: "轉帳", c: "tag-paid" }, receivable: { n: "應收", c: "tag-receivable" }, payable: { n: "應付", c: "tag-payable" } };
  
  let tbodyHtml = "";
  state.finances.filter(i => {
    if (i.isHidden && !state.showHiddenItems) return false;
    const mo = (i.date||'').slice(0,7), rem = i.remaining !== undefined ? i.remaining : i.amount;
    if (i.type === "receivable" || i.type === "payable") { if(rem===0 && selectedMonth && mo!==selectedMonth) return false; } else { if(selectedMonth && mo!==selectedMonth) return false; }
    if (financeActiveMode === "all_expense" && i.type !== "expense") return false; if (financeActiveMode === "all_income" && i.type !== "income") return false;
    if (financeActiveMode === "all_receivable" && i.type !== "receivable") return false; if (financeActiveMode === "all_payable" && i.type !== "payable") return false;
    if (financeActiveMode === "main" && (i.parentCat !== financeActiveMainCat || (financeActiveSubCat !== "all" && i.subCat !== financeActiveSubCat))) return false;
    if (financeActiveMode === "sub" && i.subCat !== financeActiveSubCat) return false; return true;
  }).sort((a,b) => sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)).forEach(i => {
    const amt = Number(i.amount), rem = i.remaining !== undefined ? i.remaining : amt, tl = lbls[i.type];
    let ex = ((i.type === "receivable" || i.type === "payable") && rem > 0) ? `<button class="btn btn-warning" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openRepayModal('${i.id}')">還款</button>` : "";
    ex += `<button class="btn ${i.isHidden?'btn-secondary':'btn-warning'}" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="toggleRecordHidden('${i.id}')">${i.isHidden?'解除隱藏':'隱藏'}</button><button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openFinanceModal('${i.id}')">編輯</button><button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="deleteFinanceRecord('${i.id}')">刪除</button>`;
    const dAmt = `${(i.type==='income'||i.type==='receivable')?'+':'-'}$${amt.toLocaleString()}${((i.type==='receivable'||i.type==='payable')&&rem>0)?` (未結:$${rem})`:''}`;
    tbodyHtml += `<tr style="${i.isHidden?'opacity:0.55;':''}"><td>${i.date}</td><td><span class="${tl.c}">${tl.n}</span></td><td><strong>${escapeHtml(i.parentCat)}</strong> <span style="color:var(--text-muted);">/ ${escapeHtml(i.subCat)}</span> ${i.isHidden?'<span class="tag-hidden">已隱藏</span>':''}</td><td><strong style="color:${(i.type==='income'||i.type==='receivable')?'#10b981':'#ef4444'};">${dAmt}</strong></td><td>${escapeHtml(i.notes||"-")}</td><td>${ex}</td></tr>`;
  });
  
  if(tbodyHtml==="") tbodyHtml = `<tr><td colspan="6" style="text-align:center; padding:12px;">無紀錄</td></tr>`;
  tbody.innerHTML = tbodyHtml;
  
  document.getElementById("fin-stat-expense").innerText = `$${tE.toLocaleString()}`; document.getElementById("fin-stat-income").innerText = `$${tI.toLocaleString()}`; document.getElementById("fin-stat-receivable").innerText = `$${tR.toLocaleString()}`; document.getElementById("fin-stat-payable").innerText = `$${tP.toLocaleString()}`;
  document.getElementById("fin-stat-balance").innerText = `$${(tI - tE).toLocaleString()}`; document.getElementById("fin-stat-balance").style.color = (tI - tE) >= 0 ? "#10b981" : "#ef4444";

  if (isExpenseChartVisible) renderChartData();
}

function openRecurringModal() {
  const listEl = document.getElementById("recurring-list"); listEl.innerHTML = "";
  (state.recurringFinances || []).forEach(item => {
    const el = document.createElement("div"); el.className = "recurring-manage-item";
    el.innerHTML = `<div><strong style="color:var(--primary);">每月 ${item.dayOfMonth} 日</strong> - [${item.type === 'income' ? '收入' : '支出'}] ${escapeHtml(item.subCat)} ($${item.amount})<br><span style="font-size:0.65rem; color:var(--text-muted);">${escapeHtml(item.notes)}</span></div>
    <div><button class="btn btn-secondary" style="padding:2px 6px; font-size:0.68rem;" onclick="openAddRecurringModal('${item.id}')">編輯</button> <button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteRecurringRecord('${item.id}')">刪除</button></div>`;
    listEl.appendChild(el);
  });
  document.getElementById("recurring-modal").classList.add("active");
}

function openAddRecurringModal(id = null) {
  document.getElementById("rec-edit-id").value = id || "";
  if (id) {
    const item = state.recurringFinances.find(r => r.id === id);
    document.getElementById("rec-modal-title").innerText = "編輯固定收支";
    ["day","type","amount","notes"].forEach(k => document.getElementById(`rec-${k}`).value = item[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || "");
    onRecurringTypeChange(); document.getElementById("rec-parent-cat").value = item.parentCat; onRecurringParentCatChange(); document.getElementById("rec-sub-cat").value = item.subCat;
  } else {
    document.getElementById("rec-modal-title").innerText = "新增固定收支";
    ["day","amount","notes"].forEach(k => document.getElementById(`rec-${k}`).value = ""); document.getElementById("rec-type").value = "expense"; onRecurringTypeChange();
  }
  document.getElementById("recurring-modal").classList.remove("active"); document.getElementById("recurring-edit-modal").classList.add("active");
}

function onRecurringTypeChange() { const pSel = document.getElementById("rec-parent-cat"); pSel.innerHTML = ""; getCategoryKeys(document.getElementById("rec-type").value).forEach(p => pSel.appendChild(new Option(p, p))); onRecurringParentCatChange(); }
function onRecurringParentCatChange() { const sSel = document.getElementById("rec-sub-cat"); sSel.innerHTML = ""; (getCategories()[document.getElementById("rec-type").value][document.getElementById("rec-parent-cat").value] || []).forEach(s => sSel.appendChild(new Option(s, s))); }

function saveRecurringRecord() {
  const id = document.getElementById("rec-edit-id").value, dayOfMonth = Number(document.getElementById("rec-day").value), type = document.getElementById("rec-type").value, parentCat = document.getElementById("rec-parent-cat").value, subCat = document.getElementById("rec-sub-cat").value, amount = Number(document.getElementById("rec-amount").value), notes = document.getElementById("rec-notes").value.trim();
  if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31 || !amount) return alert("請正確填寫日期(1~31)與金額！");
  if (!state.recurringFinances) state.recurringFinances = [];
  const obj = { id: id || "rec_" + Date.now(), dayOfMonth, type, parentCat, subCat, amount, notes, lastTriggeredMonth: id ? state.recurringFinances.find(r=>r.id===id).lastTriggeredMonth : "" };
  if (id) { const idx = state.recurringFinances.findIndex(r => r.id === id); state.recurringFinances[idx] = obj; } else state.recurringFinances.push(obj);
  saveToStorage(); checkRecurringFinances(); closeModal("recurring-edit-modal"); openRecurringModal();
}

function deleteRecurringRecord(id) { if (confirm("確定刪除此設定？")) { state.recurringFinances = state.recurringFinances.filter(r => r.id !== id); saveToStorage(); openRecurringModal(); } }

function openCategoryManageModal() { document.getElementById("cat-manage-type").value = "expense"; renderCategoryManageList(); document.getElementById("category-manage-modal").classList.add("active"); }
function resetCategoriesToDefault() { if(confirm("恢復預設？")) { state.customCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)); state.categoryOrder = null; saveToStorage(); renderCategoryManageList(); renderFinances(); } }

function renderCategoryManageList() {
  const t = document.getElementById("cat-manage-type").value, list = document.getElementById("cat-manage-list"), cats = getCategories()[t] || {}; 
  
  let listHtml = "";
  getCategoryKeys(t).forEach((p, pi) => {
    listHtml += `<div style="font-weight:700; font-size:0.80rem; padding:6px; background:var(--table-th-bg); margin-top:4px; display:flex; justify-content:space-between;"><span>${escapeHtml(p)}</span><div><button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${escapeJS(t)}',${pi},-1)">▲主</button> <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${escapeJS(t)}',${pi},1)">▼主</button></div></div>`;
    (cats[p]||[]).forEach((s, si) => { listHtml += `<div class="cat-manage-item"><span>└ ${escapeHtml(s)}</span><div class="cat-manage-actions"><button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${escapeJS(t)}','${escapeJS(p)}',${si},-1)">▲</button> <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${escapeJS(t)}','${escapeJS(p)}',${si},1)">▼</button> <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMoveModal('${escapeJS(t)}','${escapeJS(p)}',${si})">搬移</button> <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMergeModal('${escapeJS(t)}','${escapeJS(p)}',${si})">合併</button> <button class="btn btn-danger" style="padding:1px 4px; font-size:0.62rem;" onclick="catDelete('${escapeJS(t)}','${escapeJS(p)}',${si})">刪</button></div></div>`; });
  });
  list.innerHTML = listHtml;
}

function catMoveMain(t, i, d) { const k = getCategoryKeys(t), ti = i+d; if(ti<0 || ti>=k.length) return; const m = k[i]; k.splice(i, 1); k.splice(ti, 0, m); state.categoryOrder[t] = k; saveToStorage(); renderCategoryManageList(); renderFinances(); }
function catMoveSub(t, p, i, d) { const c = getCategories(), l = c[t][p], ti = i+d; if(ti<0 || ti>=l.length) return; const tmp = l[i]; l[i] = l[ti]; l[ti] = tmp; saveToStorage(); renderCategoryManageList(); renderFinances(); }
function openAddMainCategoryModal() { document.getElementById("cat-add-main-name").value = ""; document.getElementById("cat-add-main-modal").classList.add("active"); }
function confirmAddMainCategory() { const t = document.getElementById("cat-manage-type").value, n = `${document.getElementById("cat-add-main-icon").value} ${document.getElementById("cat-add-main-name").value.trim()}`, c = getCategories(); if(!n.trim() || c[t][n]) return; c[t][n] = ["一般項目"]; if(!state.categoryOrder) state.categoryOrder={}; if(!state.categoryOrder[t]) state.categoryOrder[t]=Object.keys(c[t]); if(!state.categoryOrder[t].includes(n)) state.categoryOrder[t].push(n); saveToStorage(); renderCategoryManageList(); closeModal("cat-add-main-modal"); }
function openAddSubCategoryModal() { const t = document.getElementById("cat-manage-type").value, sel = document.getElementById("cat-add-sub-parent"); sel.innerHTML = ""; getCategoryKeys(t).forEach(p => sel.appendChild(new Option(p,p))); document.getElementById("cat-add-sub-name").value = ""; document.getElementById("cat-add-sub-modal").classList.add("active"); }
function confirmAddSubCategory() { const t = document.getElementById("cat-manage-type").value, p = document.getElementById("cat-add-sub-parent").value, n = document.getElementById("cat-add-sub-name").value.trim(), c = getCategories(); if(!n || !c[t][p] || c[t][p].includes(n)) return; c[t][p].push(n); saveToStorage(); renderCategoryManageList(); closeModal("cat-add-sub-modal"); }
function openCatMoveModal(t, p, i) { activeCatTask = {t,p,i,s:getCategories()[t][p][i]}; const sel = document.getElementById("cat-move-select"); sel.innerHTML = ""; getCategoryKeys(t).filter(x=>x!==p).forEach(x=>sel.appendChild(new Option(x,x))); document.getElementById("cat-move-modal").classList.add("active"); }

function confirmCatMove() { 
  const tp = document.getElementById("cat-move-select").value;
  const {t,p,i,s} = activeCatTask;
  const c = getCategories(); 
  
  (state.finances || []).forEach(f => {
    if (f.type === t && f.parentCat === p && f.subCat === s) f.parentCat = tp;
  });
  (state.recurringFinances || []).forEach(r => {
    if (r.type === t && r.parentCat === p && r.subCat === s) r.parentCat = tp;
  });

  c[t][p].splice(i,1); c[t][tp].push(s); 
  saveToStorage(); renderCategoryManageList(); renderFinances(); closeModal("cat-move-modal"); 
}

function openCatMergeModal(t, p, i) { activeCatTask = {t,p,i,s:getCategories()[t][p][i]}; const sel = document.getElementById("cat-merge-select"); sel.innerHTML = ""; getCategories()[t][p].filter((_,x)=>x!==i).forEach(x=>sel.appendChild(new Option(x,x))); document.getElementById("cat-merge-modal").classList.add("active"); }

function confirmCatMerge() { 
  const ts = document.getElementById("cat-merge-select").value, {t,p,i,s} = activeCatTask, c = getCategories(); 
  state.finances.forEach(f => {if(f.parentCat===p && f.subCat===s) f.subCat=ts;}); 
  (state.recurringFinances || []).forEach(r => {if(r.parentCat===p && r.subCat===s) r.subCat=ts;});
  c[t][p].splice(i,1); 
  saveToStorage(); renderCategoryManageList(); renderFinances(); closeModal("cat-merge-modal"); 
}

function catDelete(t, p, i) { if(confirm("刪除此子類別？")) { getCategories()[t][p].splice(i,1); saveToStorage(); renderCategoryManageList(); renderFinances(); } }

function closeModal(id) { document.getElementById(id).classList.remove("active"); }

function escapeHtml(text) { return String(text||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function escapeJS(text) { return String(text||"").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "\\\""); }
function escapeHtmlWithBr(text) { return escapeHtml(text).replace(/\n/g, "<br>"); }

window.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
    closeModal(event.target.id);
  }
});

init();