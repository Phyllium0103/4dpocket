// ========================================================
// Supabase 設定與實例化
// ========================================================
const SUPABASE_URL = "https://hqjqnbzzrduhdiwaxoxp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-xqiL_LXkK2pWt5UopJ5Nw__OxyEmOH";

let supabaseClient = null;
let currentUser = null;

if (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 5) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function triggerHaptic(duration = 20) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

// ========================================================
// 主題清單 (淺色 15 款 / 深色 15 款)
// ========================================================
const THEME_OPTIONS = {
  light: [
    { id: "light-swiss-blue", name: "1. 瑞士極簡蔚藍" },
    { id: "light-sage-mist", name: "2. 鼠尾草晨霧綠" },
    { id: "light-cream-oat", name: "3. 奶油燕麥暖棕" },
    { id: "light-nord-pastel", name: "4. 北歐粉彩晨曦" },
    { id: "light-raspberry", name: "5. 櫻桃木覆盆子" },
    { id: "light-mint-aqua", name: "6. 薄荷海鹽沁藍" },
    { id: "light-lavender", name: "7. 法式薰衣草紫" },
    { id: "light-sunset-gold", name: "8. 加州暖陽夕陽橘" },
    { id: "light-morandi", name: "9. 莫蘭迪石英灰" },
    { id: "light-champagne", name: "10. 頂級香檳金" },
    { id: "light-mediterranean", name: "11. 地中海群青" },
    { id: "light-matcha", name: "12. 京都抹茶焙茶" },
    { id: "light-apricot", name: "13. 甜杏馬卡龍" },
    { id: "light-editorial", name: "14. 出版雜誌黑白" },
    { id: "light-iced-latte", name: "15. 淺焙冰滴拿鐵" }
  ],
  dark: [
    { id: "dark-tokyo-night", name: "1. 東京暗夜極光" },
    { id: "dark-dracula", name: "2. 吸血鬼傳說" },
    { id: "dark-nord", name: "3. 北歐極光灰藍" },
    { id: "dark-catppuccin", name: "4. 貓咪摩卡深棕" },
    { id: "dark-cyberpunk", name: "5. 賽博龐克霓虹" },
    { id: "dark-gruvbox", name: "6. 復古暖調" },
    { id: "dark-nebula", name: "7. 深空星雲紫" },
    { id: "dark-forest", name: "8. 森林暗夜松綠" },
    { id: "dark-matrix", name: "9. 黑客矩陣綠" },
    { id: "dark-crimson", name: "10. 黑曜石血石紅" },
    { id: "dark-cobalt", name: "11. 暮光深海鈷藍" },
    { id: "dark-amber", name: "12. 暖夜復古琥珀" },
    { id: "dark-oled", name: "13. OLED 純黑單色" },
    { id: "dark-rose-pine", name: "14. 暮色玫瑰金" },
    { id: "dark-solarized", name: "15. 太陽能微光" }
  ]
};

const initialDefaultPeriods = [
  { id: 1, name: "第一節", start: "08:10", end: "09:00" },
  { id: 2, name: "第二節", start: "09:10", end: "10:00" },
  { id: 3, name: "第三節", start: "10:10", end: "11:00" },
  { id: 4, name: "第四節", start: "11:10", end: "12:00" },
  { id: 5, name: "第五節", start: "13:10", end: "14:00" },
  { id: 6, name: "第六節", start: "14:10", end: "15:00" },
  { id: 7, name: "第七節", start: "15:10", end: "16:00" },
  { id: 8, name: "第八節", start: "16:10", end: "17:00" },
  { id: 9, name: "第九節", start: "17:10", end: "18:00", optional: true },
  { id: 10, name: "第十節", start: "18:10", end: "19:00", optional: true }
];

const CELL_HEIGHT = 56;

// ========================================================
// 預設資料狀態
// ========================================================
function createDefaultState() {
  const defaultSchId = "sch_" + Date.now();
  return {
    themeMode: "light",
    themeStyle: "light-swiss-blue",
    lastLightStyle: "light-swiss-blue",
    lastDarkStyle: "dark-tokyo-night",
    isEditMode: false,
    showLatePeriods: false,
    showTutoring: false,
    textAlign: "center",
    billings: [],
    workBillings: [],
    finances: [],
    customCategories: null,
    showHiddenItems: false,
    activeScheduleId: defaultSchId,
    schedules: [
      {
        id: defaultSchId,
        title: "115學年度上學期課表",
        startDate: "2026-09-07",
        endDate: "2027-01-10",
        periods: JSON.parse(JSON.stringify(initialDefaultPeriods)),
        courses: {},
        tutorings: [],
        works: [],
        overrides: [],
        temporaryEvents: [],
        weeklyMemos: {}
      }
    ]
  };
}

let state = createDefaultState();
let currentEditingSlot = null;
let currentEditingTutoringId = null;
let currentEditingWorkId = null;
let currentEditingBillingIndex = null;
let currentEditingWorkBillingIndex = null;
let currentViewingOverrideId = null;
let currentViewingTempEventId = null;
let currentEditingOverrideId = null;
let currentEditingTempEventId = null;
let currentWeekOffset = 0;
let currentSelectedStudentFilter = "all";

// 帳務模式：'tutoring' (家教) 或 'work' (工作)
let currentBillingType = "tutoring";

let financeActiveMode = "all";
let financeActiveMainCat = "all";
let financeActiveSubCat = "all";

let activeCatTask = { type: "", pCat: "", sIdx: "" };

function getActiveSchedule() {
  if (!state.schedules || !Array.isArray(state.schedules) || state.schedules.length === 0) {
    const dId = "sch_" + Date.now();
    state.schedules = [
      {
        id: dId,
        title: "115學年度上學期課表",
        startDate: "2026-09-07",
        endDate: "2027-01-10",
        periods: JSON.parse(JSON.stringify(initialDefaultPeriods)),
        courses: {},
        tutorings: [],
        works: [],
        overrides: [],
        temporaryEvents: [],
        weeklyMemos: {}
      }
    ];
    state.activeScheduleId = dId;
  }
  let sch = state.schedules.find((s) => s.id === state.activeScheduleId);
  if (!sch) {
    sch = state.schedules[0];
    state.activeScheduleId = sch.id;
  }
  sch.courses = sch.courses || {};
  sch.tutorings = sch.tutorings || [];
  sch.works = sch.works || [];
  sch.overrides = sch.overrides || [];
  sch.temporaryEvents = sch.temporaryEvents || [];
  sch.weeklyMemos = sch.weeklyMemos || {};
  sch.periods = sch.periods || JSON.parse(JSON.stringify(initialDefaultPeriods));
  sch.title = sch.title || "學期課表";
  sch.startDate = sch.startDate || "2026-09-07";
  sch.endDate = sch.endDate || "2027-01-10";
  return sch;
}

const DEFAULT_CATEGORIES = {
  expense: {
    "🍽️ 飲食": ["早餐", "午餐", "晚餐", "飲料零食", "外食聚餐", "食材買菜", "還款"],
    "🚗 交通": ["大眾運輸", "計程車", "油錢", "停車費", "維修保養"],
    "🛍️ 購物": ["服飾配件", "日用品", "3C科技", "美妝保養"],
    "🎉 娛樂": ["電影展覽", "旅遊度假", "手遊課金", "運動健身"],
    "🏠 居住": ["房租房貸", "水電瓦斯", "管理費", "家具家電"],
    "📚 教育": ["書籍雜誌", "線上課程", "學費考試"],
    "💊 醫療": ["門診藥品", "保險費", "體檢"],
    "📦 其他": ["還款", "其他支出"]
  },
  income: {
    "💰 工作收入": ["本業薪資", "家教收入", "兼職外快", "獎金紅利"],
    "📈 理財收入": ["股息股利", "利息收入", "投資變現"],
    "🧧 其他收入": ["中獎發票", "禮金紅包", "還款", "其他"]
  },
  transfer: {
    "🔄 帳戶轉帳": ["銀行互轉", "提款", "存款"]
  },
  receivable: {
    "📥 應收款項": ["代墊款項", "借出款項"]
  },
  payable: {
    "📤 應付款項": ["刷卡應付", "跟人借款"]
  }
};

function getCategories() {
  if (!state.customCategories) {
    state.customCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }
  return state.customCategories;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isDaytimeSlot(startTime, endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const dayStart = 8 * 60;
  const dayEnd = 17 * 60;
  return (startMin >= dayStart && startMin <= dayEnd) || (endMin >= dayStart && endMin <= dayEnd);
}

function timeToPixelOffset(timeMins, periods) {
  if (!periods || periods.length === 0) return 0;
  const firstStart = timeToMinutes(periods[0].start);
  if (timeMins <= firstStart) return 0;

  for (let i = 0; i < periods.length; i++) {
    const pStart = timeToMinutes(periods[i].start);
    const pEnd = timeToMinutes(periods[i].end);

    if (timeMins >= pStart && timeMins <= pEnd) {
      const ratio = (timeMins - pStart) / (pEnd - pStart || 1);
      return i * CELL_HEIGHT + ratio * CELL_HEIGHT;
    }

    if (i < periods.length - 1) {
      const nextStart = timeToMinutes(periods[i + 1].start);
      if (timeMins > pEnd && timeMins < nextStart) {
        const breakRatio = (timeMins - pEnd) / (nextStart - pEnd || 1);
        return (i + 1) * CELL_HEIGHT - (1 - breakRatio) * 2;
      }
    }
  }
  return periods.length * CELL_HEIGHT;
}

function getComputedThemeColor(variableName) {
  const temp = document.createElement("div");
  temp.style.color = `var(${variableName})`;
  document.body.appendChild(temp);
  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);
  return computed;
}

function getDefaultSchoolBgHex() {
  const rgb = getComputedThemeColor("--school-def-bg");
  return rgbToHex(rgb) || "#e0f2fe";
}

function getDefaultTutoringBgHex() {
  const rgb = getComputedThemeColor("--tutoring-def-bg");
  return rgbToHex(rgb) || "#fef3c7";
}

function getDefaultWorkBgHex() {
  const rgb = getComputedThemeColor("--work-def-bg");
  return rgbToHex(rgb) || "#ccfbf1";
}

function rgbToHex(rgbStr) {
  if (rgbStr.startsWith("#")) return rgbStr;
  const match = rgbStr.match(/\d+/g);
  if (!match || match.length < 3) return null;
  return (
    "#" +
    (
      (1 << 24) +
      (Number(match[0]) << 16) +
      (Number(match[1]) << 8) +
      Number(match[2])
    )
      .toString(16)
      .slice(1)
  );
}

function getTextColorForBg(hexColor) {
  if (!hexColor || !hexColor.startsWith("#")) return "var(--text)";
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 130 ? "#0f172a" : "#ffffff";
}

function clearAllCustomColors() {
  if (confirm("確定要清除所有課程、家教與工作的自訂底色，全部恢復為主題最適色嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    if (sch.courses) {
      Object.keys(sch.courses).forEach((k) => {
        if (sch.courses[k].color) delete sch.courses[k].color;
      });
    }
    if (sch.tutorings) {
      sch.tutorings.forEach((t) => {
        if (t.color) delete t.color;
      });
    }
    if (sch.works) {
      sch.works.forEach((w) => {
        if (w.color) delete w.color;
      });
    }
    saveToStorage();
    renderSchedule();
    alert("已成功清除所有自訂顏色！");
  }
}

function onTextAlignChange(val) {
  triggerHaptic(15);
  state.textAlign = val;
  saveToStorage();
  renderSchedule();
}

function updatePresetDropdowns() {
  const sch = getActiveSchedule();
  const courseSelect = document.getElementById("sch-preset-select");
  if (courseSelect) {
    courseSelect.innerHTML = '<option value="">-- 選擇已存在的課程自動帶入 --</option>';
    const uniqueCourses = {};
    Object.values(sch.courses || {}).forEach((c) => {
      if (c.name && !uniqueCourses[c.name]) {
        uniqueCourses[c.name] = c;
        const opt = document.createElement("option");
        opt.value = JSON.stringify(c);
        opt.innerText = c.name + (c.room ? ` (${c.room})` : "") + (c.type ? ` [${c.type}]` : "");
        courseSelect.appendChild(opt);
      }
    });
  }

  const tutorSelect = document.getElementById("tut-preset-select");
  if (tutorSelect) {
    tutorSelect.innerHTML = '<option value="">-- 選擇已存在的家教資料自動帶入 --</option>';
    const uniqueTutors = {};
    (sch.tutorings || []).forEach((t) => {
      if (t.student && !uniqueTutors[t.student]) {
        uniqueTutors[t.student] = t;
        const opt = document.createElement("option");
        opt.value = JSON.stringify(t);
        opt.innerText = `${t.student} (${t.subject || "家教"})`;
        tutorSelect.appendChild(opt);
      }
    });
  }

  const workSelect = document.getElementById("work-preset-select");
  if (workSelect) {
    workSelect.innerHTML = '<option value="">-- 選擇已存在的工作資料自動帶入 --</option>';
    const uniqueWorks = {};
    (state.schedules || []).forEach((s) => {
      (s.works || []).forEach((w) => {
        if (w.name && !uniqueWorks[w.name]) {
          uniqueWorks[w.name] = w;
          const opt = document.createElement("option");
          opt.value = JSON.stringify(w);
          opt.innerText = `${w.name} (${w.location || "工作"})`;
          workSelect.appendChild(opt);
        }
      });
    });
  }
}

function onSelectPresetCourse(jsonStr) {
  if (!jsonStr) return;
  try {
    const c = JSON.parse(jsonStr);
    document.getElementById("sch-name").value = c.name || "";
    document.getElementById("sch-room").value = c.room || "";
    document.getElementById("sch-teacher").value = c.teacher || "";
    document.getElementById("sch-memo").value = c.memo || "";

    if (c.type) {
      const typeSelect = document.getElementById("sch-type-select");
      let found = false;
      for (let opt of typeSelect.options) {
        if (opt.value === c.type) {
          typeSelect.value = c.type;
          found = true;
          break;
        }
      }
      if (!found) {
        typeSelect.value = "custom";
        document.getElementById("sch-type-custom-wrap").style.display = "block";
        document.getElementById("sch-type-custom").value = c.type;
      } else {
        document.getElementById("sch-type-custom-wrap").style.display = "none";
      }
    }

    if (c.color) {
      document.getElementById("sch-color").value = c.color;
      document.getElementById("sch-color-desc").innerText = "目前使用：自訂顏色";
    } else {
      document.getElementById("sch-color").value = getDefaultSchoolBgHex();
      document.getElementById("sch-color-desc").innerText = "目前使用：主題最適色";
    }
  } catch (e) {}
}

function onSchTypeChange(val) {
  const customWrap = document.getElementById("sch-type-custom-wrap");
  if (val === "custom") {
    customWrap.style.display = "block";
  } else {
    customWrap.style.display = "none";
  }
}

function onSelectPresetTutoring(jsonStr) {
  if (!jsonStr) return;
  try {
    const t = JSON.parse(jsonStr);
    document.getElementById("tut-student").value = t.student || "";
    if (t.day) document.getElementById("tut-day").value = t.day;
    if (t.startTime) document.getElementById("tut-start-time").value = t.startTime;
    if (t.endTime) document.getElementById("tut-end-time").value = t.endTime;
    document.getElementById("tut-subject").value = t.subject || "";
    document.getElementById("tut-location").value = t.location || "";
    document.getElementById("tut-line").value = t.line || "";
    document.getElementById("tut-fb").value = t.fb || "";
    document.getElementById("tut-phone").value = t.phone || "";
    if (t.rate) document.getElementById("tut-rate").value = t.rate;
    document.getElementById("tut-memo").value = t.memo || "";
    document.getElementById("tut-color").value = t.color || getDefaultTutoringBgHex();
  } catch (e) {}
}

function onSelectPresetWork(jsonStr) {
  if (!jsonStr) return;
  try {
    const w = JSON.parse(jsonStr);
    document.getElementById("work-name").value = w.name || "";
    if (w.day) document.getElementById("work-day").value = w.day;
    if (w.startTime) document.getElementById("work-start-time").value = w.startTime;
    if (w.endTime) document.getElementById("work-end-time").value = w.endTime;
    document.getElementById("work-location").value = w.location || "";
    if (w.rate) document.getElementById("work-rate").value = w.rate;
    document.getElementById("work-memo").value = w.memo || "";
    document.getElementById("work-color").value = w.color || getDefaultWorkBgHex();
  } catch (e) {}
}

function resetSchoolColor() {
  const defHex = getDefaultSchoolBgHex();
  document.getElementById("sch-color").value = defHex;
  document.getElementById("sch-color-desc").innerText = "目前使用：主題最適色";
}

function resetTutoringColor() {
  const defHex = getDefaultTutoringBgHex();
  document.getElementById("tut-color").value = defHex;
}

function resetWorkColor() {
  const defHex = getDefaultWorkBgHex();
  document.getElementById("work-color").value = defHex;
}

// ==========================================
// 雲端帳號登入與同步邏輯
// ==========================================
async function checkAuthSession() {
  if (!supabaseClient) {
    document.getElementById("sync-user-text").innerText = "本機模式 (未連線)";
    return;
  }
  try {
    const {
      data: { session }
    } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      currentUser = session.user;
      updateUserUI(true, currentUser.email);
      await pullCloudData();
    } else {
      updateUserUI(false);
    }
  } catch (e) {
    updateUserUI(false);
  }
}

function updateUserUI(isLoggedIn, email = "") {
  const dot = document.getElementById("sync-dot");
  const text = document.getElementById("sync-user-text");
  const btn = document.getElementById("btn-auth-action");

  if (isLoggedIn) {
    dot.className = "status-dot online";
    text.innerText = `已同步: ${email}`;
    btn.innerText = "登出";
    btn.onclick = handleAuthLogout;
  } else {
    dot.className = "status-dot";
    text.innerText = "未登入 (本機離線模式)";
    btn.innerText = "登入 / 註冊";
    btn.onclick = openAuthModal;
  }
}

function openAuthModal() {
  document.getElementById("auth-msg").innerText = "";
  document.getElementById("auth-modal").classList.add("active");
}

async function handleAuthLogin() {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById("auth-msg").innerText = "登入失敗：" + error.message;
  } else {
    currentUser = data.user;
    updateUserUI(true, currentUser.email);
    closeModal("auth-modal");
    await pullCloudData();
    alert("登入成功！已完整同步雲端資料。");
  }
}

async function handleAuthRegister() {
  if (!supabaseClient) return;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    document.getElementById("auth-msg").innerText = "註冊失敗：" + error.message;
  } else {
    alert("註冊成功！若有啟用信箱驗證請至 Email 點擊驗證信，或直接點選登入。");
  }
}

async function handleAuthLogout() {
  if (!supabaseClient) return;
  if (confirm("確定要登出帳號嗎？")) {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateUserUI(false);
  }
}

async function pushCloudData() {
  if (!supabaseClient || !currentUser) return;
  try {
    await supabaseClient
      .from("user_schedules")
      .upsert({ user_id: currentUser.id, data: state, updated_at: new Date() });
  } catch (e) {
    console.error("雲端推送失敗", e);
  }
}

async function pullCloudData() {
  if (!supabaseClient || !currentUser) return;
  try {
    const { data, error } = await supabaseClient
      .from("user_schedules")
      .select("data")
      .eq("user_id", currentUser.id)
      .single();

    if (data && data.data) {
      state = { ...createDefaultState(), ...data.data };
      state.workBillings = state.workBillings || [];
      localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
      applyTheme();
      updatePresetDropdowns();

      const tutorCheckbox = document.getElementById("chk-show-tutor");
      if (tutorCheckbox) tutorCheckbox.checked = Boolean(state.showTutoring);
      const lateBtnText = document.getElementById("late-period-text");
      if (lateBtnText) lateBtnText.innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節";
      const alignSelect = document.getElementById("text-align-select");
      if (alignSelect) alignSelect.value = state.textAlign || "center";

      renderSchedule();
      renderBillings();
      renderFinances();
    } else {
      await pushCloudData();
    }
  } catch (e) {
    console.error("雲端拉取失敗", e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
    updatePresetDropdowns();
    pushCloudData();
  } catch (e) {
    console.error("儲存失敗", e);
  }
}

function toggleEditMode() {
  triggerHaptic(25);
  state.isEditMode = !state.isEditMode;
  updateEditModeBtn();
  saveToStorage();
}

function updateEditModeBtn() {
  const btn = document.getElementById("btn-edit-mode-toggle");
  if (!btn) return;
  if (state.isEditMode) {
    btn.innerHTML = "編輯中";
    btn.className = "btn btn-warning btn-edit-mode";
  } else {
    btn.innerHTML = "唯讀模式";
    btn.className = "btn btn-secondary";
  }
}

function initThemeDropdown() {
  const select = document.getElementById("theme-style-select");
  if (!select) return;
  select.innerHTML = "";
  const mode = state.themeMode || "light";
  const options = THEME_OPTIONS[mode];

  options.forEach((opt) => {
    const optionEl = document.createElement("option");
    optionEl.value = opt.id;
    optionEl.innerText = opt.name;
    if (opt.id === state.themeStyle) optionEl.selected = true;
    select.appendChild(optionEl);
  });
}

function toggleThemeMode() {
  triggerHaptic(20);
  if (state.themeMode === "light") {
    state.lastLightStyle = state.themeStyle;
    state.themeMode = "dark";
    state.themeStyle = state.lastDarkStyle || "dark-tokyo-night";
  } else {
    state.lastDarkStyle = state.themeStyle;
    state.themeMode = "light";
    state.themeStyle = state.lastLightStyle || "light-swiss-blue";
  }
  applyTheme();
}

function onThemeStyleSelect(styleId) {
  triggerHaptic(20);
  state.themeStyle = styleId;
  state.themeMode = styleId.startsWith("dark") ? "dark" : "light";
  if (state.themeMode === "dark") {
    state.lastDarkStyle = styleId;
  } else {
    state.lastLightStyle = styleId;
  }
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme-style", state.themeStyle);
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.innerText = state.themeMode === "dark" ? "淺色" : "深色";
  }
  initThemeDropdown();
  renderSchedule();
  saveToStorage();
}

function init() {
  const saved = localStorage.getItem("local_schedule_v2_data");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state = { ...createDefaultState(), ...parsed };
        state.workBillings = state.workBillings || [];
        if (!parsed.schedules || !Array.isArray(parsed.schedules) || parsed.schedules.length === 0) {
          const dId = "sch_" + Date.now();
          state.schedules = [
            {
              id: dId,
              title: parsed.scheduleTitle || "115學年度上學期課表",
              startDate: parsed.scheduleStartDate || "2026-09-07",
              endDate: parsed.scheduleEndDate || "2027-01-10",
              periods: parsed.periods || JSON.parse(JSON.stringify(initialDefaultPeriods)),
              courses: parsed.courses || {},
              tutorings: parsed.tutorings || [],
              works: parsed.works || [],
              overrides: parsed.overrides || [],
              temporaryEvents: parsed.temporaryEvents || [],
              weeklyMemos: parsed.weeklyMemos || {}
            }
          ];
          state.activeScheduleId = dId;
        }
      }
    } catch (e) {
      console.error("Parse storage error", e);
    }
  }

  document.documentElement.setAttribute("data-theme-style", state.themeStyle);
  initThemeDropdown();
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.innerText = state.themeMode === "dark" ? "淺色" : "深色";
  }

  const tutorCheckbox = document.getElementById("chk-show-tutor");
  if (tutorCheckbox) {
    tutorCheckbox.checked = Boolean(state.showTutoring);
  }

  const lateBtnText = document.getElementById("late-period-text");
  if (lateBtnText) {
    lateBtnText.innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節";
  }

  const alignSelect = document.getElementById("text-align-select");
  if (alignSelect) {
    alignSelect.value = state.textAlign || "center";
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const monthInput = document.getElementById("bill-month-filter");
  if (monthInput && !monthInput.value) {
    monthInput.value = `${year}-${month}`;
  }

  const finMonthInput = document.getElementById("fin-month-filter");
  if (finMonthInput && !finMonthInput.value) {
    finMonthInput.value = `${year}-${month}`;
  }

  updateEditModeBtn();
  updatePresetDropdowns();
  renderSchedule();
  renderBillings();
  renderFinances();
  checkAuthSession();
}

function getMondayOfWeek(d, offsetWeeks = 0) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff + offsetWeeks * 7);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekKey(d) {
  const monday = getMondayOfWeek(d, currentWeekOffset);
  return formatDate(monday);
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatSlashDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[0]}/${Number(parts[1])}/${Number(parts[2])}`;
  }
  return dateStr;
}

function formatShortDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function changeWeek(offset) {
  triggerHaptic(15);
  currentWeekOffset += offset;
  renderSchedule();
}

function resetCurrentWeek() {
  triggerHaptic(15);
  currentWeekOffset = 0;
  renderSchedule();
}

function toggleTutorView() {
  state.showTutoring = document.getElementById("chk-show-tutor").checked;
  saveToStorage();
  renderSchedule();
}

function toggleLatePeriods() {
  state.showLatePeriods = !state.showLatePeriods;
  document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節";
  saveToStorage();
  renderSchedule();
}

function switchView(view) {
  triggerHaptic(20);
  document.getElementById("tab-btn-schedule").classList.toggle("active", view === "schedule");
  document.getElementById("tab-btn-billing").classList.toggle("active", view === "billing");
  document.getElementById("tab-btn-finance").classList.toggle("active", view === "finance");

  document.getElementById("schedule-view").style.display = view === "schedule" ? "block" : "none";
  document.getElementById("billing-view").style.display = view === "billing" ? "block" : "none";
  document.getElementById("finance-view").style.display = view === "finance" ? "block" : "none";

  if (view === "billing") renderBillings();
  if (view === "finance") renderFinances();
}

// ==========================================
// 多課表管理與選擇
// ==========================================
function openScheduleSelectModal() {
  const listEl = document.getElementById("schedule-select-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  (state.schedules || []).forEach((sch) => {
    const isActive = sch.id === state.activeScheduleId;
    const item = document.createElement("div");
    item.style = `display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border); background:${
      isActive ? "var(--today-header-bg)" : "transparent"
    }; border-radius:6px; margin-bottom:4px;`;
    item.innerHTML = `
      <div>
        <div style="font-weight:700; font-size:0.85rem; color:${isActive ? "var(--today-header-text)" : "var(--text)"};">${escapeHtml(
      sch.title
    )}</div>
        <div style="font-size:0.68rem; color:var(--text-muted);">${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}</div>
      </div>
      <div style="display:flex; gap:4px;">
        ${
          !isActive
            ? `<button class="btn" style="padding:2px 6px; font-size:0.68rem;" onclick="switchActiveSchedule('${sch.id}')">切換</button>`
            : `<span class="tag-paid" style="font-size:0.68rem;">目前使用</span>`
        }
        ${state.schedules.length > 1 ? `<button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteSchedule('${sch.id}')">刪除</button>` : ""}
      </div>
    `;
    listEl.appendChild(item);
  });
  document.getElementById("schedule-select-modal").classList.add("active");
}

function switchActiveSchedule(schId) {
  triggerHaptic(20);
  state.activeScheduleId = schId;
  saveToStorage();
  updatePresetDropdowns();
  renderSchedule();
  closeModal("schedule-select-modal");
}

function openCreateScheduleModal() {
  document.getElementById("new-sch-title").value = "";
  const today = formatDate(new Date());
  document.getElementById("new-sch-start").value = today;
  document.getElementById("new-sch-end").value = "2027-01-10";
  document.getElementById("schedule-select-modal").classList.remove("active");
  document.getElementById("create-schedule-modal").classList.add("active");
}

function confirmCreateSchedule() {
  triggerHaptic(20);
  const title = document.getElementById("new-sch-title").value.trim();
  const start = document.getElementById("new-sch-start").value;
  const end = document.getElementById("new-sch-end").value;

  if (!title || !start || !end) {
    alert("請完整填寫課表名稱與起訖日期！");
    return;
  }

  const newId = "sch_" + Date.now();
  const newSch = {
    id: newId,
    title,
    startDate: start,
    endDate: end,
    periods: JSON.parse(JSON.stringify(initialDefaultPeriods)),
    courses: {},
    tutorings: [],
    works: [],
    overrides: [],
    temporaryEvents: [],
    weeklyMemos: {}
  };

  if (!state.schedules) state.schedules = [];
  state.schedules.push(newSch);
  state.activeScheduleId = newId;

  saveToStorage();
  updatePresetDropdowns();
  renderSchedule();
  closeModal("create-schedule-modal");
  alert(`已成功建立並切換至「${title}」！`);
}

function deleteSchedule(schId) {
  if (state.schedules.length <= 1) {
    alert("必須保留至少一個課表！");
    return;
  }
  if (confirm("確定要刪除此課表嗎？此動作無法復原。")) {
    triggerHaptic(25);
    state.schedules = state.schedules.filter((s) => s.id !== schId);
    if (state.activeScheduleId === schId) {
      state.activeScheduleId = state.schedules[0].id;
    }
    saveToStorage();
    updatePresetDropdowns();
    renderSchedule();
    openScheduleSelectModal();
  }
}

function openScheduleConfigModal() {
  const sch = getActiveSchedule();
  document.getElementById("sch-conf-title").value = sch.title || "學期課表";
  document.getElementById("sch-conf-start").value = sch.startDate || "2026-09-07";
  document.getElementById("sch-conf-end").value = sch.endDate || "2027-01-10";
  document.getElementById("schedule-config-modal").classList.add("active");
}

function saveScheduleConfig() {
  triggerHaptic(20);
  const title = document.getElementById("sch-conf-title").value.trim() || "學期課表";
  const start = document.getElementById("sch-conf-start").value;
  const end = document.getElementById("sch-conf-end").value;

  if (!start || !end) {
    alert("請完整填寫起訖日期！");
    return;
  }

  const sch = getActiveSchedule();
  sch.title = title;
  sch.startDate = start;
  sch.endDate = end;

  saveToStorage();
  renderSchedule();
  closeModal("schedule-config-modal");
}

// ==========================================
// 互動點擊與詳細預覽
// ==========================================
function handleSlotClick(day, periodId) {
  triggerHaptic(15);
  const sch = getActiveSchedule();
  const key = `${day}_${periodId}`;
  const course = sch.courses ? sch.courses[key] : null;

  if (!state.isEditMode) {
    openViewDetailModal("school", { day, periodId, course: course || {} });
  } else {
    openSchoolModal(day, periodId);
  }
}

function handleTutoringClick(tId) {
  triggerHaptic(15);
  const sch = getActiveSchedule();
  const tut = (sch.tutorings || []).find((t) => t.id === tId);
  if (!tut) return;

  if (!state.isEditMode) {
    openViewDetailModal("tutoring", { tut });
  } else {
    openTutoringModal(tId);
  }
}

function handleWorkClick(wId) {
  triggerHaptic(15);
  const sch = getActiveSchedule();
  const work = (sch.works || []).find((w) => w.id === wId);
  if (!work) return;

  if (!state.isEditMode) {
    openViewDetailModal("work", { work });
  } else {
    openWorkModal(wId);
  }
}

function handleOverrideClick(ovrId) {
  triggerHaptic(15);
  const sch = getActiveSchedule();
  const ovr = (sch.overrides || []).find((o) => o.id === ovrId);
  if (!ovr) return;

  if (!state.isEditMode) {
    openViewDetailModal("override", { ovr });
  } else {
    openOverrideModal(ovrId);
  }
}

function handleTempEventClick(tmpId) {
  triggerHaptic(15);
  const sch = getActiveSchedule();
  const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId);
  if (!tmp) return;

  if (!state.isEditMode) {
    openViewDetailModal("temp_event", { tmp });
  } else {
    openTempEventModal(tmpId);
  }
}

function openViewDetailModal(type, payload) {
  const sch = getActiveSchedule();
  const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  const titleEl = document.getElementById("view-detail-title");
  const bodyEl = document.getElementById("view-detail-body");
  const switchBtn = document.getElementById("btn-switch-to-edit");
  const revertBtn = document.getElementById("btn-revert-override");

  revertBtn.style.display = "none";
  switchBtn.style.display = "inline-flex";
  switchBtn.innerText = "進入編輯";
  currentViewingOverrideId = null;
  currentViewingTempEventId = null;

  const weekKey = getWeekKey(new Date());

  if (type === "school") {
    const { day, periodId, course } = payload;
    titleEl.innerText = course.name || "空堂";
    const itemKey = `school_${day}_${periodId}`;
    const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][itemKey]) || "";

    bodyEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">時間</div>
        <div class="detail-value">${dayNames[day]} 第 ${periodId} 節</div>
        ${course.type ? `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(course.type)}</div>` : ""}
        ${course.room ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(course.room)}</div>` : ""}
        ${course.teacher ? `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(course.teacher)}</div>` : ""}
        ${course.memo ? `<div class="detail-label">總備忘錄</div><div class="detail-value">${escapeHtml(course.memo)}</div>` : ""}
        ${weeklyMemo ? `<div class="detail-label">每周備忘錄 (當週)</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtml(weeklyMemo)}</div>` : ""}
      </div>
    `;
    switchBtn.onclick = () => {
      closeModal("view-detail-modal");
      openSchoolModal(day, periodId);
    };
  } else if (type === "tutoring") {
    const { tut } = payload;
    titleEl.innerText = `家教: ${tut.student}`;
    const itemKey = `tut_${tut.id}`;
    const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][itemKey]) || "";

    let contactHtml = "";
    if (tut.line || tut.fb || tut.phone) {
      contactHtml = `
        <div class="detail-label">家長聯絡方式</div>
        <div class="detail-value">
          ${tut.line ? `Line: ${escapeHtml(tut.line)}<br>` : ""}
          ${tut.fb ? `FB: ${escapeHtml(tut.fb)}<br>` : ""}
          ${tut.phone ? `電話: ${escapeHtml(tut.phone)}` : ""}
        </div>
      `;
    }
    bodyEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">時間</div>
        <div class="detail-value">${dayNames[tut.day]} ${tut.startTime} ~ ${tut.endTime}</div>
        ${tut.subject ? `<div class="detail-label">教學科目與年級</div><div class="detail-value">${escapeHtml(tut.subject)}</div>` : ""}
        ${tut.location ? `<div class="detail-label">上課地點 / 地址</div><div class="detail-value"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tut.location)}" target="_blank" style="color:var(--primary); text-decoration:underline;">${escapeHtml(tut.location)}</a></div>` : ""}
        ${contactHtml}
        ${tut.rate ? `<div class="detail-label">收費時薪</div><div class="detail-value">$${escapeHtml(tut.rate)} / hr</div>` : ""}
        ${tut.memo ? `<div class="detail-label">總備忘錄</div><div class="detail-value">${escapeHtml(tut.memo)}</div>` : ""}
        ${weeklyMemo ? `<div class="detail-label">每周備忘錄 (當週)</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtml(weeklyMemo)}</div>` : ""}
      </div>
    `;
    switchBtn.onclick = () => {
      closeModal("view-detail-modal");
      openTutoringModal(tut.id);
    };
  } else if (type === "work") {
    const { work } = payload;
    titleEl.innerText = `工作: ${work.name}`;
    const typeLabel = work.type === "weekly" ? "每週工作 (僅限當週)" : "固定工作 (每週常規)";

    bodyEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">工作類型</div>
        <div class="detail-value" style="font-weight:700; color:var(--primary);">${typeLabel}</div>
        <div class="detail-label">工作時間</div>
        <div class="detail-value">${dayNames[work.day]} ${work.startTime} ~ ${work.endTime}</div>
        ${work.location ? `<div class="detail-label">工作地點</div><div class="detail-value"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(work.location)}" target="_blank" style="color:var(--primary); text-decoration:underline;">${escapeHtml(work.location)}</a></div>` : ""}
        ${work.rate ? `<div class="detail-label">工作時薪</div><div class="detail-value">$${escapeHtml(work.rate)} / hr</div>` : ""}
        ${work.memo ? `<div class="detail-label">工作備註</div><div class="detail-value">${escapeHtml(work.memo)}</div>` : ""}
      </div>
    `;
    switchBtn.onclick = () => {
      closeModal("view-detail-modal");
      openWorkModal(work.id);
    };
  } else if (type === "override") {
    const { ovr } = payload;
    currentViewingOverrideId = ovr.id;

    let sourceDetailHtml = "";
    if (ovr.type === "tutoring") {
      const originalTut = (sch.tutorings || []).find((t) => t.id === ovr.sourceId);
      if (originalTut) {
        sourceDetailHtml = `
          <div class="detail-label" style="margin-top:8px; border-top:1px dashed var(--border); padding-top:4px;">原本家教詳細資料</div>
          <div class="detail-value">學生: ${escapeHtml(originalTut.student)}</div>
          ${originalTut.subject ? `<div class="detail-value">科目: ${escapeHtml(originalTut.subject)}</div>` : ""}
          ${originalTut.location ? `<div class="detail-value">地點: ${escapeHtml(originalTut.location)}</div>` : ""}
        `;
      }
    } else if (ovr.type === "work") {
      const originalWork = (sch.works || []).find((w) => w.id === ovr.sourceId);
      if (originalWork) {
        sourceDetailHtml = `
          <div class="detail-label" style="margin-top:8px; border-top:1px dashed var(--border); padding-top:4px;">原本工作詳細資料</div>
          <div class="detail-value">工作名稱: ${escapeHtml(originalWork.name)}</div>
          ${originalWork.location ? `<div class="detail-value">地點: ${escapeHtml(originalWork.location)}</div>` : ""}
        `;
      }
    } else if (ovr.type === "school") {
      const originalCourse = sch.courses && sch.courses[ovr.sourceKey];
      if (originalCourse) {
        sourceDetailHtml = `
          <div class="detail-label" style="margin-top:8px; border-top:1px dashed var(--border); padding-top:4px;">原本學校課程資料</div>
          <div class="detail-value">課程: ${escapeHtml(originalCourse.name)}</div>
          ${originalCourse.room ? `<div class="detail-value">地點: ${escapeHtml(originalCourse.room)}</div>` : ""}
        `;
      }
    }

    titleEl.innerText = `調課記錄: ${ovr.title}`;
    bodyEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">調至目標日期</div>
        <div class="detail-value">${ovr.targetDate} (${ovr.startTime} ~ ${ovr.endTime})</div>
        ${ovr.memo ? `<div class="detail-label">調課備註</div><div class="detail-value">${escapeHtml(ovr.memo)}</div>` : ""}
        ${sourceDetailHtml}
      </div>
    `;
    switchBtn.onclick = () => {
      closeModal("view-detail-modal");
      openOverrideModal(ovr.id);
    };
    revertBtn.style.display = "inline-flex";
  } else if (type === "temp_event") {
    const { tmp } = payload;
    currentViewingTempEventId = tmp.id;
    titleEl.innerText = `臨時事件: ${tmp.title}`;
    let timeStr = `${tmp.startTime || ""} ~ ${tmp.endTime || ""}`;
    bodyEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">時間</div>
        <div class="detail-value">${dayNames[tmp.day]} ${timeStr}</div>
        ${tmp.location ? `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tmp.location)}</div>` : ""}
        ${tmp.memo ? `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtml(tmp.memo)}</div>` : ""}
      </div>
    `;
    switchBtn.onclick = () => {
      closeModal("view-detail-modal");
      openTempEventModal(tmp.id);
    };
  }
  document.getElementById("view-detail-modal").classList.add("active");
}

function revertCurrentOverride() {
  if (!currentViewingOverrideId) return;
  if (confirm("確定要取消這筆調課，將課程復原至原本的時段嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    sch.overrides = (sch.overrides || []).filter((o) => o.id !== currentViewingOverrideId);
    saveToStorage();
    renderSchedule();
    closeModal("view-detail-modal");
  }
}

function deleteOverrideFromModal() {
  if (!currentEditingOverrideId) return;
  if (confirm("確定要刪除/取消這筆調課嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    sch.overrides = (sch.overrides || []).filter((o) => o.id !== currentEditingOverrideId);
    saveToStorage();
    renderSchedule();
    closeModal("override-modal");
  }
}

function deleteTempEventFromModal() {
  if (!currentEditingTempEventId) return;
  if (confirm("確定要刪除這個每周臨時事件嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    sch.temporaryEvents = (sch.temporaryEvents || []).filter((t) => t.id !== currentEditingTempEventId);
    saveToStorage();
    renderSchedule();
    closeModal("temp-event-modal");
  }
}

function openPeriodConfigModal() {
  const sch = getActiveSchedule();
  const tbody = document.getElementById("period-config-body");
  tbody.innerHTML = "";
  (sch.periods || initialDefaultPeriods).forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:700;">${p.id}</td>
      <td><input type="text" id="cfg-pname-${idx}" value="${escapeHtml(p.name)}"></td>
      <td><input type="time" id="cfg-pstart-${idx}" value="${p.start}"></td>
      <td><input type="time" id="cfg-pend-${idx}" value="${p.end}"></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("period-config-modal").classList.add("active");
}

function savePeriodConfig() {
  const sch = getActiveSchedule();
  const updated = [];
  const current = sch.periods || initialDefaultPeriods;
  for (let i = 0; i < current.length; i++) {
    const name = document.getElementById(`cfg-pname-${i}`).value.trim() || `第 ${i + 1} 節`;
    const start = document.getElementById(`cfg-pstart-${i}`).value;
    const end = document.getElementById(`cfg-pend-${i}`).value;
    if (!start || !end) {
      alert(`請完整填寫第 ${i + 1} 節的時間！`);
      return;
    }
    updated.push({ id: current[i].id, name, start, end, optional: Boolean(current[i].optional) });
  }
  sch.periods = updated;
  saveToStorage();
  renderSchedule();
  closeModal("period-config-modal");
}

function resetPeriodsToDefault() {
  if (confirm("確定要將所有節次時間恢復為預設值嗎？")) {
    const sch = getActiveSchedule();
    sch.periods = JSON.parse(JSON.stringify(initialDefaultPeriods));
    saveToStorage();
    openPeriodConfigModal();
    renderSchedule();
  }
}

// ==========================================
// 渲染課表
// ==========================================
function renderSchedule() {
  try {
    const sch = getActiveSchedule();
    const monday = getMondayOfWeek(new Date(), currentWeekOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const maxDays = state.showTutoring ? 7 : 5;
    const rangeEnd = new Date(monday);
    rangeEnd.setDate(monday.getDate() + (maxDays - 1));

    const weekKey = getWeekKey(new Date());
    const alignClass = `align-${state.textAlign || "center"}`;

    const rangeTextEl = document.getElementById("week-range-text");
    if (rangeTextEl) {
      rangeTextEl.innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
    }

    const footerBanner = document.getElementById("schedule-footer-banner");
    if (footerBanner) {
      const title = sch.title || "學期課表";
      const startDateFormatted = formatSlashDate(sch.startDate || "2026-09-07");
      const endDateFormatted = formatSlashDate(sch.endDate || "2027-01-10");
      footerBanner.innerHTML = `📅 ${escapeHtml(title)} (${startDateFormatted} ~ ${endDateFormatted}) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[點擊切換/新增]</span>`;
    }

    const tableEl = document.getElementById("schedule-table");
    if (tableEl) {
      if (state.showTutoring) {
        tableEl.style.width = "calc(68px + (100% - 68px) / 5 * 7)";
      } else {
        tableEl.style.width = "100%";
      }
    }

    const thead = document.getElementById("schedule-head");
    if (!thead) return;
    thead.innerHTML = "";
    const headTr = document.createElement("tr");
    headTr.innerHTML = `<th class="col-time">節次</th>`;

    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    const todayStr = formatDate(new Date());

    const weekDates = [];
    for (let i = 0; i < maxDays; i++) {
      const curDate = new Date(monday);
      curDate.setDate(monday.getDate() + i);
      const dateStr = formatDate(curDate);
      weekDates.push(dateStr);

      const th = document.createElement("th");
      if (dateStr === todayStr) th.className = "today-header";
      th.innerHTML = `<div>${dayNames[i + 1]}</div><div style="font-size:0.62rem; font-weight:normal;">${formatShortDate(curDate)}</div>`;
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);

    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = "";

    const schStart = new Date(sch.startDate || "2026-09-07");
    const schEnd = new Date(sch.endDate || "2027-01-10");
    schStart.setHours(0, 0, 0, 0);
    schEnd.setHours(23, 59, 59, 999);

    const isOutOfRange = rangeEnd < schStart || monday > schEnd;

    if (isOutOfRange) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem; line-height:1.5;">
        ⚠️ 本週 (${formatSlashDate(monday)} ~ ${formatSlashDate(rangeEnd)}) 不在當前課表「${escapeHtml(sch.title)}」的有效範圍內 (${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)})。<br>
        <span style="font-size:0.72rem; color:var(--primary); margin-top:4px; display:inline-block;">請點擊下方課表列切換至對應的課表，或調整課表時間範圍。</span>
      </td>`;
      tbody.appendChild(tr);
      return;
    }

    const periodsToRender = (sch.periods || initialDefaultPeriods).filter((p) => !p.optional || state.showLatePeriods);
    const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
    const hasNoonEvents = currentWeekTempEvents.some((t) => t.slotType === "noon");

    // 工作過濾：固定工作 或 當週每週工作
    const currentWeekWorks = (sch.works || []).filter(
      (w) => w.type !== "weekly" || w.weekKey === weekKey
    );

    periodsToRender.forEach((p, pIdx) => {
      const tr = document.createElement("tr");
      const timeTh = document.createElement("td");
      timeTh.className = "col-time";
      timeTh.innerHTML = `<div>${p.name}</div><div style="color:var(--text-muted); font-size:0.58rem;">${p.start}</div>`;
      tr.appendChild(timeTh);

      for (let d = 1; d <= maxDays; d++) {
        const td = document.createElement("td");
        const key = `${d}_${p.id}`;
        const currentCellDate = weekDates[d - 1];

        const wrapper = document.createElement("div");
        wrapper.className = "table-col-wrapper";

        const slotDiv = document.createElement("div");
        slotDiv.className = "cell-slot";

        const course = sch.courses ? sch.courses[key] : null;
        const overriddenCourseKeys = new Set((sch.overrides || []).filter((o) => o.type === "school").map((o) => o.sourceKey));
        const isCourseOverridden = overriddenCourseKeys.has(key);

        if (course && course.name && !isCourseOverridden) {
          slotDiv.onclick = (e) => {
            e.stopPropagation();
            handleSlotClick(d, p.id);
          };
          const bgStyle = course.color
            ? `background-color: ${course.color}; color: ${getTextColorForBg(course.color)};`
            : `background-color: var(--school-def-bg); color: var(--school-def-text);`;

          const weeklyMemoKey = `school_${key}`;
          const hasWeeklyMemo = sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][weeklyMemoKey];

          slotDiv.innerHTML = `
            <div class="slot-item ${alignClass}" style="${bgStyle}">
              ${hasWeeklyMemo ? `<span class="memo-badge" title="有每周備忘錄">📌</span>` : ""}
              <div class="item-title">${escapeHtml(course.name)}</div>
              ${course.room ? `<div class="item-sub">${escapeHtml(course.room)}</div>` : ""}
            </div>
          `;
        } else {
          slotDiv.onclick = (e) => {
            e.stopPropagation();
            handleSlotClick(d, p.id);
          };
          slotDiv.innerHTML = `<span style="color:var(--border); font-size:0.75rem;">+</span>`;
        }

        wrapper.appendChild(slotDiv);

        // 疊加層 (家教、工作、調課、日間臨時事件)
        if (pIdx === 0) {
          const overlayContainer = document.createElement("div");
          overlayContainer.className = "col-overlay-container";

          const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));

          // 1. 白天家教
          const dayTutors = (sch.tutorings || []).filter(
            (t) => Number(t.day) === d && !overriddenSourceIds.has(t.id) && isDaytimeSlot(t.startTime, t.endTime)
          );
          dayTutors.forEach((t) => {
            const tStart = timeToMinutes(t.startTime);
            const tEnd = timeToMinutes(t.endTime);
            const topPx = timeToPixelOffset(tStart, periodsToRender);
            const bottomPx = timeToPixelOffset(tEnd, periodsToRender);
            const heightPx = Math.max(bottomPx - topPx, 28);

            const floatCard = document.createElement("div");
            floatCard.className = `tutoring-float-card is-tutoring ${alignClass}`;
            const bgStyle = t.color
              ? `background-color: ${t.color}; color: ${getTextColorForBg(t.color)};`
              : `background-color: var(--tutoring-def-bg); color: var(--tutoring-def-text);`;

            const weeklyMemoKey = `tut_${t.id}`;
            const hasWeeklyMemo = sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][weeklyMemoKey];

            floatCard.style = `${bgStyle} top: ${topPx + 2}px; height: ${heightPx - 4}px;`;
            floatCard.onclick = (e) => {
              e.stopPropagation();
              handleTutoringClick(t.id);
            };
            floatCard.innerHTML = `
              ${hasWeeklyMemo ? `<span class="memo-badge" title="有每周備忘錄">📌</span>` : ""}
              <div class="item-title">${escapeHtml(t.student)}</div>
              <div class="item-sub">${escapeHtml(t.startTime)}</div>
              <div class="item-sub">${escapeHtml(t.endTime)}</div>
            `;
            overlayContainer.appendChild(floatCard);
          });

          // 2. 白天工作
          const dayWorks = currentWeekWorks.filter(
            (w) => Number(w.day) === d && !overriddenSourceIds.has(w.id) && isDaytimeSlot(w.startTime, w.endTime)
          );
          dayWorks.forEach((w) => {
            const wStart = timeToMinutes(w.startTime);
            const wEnd = timeToMinutes(w.endTime);
            const topPx = timeToPixelOffset(wStart, periodsToRender);
            const bottomPx = timeToPixelOffset(wEnd, periodsToRender);
            const heightPx = Math.max(bottomPx - topPx, 28);

            const floatCard = document.createElement("div");
            floatCard.className = `tutoring-float-card is-work ${alignClass}`;
            const bgStyle = w.color
              ? `background-color: ${w.color}; color: ${getTextColorForBg(w.color)};`
              : `background-color: var(--work-def-bg); color: var(--work-def-text);`;

            floatCard.style = `${bgStyle} top: ${topPx + 2}px; height: ${heightPx - 4}px;`;
            floatCard.onclick = (e) => {
              e.stopPropagation();
              handleWorkClick(w.id);
            };
            floatCard.innerHTML = `
              <div class="item-title">💼 ${escapeHtml(w.name)}</div>
              <div class="item-sub">${escapeHtml(w.location || w.startTime + "~" + w.endTime)}</div>
              <div class="item-sub">${escapeHtml(w.startTime)}~${escapeHtml(w.endTime)}</div>
            `;
            overlayContainer.appendChild(floatCard);
          });

          // 3. 調課事件
          const dayOverrides = (sch.overrides || []).filter(
            (o) => o.targetDate === currentCellDate && isDaytimeSlot(o.startTime, o.endTime)
          );
          dayOverrides.forEach((o) => {
            const oStart = timeToMinutes(o.startTime);
            const oEnd = timeToMinutes(o.endTime);
            const topPx = timeToPixelOffset(oStart, periodsToRender);
            const bottomPx = timeToPixelOffset(oEnd, periodsToRender);
            const heightPx = Math.max(bottomPx - topPx, 28);

            const floatCard = document.createElement("div");
            floatCard.className = `tutoring-float-card is-override-temp ${alignClass}`;
            floatCard.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text); top: ${topPx + 2}px; height: ${heightPx - 4}px;`;
            floatCard.onclick = (e) => {
              e.stopPropagation();
              handleOverrideClick(o.id);
            };
            const loc = o.type === "tutoring" && o.sourceId 
              ? ((sch.tutorings || []).find(t => t.id === o.sourceId)?.location || "") 
              : (o.type === "work" && o.sourceId
                ? ((sch.works || []).find(w => w.id === o.sourceId)?.location || "")
                : (o.type === "school" && o.sourceKey 
                  ? (sch.courses?.[o.sourceKey]?.room || "") 
                  : ""));
            floatCard.innerHTML = `
              <div class="item-title">${escapeHtml(o.title)}</div>
              ${loc ? `<div class="item-sub">${escapeHtml(loc)}</div>` : ""}
            `;
            overlayContainer.appendChild(floatCard);
          });

          // 4. 日間臨時事件
          const dayDaytimeTemps = currentWeekTempEvents.filter(
            (t) => Number(t.day) === d && isDaytimeSlot(t.startTime, t.endTime) && t.slotType !== "noon"
          );
          dayDaytimeTemps.forEach((tmp) => {
            const tmpStart = timeToMinutes(tmp.startTime);
            const tmpEnd = timeToMinutes(tmp.endTime);
            const topPx = timeToPixelOffset(tmpStart, periodsToRender);
            const bottomPx = timeToPixelOffset(tmpEnd, periodsToRender);
            const heightPx = Math.max(bottomPx - topPx, 28);

            const floatCard = document.createElement("div");
            floatCard.className = `tutoring-float-card is-override-temp ${alignClass}`;
            floatCard.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text); top: ${topPx + 2}px; height: ${heightPx - 4}px;`;
            floatCard.onclick = (e) => {
              e.stopPropagation();
              handleTempEventClick(tmp.id);
            };
            floatCard.innerHTML = `
              <div class="item-title">${escapeHtml(tmp.title)}</div>
              ${tmp.location ? `<div class="item-sub">${escapeHtml(tmp.location)}</div>` : ""}
            `;
            overlayContainer.appendChild(floatCard);
          });

          wrapper.appendChild(overlayContainer);
        }

        td.appendChild(wrapper);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);

      // 中午列
      if (p.id === 4 && hasNoonEvents) {
        const noonTr = document.createElement("tr");
        noonTr.className = "noon-row";

        const timeTh = document.createElement("td");
        timeTh.className = "col-time";
        timeTh.innerHTML = `<div>中午</div><div style="color:var(--text-muted); font-size:0.58rem;">午休時段</div>`;
        noonTr.appendChild(timeTh);

        for (let d = 1; d <= maxDays; d++) {
          const td = document.createElement("td");
          const noonCell = document.createElement("div");
          noonCell.className = "noon-cell";

          const dayNoonTemps = currentWeekTempEvents.filter((t) => Number(t.day) === d && t.slotType === "noon");
          let hasNoonContent = false;

          dayNoonTemps.forEach((tmp) => {
            hasNoonContent = true;
            const card = document.createElement("div");
            card.className = `noon-card is-override-temp ${alignClass}`;
            card.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text);`;
            card.onclick = (e) => {
              e.stopPropagation();
              handleTempEventClick(tmp.id);
            };
            card.innerHTML = `
              <div class="item-title">${escapeHtml(tmp.title)}</div>
              ${tmp.location ? `<div class="item-sub">${escapeHtml(tmp.location)}</div>` : ""}
            `;
            noonCell.appendChild(card);
          });

          if (!hasNoonContent) {
            noonCell.innerHTML = `<span class="noon-empty">-</span>`;
          }

          td.appendChild(noonCell);
          noonTr.appendChild(td);
        }
        tbody.appendChild(noonTr);
      }
    });

    // 課後/晚間列
    if (state.showTutoring) {
      const eveningTr = document.createElement("tr");
      eveningTr.className = "evening-row";

      const timeTh = document.createElement("td");
      timeTh.className = "col-time";
      timeTh.innerHTML = `<div>課後</div><div style="color:var(--text-muted); font-size:0.58rem;">夜間時段</div>`;
      eveningTr.appendChild(timeTh);

      const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));

      for (let d = 1; d <= maxDays; d++) {
        const td = document.createElement("td");
        const currentCellDate = weekDates[d - 1];
        const eveningCell = document.createElement("div");
        eveningCell.className = "evening-cell";

        const dayTutors = (sch.tutorings || []).filter(
          (t) => Number(t.day) === d && !overriddenSourceIds.has(t.id) && !isDaytimeSlot(t.startTime, t.endTime)
        );
        const dayWorks = currentWeekWorks.filter(
          (w) => Number(w.day) === d && !overriddenSourceIds.has(w.id) && !isDaytimeSlot(w.startTime, w.endTime)
        );
        const dayOverrides = (sch.overrides || []).filter(
          (o) => o.targetDate === currentCellDate && !isDaytimeSlot(o.startTime, o.endTime)
        );
        const dayEveningTemps = currentWeekTempEvents.filter(
          (t) => Number(t.day) === d && !isDaytimeSlot(t.startTime, t.endTime) && t.slotType !== "noon"
        );

        let hasContent = false;

        // 家教卡片
        dayTutors.forEach((t) => {
          hasContent = true;
          const card = document.createElement("div");
          card.className = `evening-card is-tutoring ${alignClass}`;
          const bgStyle = t.color
            ? `background-color: ${t.color}; color: ${getTextColorForBg(t.color)};`
            : `background-color: var(--tutoring-def-bg); color: var(--tutoring-def-text);`;

          const weeklyMemoKey = `tut_${t.id}`;
          const hasWeeklyMemo = sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][weeklyMemoKey];

          card.style = bgStyle;
          card.onclick = (e) => {
            e.stopPropagation();
            handleTutoringClick(t.id);
          };
          card.innerHTML = `
            ${hasWeeklyMemo ? `<span class="memo-badge" title="有每周備忘錄">📌</span>` : ""}
            <div class="item-title">${escapeHtml(t.student)}</div>
            <div class="item-sub">${escapeHtml(t.startTime)}</div>
            <div class="item-sub">${escapeHtml(t.endTime)}</div>
          `;
          eveningCell.appendChild(card);
        });

        // 工作卡片
        dayWorks.forEach((w) => {
          hasContent = true;
          const card = document.createElement("div");
          card.className = `evening-card is-work ${alignClass}`;
          const bgStyle = w.color
            ? `background-color: ${w.color}; color: ${getTextColorForBg(w.color)};`
            : `background-color: var(--work-def-bg); color: var(--work-def-text);`;

          card.style = bgStyle;
          card.onclick = (e) => {
            e.stopPropagation();
            handleWorkClick(w.id);
          };
          card.innerHTML = `
            <div class="item-title">💼 ${escapeHtml(w.name)}</div>
            <div class="item-sub">${escapeHtml(w.location || w.startTime + "~" + w.endTime)}</div>
            <div class="item-sub">${escapeHtml(w.startTime)}~${escapeHtml(w.endTime)}</div>
          `;
          eveningCell.appendChild(card);
        });

        dayOverrides.forEach((o) => {
          hasContent = true;
          const card = document.createElement("div");
          card.className = `evening-card is-override-temp ${alignClass}`;
          card.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text);`;
          card.onclick = (e) => {
            e.stopPropagation();
            handleOverrideClick(o.id);
          };
          const loc = o.type === "tutoring" && o.sourceId 
            ? ((sch.tutorings || []).find(t => t.id === o.sourceId)?.location || "") 
            : (o.type === "work" && o.sourceId
              ? ((sch.works || []).find(w => w.id === o.sourceId)?.location || "")
              : (o.type === "school" && o.sourceKey 
                ? (sch.courses?.[o.sourceKey]?.room || "") 
                : ""));
          card.innerHTML = `
            <div class="item-title">${escapeHtml(o.title)}</div>
            ${loc ? `<div class="item-sub">${escapeHtml(loc)}</div>` : ""}
          `;
          eveningCell.appendChild(card);
        });

        dayEveningTemps.forEach((tmp) => {
          hasContent = true;
          const card = document.createElement("div");
          card.className = `evening-card is-override-temp ${alignClass}`;
          card.style = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text);`;
          card.onclick = (e) => {
            e.stopPropagation();
            handleTempEventClick(tmp.id);
          };
          card.innerHTML = `
            <div class="item-title">${escapeHtml(tmp.title)}</div>
            ${tmp.location ? `<div class="item-sub">${escapeHtml(tmp.location)}</div>` : ""}
          `;
          eveningCell.appendChild(card);
        });

        if (!hasContent) {
          eveningCell.innerHTML = `<span class="evening-empty">無晚間課程</span>`;
        }

        td.appendChild(eveningCell);
        eveningTr.appendChild(td);
      }
      tbody.appendChild(eveningTr);
    }
  } catch (err) {
    console.error("renderSchedule crashed:", err);
  }
}

// ==========================================
// 學校課程 Modal
// ==========================================
function openSchoolModal(day, period) {
  currentEditingSlot = { day, period };
  const sch = getActiveSchedule();
  const key = `${day}_${period}`;
  const course = (sch.courses && sch.courses[key]) || {};
  document.getElementById("sch-name").value = course.name || "";
  document.getElementById("sch-room").value = course.room || "";
  document.getElementById("sch-teacher").value = course.teacher || "";
  document.getElementById("sch-memo").value = course.memo || "";

  const weekKey = getWeekKey(new Date());
  const itemKey = `school_${key}`;
  const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][itemKey]) || "";
  document.getElementById("sch-weekly-memo").value = weeklyMemo;

  const typeSelect = document.getElementById("sch-type-select");
  const customWrap = document.getElementById("sch-type-custom-wrap");
  const cType = course.type || "必修";

  let found = false;
  for (let opt of typeSelect.options) {
    if (opt.value === cType) {
      typeSelect.value = cType;
      found = true;
      break;
    }
  }
  if (!found) {
    typeSelect.value = "custom";
    customWrap.style.display = "block";
    document.getElementById("sch-type-custom").value = cType;
  } else {
    customWrap.style.display = "none";
    document.getElementById("sch-type-custom").value = "";
  }

  const defHex = getDefaultSchoolBgHex();
  document.getElementById("sch-color").value = course.color || defHex;
  document.getElementById("sch-color-desc").innerText = course.color ? "目前使用：自訂顏色" : "目前使用：主題最適色";

  document.getElementById("school-modal").classList.add("active");
}

function saveSchoolCourse() {
  triggerHaptic(20);
  if (!currentEditingSlot) return;
  const sch = getActiveSchedule();
  const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
  const name = document.getElementById("sch-name").value.trim();
  const room = document.getElementById("sch-room").value.trim();
  const teacher = document.getElementById("sch-teacher").value.trim();
  const memo = document.getElementById("sch-memo").value.trim();
  const weeklyMemoInput = document.getElementById("sch-weekly-memo").value.trim();
  const color = document.getElementById("sch-color").value;

  let typeVal = document.getElementById("sch-type-select").value;
  if (typeVal === "custom") {
    typeVal = document.getElementById("sch-type-custom").value.trim() || "必修";
  }

  if (!sch.courses) sch.courses = {};
  if (!name) delete sch.courses[key];
  else {
    const defHex = getDefaultSchoolBgHex();
    const savedColor = color.toLowerCase() === defHex.toLowerCase() ? undefined : color;
    sch.courses[key] = { name, type: typeVal, room, teacher, memo, color: savedColor };
  }

  const weekKey = getWeekKey(new Date());
  const itemKey = `school_${key}`;
  if (!sch.weeklyMemos) sch.weeklyMemos = {};
  if (!sch.weeklyMemos[weekKey]) sch.weeklyMemos[weekKey] = {};
  if (weeklyMemoInput) {
    sch.weeklyMemos[weekKey][itemKey] = weeklyMemoInput;
  } else {
    delete sch.weeklyMemos[weekKey][itemKey];
  }

  saveToStorage();
  renderSchedule();
  closeModal("school-modal");
}

function deleteSchoolCourse() {
  if (!currentEditingSlot) return;
  if (confirm("確定要清空該節課堂嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
    if (sch.courses) delete sch.courses[key];
    saveToStorage();
    renderSchedule();
    closeModal("school-modal");
  }
}

// ==========================================
// 家教 Modal
// ==========================================
function openTutoringModal(id = null) {
  currentEditingTutoringId = id;
  const sch = getActiveSchedule();
  const delBtn = document.getElementById("tut-delete-btn");
  const defHex = getDefaultTutoringBgHex();
  const weekKey = getWeekKey(new Date());

  if (id) {
    const tut = (sch.tutorings || []).find((t) => t.id === id);
    if (!tut) return;
    document.getElementById("tut-student").value = tut.student || "";
    document.getElementById("tut-day").value = tut.day || "1";
    document.getElementById("tut-start-time").value = tut.startTime || "18:00";
    document.getElementById("tut-end-time").value = tut.endTime || "20:00";
    document.getElementById("tut-subject").value = tut.subject || "";
    document.getElementById("tut-location").value = tut.location || "";
    document.getElementById("tut-line").value = tut.line || "";
    document.getElementById("tut-fb").value = tut.fb || "";
    document.getElementById("tut-phone").value = tut.phone || "";
    document.getElementById("tut-rate").value = tut.rate || "";
    document.getElementById("tut-memo").value = tut.memo || "";
    document.getElementById("tut-color").value = tut.color || defHex;

    const itemKey = `tut_${id}`;
    const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][itemKey]) || "";
    document.getElementById("tut-weekly-memo").value = weeklyMemo;

    delBtn.style.display = "block";
  } else {
    document.getElementById("tut-student").value = "";
    document.getElementById("tut-day").value = "6";
    document.getElementById("tut-start-time").value = "18:00";
    document.getElementById("tut-end-time").value = "20:00";
    document.getElementById("tut-subject").value = "";
    document.getElementById("tut-location").value = "";
    document.getElementById("tut-line").value = "";
    document.getElementById("tut-fb").value = "";
    document.getElementById("tut-phone").value = "";
    document.getElementById("tut-rate").value = "";
    document.getElementById("tut-memo").value = "";
    document.getElementById("tut-weekly-memo").value = "";
    document.getElementById("tut-color").value = defHex;
    delBtn.style.display = "none";
  }
  document.getElementById("tutoring-modal").classList.add("active");
}

function saveTutoringClass() {
  triggerHaptic(20);
  const sch = getActiveSchedule();
  const student = document.getElementById("tut-student").value.trim();
  const day = document.getElementById("tut-day").value;
  const startTime = document.getElementById("tut-start-time").value;
  const endTime = document.getElementById("tut-end-time").value;
  const subject = document.getElementById("tut-subject").value.trim();
  const location = document.getElementById("tut-location").value.trim();
  const line = document.getElementById("tut-line").value.trim();
  const fb = document.getElementById("tut-fb").value.trim();
  const phone = document.getElementById("tut-phone").value.trim();
  const rate = document.getElementById("tut-rate").value;
  const memo = document.getElementById("tut-memo").value.trim();
  const weeklyMemoInput = document.getElementById("tut-weekly-memo").value.trim();
  const color = document.getElementById("tut-color").value;

  if (!student || !startTime || !endTime || !location) {
    alert("請完整填寫學生姓名、上課地點與上課時間！");
    return;
  }

  const defHex = getDefaultTutoringBgHex();
  const savedColor = color.toLowerCase() === defHex.toLowerCase() ? undefined : color;

  if (!sch.tutorings) sch.tutorings = [];
  const tutoringId = currentEditingTutoringId || "tut_" + Date.now();
  const itemData = {
    id: tutoringId,
    student,
    day,
    startTime,
    endTime,
    subject,
    location,
    line,
    fb,
    phone,
    rate,
    memo,
    color: savedColor
  };

  if (currentEditingTutoringId) {
    const idx = sch.tutorings.findIndex((t) => t.id === currentEditingTutoringId);
    if (idx > -1) sch.tutorings[idx] = itemData;
  } else {
    sch.tutorings.push(itemData);
  }

  const weekKey = getWeekKey(new Date());
  const itemKey = `tut_${tutoringId}`;
  if (!sch.weeklyMemos) sch.weeklyMemos = {};
  if (!sch.weeklyMemos[weekKey]) sch.weeklyMemos[weekKey] = {};
  if (weeklyMemoInput) {
    sch.weeklyMemos[weekKey][itemKey] = weeklyMemoInput;
  } else {
    delete sch.weeklyMemos[weekKey][itemKey];
  }

  saveToStorage();
  renderSchedule();
  renderBillings();
  closeModal("tutoring-modal");
}

function deleteTutoringClass() {
  if (!currentEditingTutoringId) return;
  if (confirm("確定要刪除這筆家教課程嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    sch.tutorings = (sch.tutorings || []).filter((t) => t.id !== currentEditingTutoringId);
    saveToStorage();
    renderSchedule();
    closeModal("tutoring-modal");
  }
}

// ==========================================
// 工作 Modal (固定工作 / 每週工作)
// ==========================================
function openWorkModal(id = null) {
  currentEditingWorkId = id;
  const sch = getActiveSchedule();
  const delBtn = document.getElementById("work-delete-btn");
  const modalTitle = document.getElementById("work-modal-title");
  const defHex = getDefaultWorkBgHex();

  if (id) {
    const work = (sch.works || []).find((w) => w.id === id);
    if (!work) return;
    if (modalTitle) modalTitle.innerText = "編輯工作排程";
    document.getElementById("work-type").value = work.type || "fixed";
    document.getElementById("work-name").value = work.name || "";
    document.getElementById("work-day").value = work.day || "1";
    document.getElementById("work-start-time").value = work.startTime || "09:00";
    document.getElementById("work-end-time").value = work.endTime || "12:00";
    document.getElementById("work-location").value = work.location || "";
    document.getElementById("work-rate").value = work.rate || "";
    document.getElementById("work-memo").value = work.memo || "";
    document.getElementById("work-color").value = work.color || defHex;
    delBtn.style.display = "block";
  } else {
    if (modalTitle) modalTitle.innerText = "新增工作排程";
    document.getElementById("work-type").value = "fixed";
    document.getElementById("work-name").value = "";
    document.getElementById("work-day").value = "1";
    document.getElementById("work-start-time").value = "09:00";
    document.getElementById("work-end-time").value = "12:00";
    document.getElementById("work-location").value = "";
    document.getElementById("work-rate").value = "";
    document.getElementById("work-memo").value = "";
    document.getElementById("work-color").value = defHex;
    delBtn.style.display = "none";
  }
  document.getElementById("work-modal").classList.add("active");
}

function saveWorkClass() {
  triggerHaptic(20);
  const sch = getActiveSchedule();
  const type = document.getElementById("work-type").value;
  const name = document.getElementById("work-name").value.trim();
  const day = document.getElementById("work-day").value;
  const startTime = document.getElementById("work-start-time").value;
  const endTime = document.getElementById("work-end-time").value;
  const location = document.getElementById("work-location").value.trim();
  const rate = document.getElementById("work-rate").value;
  const memo = document.getElementById("work-memo").value.trim();
  const color = document.getElementById("work-color").value;

  if (!name || !startTime || !endTime || !location) {
    alert("請完整填寫工作名稱、工作地點與工作時間！");
    return;
  }

  const defHex = getDefaultWorkBgHex();
  const savedColor = color.toLowerCase() === defHex.toLowerCase() ? undefined : color;
  const weekKey = getWeekKey(new Date());

  if (!sch.works) sch.works = [];
  const workId = currentEditingWorkId || "work_" + Date.now();
  const itemData = {
    id: workId,
    type, // 'fixed' 或 'weekly'
    weekKey: type === "weekly" ? weekKey : undefined,
    name,
    day,
    startTime,
    endTime,
    location,
    rate,
    memo,
    color: savedColor
  };

  if (currentEditingWorkId) {
    const idx = sch.works.findIndex((w) => w.id === currentEditingWorkId);
    if (idx > -1) sch.works[idx] = itemData;
  } else {
    sch.works.push(itemData);
  }

  saveToStorage();
  renderSchedule();
  renderBillings();
  closeModal("work-modal");
}

function deleteWorkClass() {
  if (!currentEditingWorkId) return;
  if (confirm("確定要刪除這筆工作排程嗎？")) {
    triggerHaptic(25);
    const sch = getActiveSchedule();
    sch.works = (sch.works || []).filter((w) => w.id !== currentEditingWorkId);
    saveToStorage();
    renderSchedule();
    closeModal("work-modal");
  }
}

// ==========================================
// 每周臨時事件設定與編輯
// ==========================================
function openTempEventModal(tmpId = null) {
  currentEditingTempEventId = tmpId;
  const titleEl = document.getElementById("temp-event-modal-title");
  const saveBtn = document.getElementById("tmp-save-btn");
  const delBtn = document.getElementById("tmp-delete-btn");
  const sch = getActiveSchedule();

  if (tmpId) {
    const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId);
    if (!tmp) return;

    if (titleEl) titleEl.innerText = "編輯每周臨時事件";
    if (saveBtn) saveBtn.innerText = "儲存修改";
    if (delBtn) delBtn.style.display = "inline-flex";

    document.getElementById("tmp-title").value = tmp.title || "";
    document.getElementById("tmp-day").value = tmp.day || "1";
    document.getElementById("tmp-slot-type").value = tmp.slotType || "period";
    onTempSlotTypeChange(tmp.slotType || "period");

    if (tmp.slotType === "period") {
      document.getElementById("tmp-period-id").value = tmp.periodId || "1";
    }
    document.getElementById("tmp-start-time").value = tmp.startTime || "12:00";
    document.getElementById("tmp-end-time").value = tmp.endTime || "13:00";
    document.getElementById("tmp-location").value = tmp.location || "";
    document.getElementById("tmp-memo").value = tmp.memo || "";
  } else {
    if (titleEl) titleEl.innerText = "新增每周臨時事件";
    if (saveBtn) saveBtn.innerText = "儲存事件";
    if (delBtn) delBtn.style.display = "none";

    document.getElementById("tmp-title").value = "";
    document.getElementById("tmp-day").value = "1";
    document.getElementById("tmp-slot-type").value = "period";
    document.getElementById("tmp-period-id").value = "1";
    document.getElementById("tmp-start-time").value = "12:00";
    document.getElementById("tmp-end-time").value = "13:00";
    document.getElementById("tmp-location").value = "";
    document.getElementById("tmp-memo").value = "";
    onTempSlotTypeChange("period");
  }
  document.getElementById("temp-event-modal").classList.add("active");
}

function onTempSlotTypeChange(type) {
  const periodWrap = document.getElementById("tmp-period-wrap");
  const timeWrap = document.getElementById("tmp-time-wrap");
  if (type === "period") {
    periodWrap.style.display = "block";
    timeWrap.style.display = "none";
  } else if (type === "noon") {
    periodWrap.style.display = "none";
    timeWrap.style.display = "flex";
  } else if (type === "evening") {
    periodWrap.style.display = "none";
    timeWrap.style.display = "flex";
  }
}

function saveTempEvent() {
  triggerHaptic(20);
  const title = document.getElementById("tmp-title").value.trim();
  const day = document.getElementById("tmp-day").value;
  const slotType = document.getElementById("tmp-slot-type").value;
  const periodId = document.getElementById("tmp-period-id").value;
  const startTime = document.getElementById("tmp-start-time").value;
  const endTime = document.getElementById("tmp-end-time").value;
  const location = document.getElementById("tmp-location").value.trim();
  const memo = document.getElementById("tmp-memo").value.trim();

  if (!title) {
    alert("請輸入事件名稱！");
    return;
  }

  const sch = getActiveSchedule();
  const weekKey = getWeekKey(new Date());
  if (!sch.temporaryEvents) sch.temporaryEvents = [];

  let finalStart = startTime;
  let finalEnd = endTime;
  if (slotType === "period") {
    const pObj = (sch.periods || initialDefaultPeriods).find((p) => String(p.id) === String(periodId));
    if (pObj) {
      finalStart = pObj.start;
      finalEnd = pObj.end;
    }
  }

  if (currentEditingTempEventId) {
    const idx = sch.temporaryEvents.findIndex((t) => t.id === currentEditingTempEventId);
    if (idx > -1) {
      sch.temporaryEvents[idx] = {
        ...sch.temporaryEvents[idx],
        day,
        slotType,
        periodId: slotType === "period" ? periodId : null,
        title,
        startTime: finalStart,
        endTime: finalEnd,
        location,
        memo
      };
    }
  } else {
    sch.temporaryEvents.push({
      id: "tmp_" + Date.now(),
      weekKey,
      day,
      slotType,
      periodId: slotType === "period" ? periodId : null,
      title,
      startTime: finalStart,
      endTime: finalEnd,
      location,
      memo
    });
  }

  saveToStorage();
  renderSchedule();
  closeModal("temp-event-modal");
}

// ==========================================
// 帳務管理邏輯 (家教帳務 vs 工作帳務)
// ==========================================
function switchBillingType(type) {
  triggerHaptic(15);
  currentBillingType = type;
  currentSelectedStudentFilter = "all";

  const btnTutoring = document.getElementById("btn-billing-type-tutoring");
  const btnWork = document.getElementById("btn-billing-type-work");
  if (btnTutoring) btnTutoring.className = `billing-type-btn ${type === "tutoring" ? "active" : ""}`;
  if (btnWork) btnWork.className = `billing-type-btn ${type === "work" ? "active" : ""}`;

  const navBillingText = document.getElementById("nav-billing-text");
  if (navBillingText) {
    navBillingText.innerText = type === "tutoring" ? "家教帳務" : "工作帳務";
  }

  renderBillings();
}

function openCurrentBillingModal() {
  if (currentBillingType === "work") {
    openWorkBillingModal();
  } else {
    openBillingModal();
  }
}

function setBillingMonthCurrent() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  document.getElementById("bill-month-filter").value = `${year}-${month}`;
  renderBillings();
}

function setBillingMonthAll() {
  document.getElementById("bill-month-filter").value = "";
  renderBillings();
}

function setStudentFilter(name) {
  triggerHaptic(15);
  currentSelectedStudentFilter = name;
  renderBillings();
}

function renderBillings() {
  const tbody = document.getElementById("billing-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const isWork = currentBillingType === "work";
  const selectedMonth = document.getElementById("bill-month-filter").value;
  const sortOrder = document.getElementById("bill-sort-order")?.value || "desc";
  const statusDesc = document.getElementById("month-status-desc");
  const sectionTitle = document.getElementById("student-section-title");
  const thTarget = document.getElementById("th-billing-target");
  const unpaidTitle = document.getElementById("stat-unpaid-title");

  if (thTarget) thTarget.innerText = isWork ? "工作名稱" : "學生";
  if (unpaidTitle) unpaidTitle.innerText = isWork ? "未領取金額" : "未繳清金額";

  if (selectedMonth) {
    if (statusDesc) statusDesc.innerText = `目前：${selectedMonth}`;
    if (sectionTitle) sectionTitle.innerText = isWork ? `工作帳務統計 (${selectedMonth})` : `學生帳務統計 (${selectedMonth})`;
  } else {
    if (statusDesc) statusDesc.innerText = `目前：全部歷史`;
    if (sectionTitle) sectionTitle.innerText = isWork ? `工作帳務統計 (全期間)` : `學生帳務統計 (全期間)`;
  }

  // 1. 建立分類 Chips 清單
  const allNamesSet = new Set();
  if (isWork) {
    (state.schedules || []).forEach((sch) => {
      (sch.works || []).forEach((w) => {
        if (w.name) allNamesSet.add(w.name);
      });
    });
    (state.workBillings || []).forEach((b) => {
      if (b.name) allNamesSet.add(b.name);
    });
  } else {
    (state.schedules || []).forEach((sch) => {
      (sch.tutorings || []).forEach((t) => {
        if (t.student) allNamesSet.add(t.student);
      });
    });
    (state.billings || []).forEach((b) => {
      if (b.student) allNamesSet.add(b.student);
    });
  }
  const namesList = Array.from(allNamesSet);

  const chipsContainer = document.getElementById("student-filter-chips");
  if (chipsContainer) {
    chipsContainer.innerHTML = "";

    const allChip = document.createElement("div");
    allChip.className = `student-chip ${currentSelectedStudentFilter === "all" ? "active" : ""}`;
    allChip.innerText = isWork ? "全部工作" : "全部學生";
    allChip.onclick = () => setStudentFilter("all");
    chipsContainer.appendChild(allChip);

    namesList.forEach((item) => {
      const chip = document.createElement("div");
      chip.className = `student-chip ${currentSelectedStudentFilter === item ? "active" : ""}`;
      chip.innerText = item;
      chip.onclick = () => setStudentFilter(item);
      chipsContainer.appendChild(chip);
    });
  }

  // 2. 統計數據計算
  let totalHours = 0;
  let totalIncome = 0;
  let totalUnpaid = 0;
  const statMap = {};

  const dataset = isWork ? (state.workBillings || []) : (state.billings || []);

  dataset.forEach((record) => {
    const recordMonth = (record.date || '').slice(0, 7);
    if (selectedMonth && recordMonth !== selectedMonth) return;

    const h = Number(record.hours || 0);
    const tot = Number(record.total || 0);
    const targetName = (isWork ? record.name : record.student) || "未具名";

    if (!statMap[targetName]) statMap[targetName] = { totalHours: 0, totalIncome: 0, unpaidAmount: 0, paidAmount: 0 };
    statMap[targetName].totalHours += h;
    statMap[targetName].totalIncome += tot;
    if (record.status === "unpaid") statMap[targetName].unpaidAmount += tot;
    else statMap[targetName].paidAmount += tot;

    if (currentSelectedStudentFilter === "all" || currentSelectedStudentFilter === targetName) {
      totalHours += h;
      totalIncome += tot;
      if (record.status === "unpaid") totalUnpaid += tot;
    }
  });

  // 3. 卡片統計顯示
  const statsContainer = document.getElementById("student-stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = "";
    const keys = Object.keys(statMap);

    if (keys.length === 0) {
      statsContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.75rem;">${
        selectedMonth ? selectedMonth + " 尚無記錄。" : "目前尚無帳務記錄。"
      }</div>`;
    } else {
      keys.forEach((k) => {
        const s = statMap[k];
        const card = document.createElement("div");
        card.className = "student-stat-card";
        card.innerHTML = `
          <div class="student-stat-name">${escapeHtml(k)}</div>
          <div class="student-stat-row"><span>時數：</span><strong>${s.totalHours} hr</strong></div>
          <div class="student-stat-row"><span>應收：</span><strong>$${s.totalIncome.toLocaleString()}</strong></div>
          <div class="student-stat-row"><span>${isWork ? "已領：" : "已收："}</span><span style="color:#15803d; font-weight:700;">$${s.paidAmount.toLocaleString()}</span></div>
          <div class="student-stat-row"><span>${isWork ? "未領：" : "未繳："}</span><span style="color:#ef4444; font-weight:700;">$${s.unpaidAmount.toLocaleString()}</span></div>
        `;
        statsContainer.appendChild(card);
      });
    }
  }

  // 4. 明細表格清單
  let filteredRecords = [];
  dataset.forEach((record, idx) => {
    const recordMonth = (record.date || '').slice(0, 7);
    if (selectedMonth && recordMonth !== selectedMonth) return;
    const targetName = isWork ? record.name : record.student;
    if (currentSelectedStudentFilter !== "all" && targetName !== currentSelectedStudentFilter) return;
    filteredRecords.push({ record, idx });
  });

  filteredRecords.sort((a, b) => {
    const cmp = (a.record.date || "").localeCompare(b.record.date || "");
    return sortOrder === "asc" ? cmp : -cmp;
  });

  let renderedCount = 0;
  filteredRecords.forEach(({ record, idx }) => {
    renderedCount++;
    const targetName = isWork ? record.name : record.student;
    const tr = document.createElement("tr");
    const statusText = record.status === "paid" ? (isWork ? "已領" : "已繳") : (isWork ? "未領" : "未繳");
    const switchFunc = isWork ? `toggleWorkBillStatus(${idx})` : `toggleBillStatus(${idx})`;
    const editFunc = isWork ? `openWorkBillingModal(${idx})` : `openBillingModal(${idx})`;
    const deleteFunc = isWork ? `deleteWorkBilling(${idx})` : `deleteBilling(${idx})`;

    tr.innerHTML = `
      <td>${record.date}</td>
      <td><strong>${escapeHtml(targetName)}</strong></td>
      <td>${record.hours}h</td>
      <td>$${record.rate}</td>
      <td><strong style="color:var(--primary);">$${record.total}</strong></td>
      <td><span class="${record.status === "paid" ? "tag-paid" : "tag-unpaid"}">${statusText}</span></td>
      <td>${escapeHtml(record.notes || "-")}</td>
      <td>
        <button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${switchFunc}">切換</button>
        <button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${editFunc}">編輯</button>
        <button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="${deleteFunc}">刪除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (renderedCount === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8" style="text-align:center; color:var(--text-muted); padding:12px;">沒有符合條件的帳務紀錄</td>`;
    tbody.appendChild(tr);
  }

  const thEl = document.getElementById("stat-total-hours");
  const tiEl = document.getElementById("stat-total-income");
  const tuEl = document.getElementById("stat-unpaid");
  if (thEl) thEl.innerText = `${totalHours} 小時`;
  if (tiEl) tiEl.innerText = `$${totalIncome.toLocaleString()}`;
  if (tuEl) tuEl.innerText = `$${totalUnpaid.toLocaleString()}`;
}

// ------------------------------------------
// 家教帳務操作
// ------------------------------------------
function openBillingModal(editIndex = null) {
  currentEditingBillingIndex = editIndex;
  const modalTitle = document.getElementById("billing-modal-title");
  const sel = document.getElementById("bill-student-select");
  sel.innerHTML = '<option value="">-- 現有家教 --</option>';
  const added = new Set();
  (state.schedules || []).forEach((sch) => {
    (sch.tutorings || []).forEach((t) => {
      if (!added.has(t.student)) {
        added.add(t.student);
        const opt = document.createElement("option");
        opt.value = t.student;
        opt.innerText = t.student;
        sel.appendChild(opt);
      }
    });
  });

  if (editIndex !== null && state.billings && state.billings[editIndex]) {
    const item = state.billings[editIndex];
    if (modalTitle) modalTitle.innerText = "編輯家教帳務記錄";
    document.getElementById("bill-date").value = item.date || "";
    document.getElementById("bill-student").value = item.student || "";
    document.getElementById("bill-hours").value = item.hours || "";
    document.getElementById("bill-rate").value = item.rate || "";
    document.getElementById("bill-total").value = item.total || "";
    document.getElementById("bill-status").value = item.status || "unpaid";
    document.getElementById("bill-notes").value = item.notes || "";
  } else {
    if (modalTitle) modalTitle.innerText = "新增家教帳務記錄";
    const todayStr = formatDate(new Date());
    document.getElementById("bill-date").value = todayStr;
    document.getElementById("bill-student").value = "";
    document.getElementById("bill-hours").value = "2";
    document.getElementById("bill-status").value = "unpaid";
    document.getElementById("bill-notes").value = "";
    updateBillingRateByDateAndStudent();
  }

  document.getElementById("billing-modal").classList.add("active");
}

function onSelectBillingStudent() {
  const s = document.getElementById("bill-student-select").value;
  if (s) {
    document.getElementById("bill-student").value = s;
    updateBillingRateByDateAndStudent();
  }
}

function onBillingDateOrStudentChange() {
  updateBillingRateByDateAndStudent();
}

function updateBillingRateByDateAndStudent() {
  if (currentEditingBillingIndex !== null) return;
  const dateStr = document.getElementById("bill-date").value;
  const studentName = document.getElementById("bill-student").value.trim();

  if (!dateStr || !studentName) {
    if (!document.getElementById("bill-rate").value) {
      document.getElementById("bill-rate").value = "";
      calcBillAmount();
    }
    return;
  }

  const dObj = new Date(dateStr);
  let jsDay = dObj.getDay();
  let targetDayNum = jsDay === 0 ? 7 : jsDay;

  let matchedTutorings = [];
  (state.schedules || []).forEach((sch) => {
    const matches = (sch.tutorings || []).filter((t) => t.student === studentName);
    matchedTutorings = matchedTutorings.concat(matches);
  });

  const exactMatch = matchedTutorings.find((t) => Number(t.day) === targetDayNum);

  if (exactMatch && exactMatch.rate) {
    document.getElementById("bill-rate").value = exactMatch.rate;
  } else if (matchedTutorings.length > 0 && matchedTutorings[0].rate) {
    document.getElementById("bill-rate").value = matchedTutorings[0].rate;
  } else {
    if (!document.getElementById("bill-rate").value) {
      document.getElementById("bill-rate").value = "";
    }
  }
  calcBillAmount();
}

function calcBillAmount() {
  const h = Number(document.getElementById("bill-hours").value) || 0;
  const r = Number(document.getElementById("bill-rate").value) || 0;
  document.getElementById("bill-total").value = Math.round(h * r);
}

function saveBillingRecord() {
  triggerHaptic(20);
  const date = document.getElementById("bill-date").value;
  const student = document.getElementById("bill-student").value.trim();
  const hours = document.getElementById("bill-hours").value;
  const rate = document.getElementById("bill-rate").value;
  const total = document.getElementById("bill-total").value;
  const status = document.getElementById("bill-status").value;
  const notes = document.getElementById("bill-notes").value.trim();

  if (!date || !student || !hours || !rate) {
    alert("請填寫完整帳務資訊！");
    return;
  }
  if (!state.billings) state.billings = [];
  if (!state.finances) state.finances = [];

  if (currentEditingBillingIndex !== null) {
    const oldItem = state.billings[currentEditingBillingIndex];
    const billingId = oldItem.id || "bill_" + Date.now();
    state.billings[currentEditingBillingIndex] = { id: billingId, date, student, hours, rate, total, status, notes };

    const finIdx = state.finances.findIndex((f) => f.id === "fin_sync_" + billingId);
    if (finIdx > -1) {
      state.finances[finIdx] = {
        ...state.finances[finIdx],
        date,
        amount: Number(total),
        notes: `家教收入: ${student} (${hours}hr)`
      };
    } else {
      state.finances.unshift({
        id: "fin_sync_" + billingId,
        date,
        type: "income",
        parentCat: "💰 工作收入",
        subCat: "家教收入",
        amount: Number(total),
        notes: `家教收入: ${student} (${hours}hr)`
      });
    }
  } else {
    const billingId = "bill_" + Date.now();
    state.billings.unshift({ id: billingId, date, student, hours, rate, total, status, notes });

    state.finances.unshift({
      id: "fin_sync_" + billingId,
      date,
      type: "income",
      parentCat: "💰 工作收入",
      subCat: "家教收入",
      amount: Number(total),
      notes: `家教收入: ${student} (${hours}hr)`
    });
  }

  saveToStorage();
  renderBillings();
  renderFinances();
  closeModal("billing-modal");
}

function toggleBillStatus(idx) {
  triggerHaptic(15);
  state.billings[idx].status = state.billings[idx].status === "paid" ? "unpaid" : "paid";
  saveToStorage();
  renderBillings();
}

function deleteBilling(idx) {
  if (confirm("確定要刪除這筆家教帳務記錄嗎？")) {
    triggerHaptic(25);
    const target = state.billings[idx];
    if (target && target.id) {
      state.finances = (state.finances || []).filter((f) => f.id !== "fin_sync_" + target.id);
    }
    state.billings.splice(idx, 1);
    saveToStorage();
    renderBillings();
    renderFinances();
  }
}

// ------------------------------------------
// 工作帳務操作
// ------------------------------------------
function openWorkBillingModal(editIndex = null) {
  currentEditingWorkBillingIndex = editIndex;
  const modalTitle = document.getElementById("wbill-modal-title");
  const sel = document.getElementById("wbill-name-select");
  sel.innerHTML = '<option value="">-- 現有工作 --</option>';
  const added = new Set();
  (state.schedules || []).forEach((sch) => {
    (sch.works || []).forEach((w) => {
      if (!added.has(w.name)) {
        added.add(w.name);
        const opt = document.createElement("option");
        opt.value = w.name;
        opt.innerText = w.name;
        sel.appendChild(opt);
      }
    });
  });

  if (editIndex !== null && state.workBillings && state.workBillings[editIndex]) {
    const item = state.workBillings[editIndex];
    if (modalTitle) modalTitle.innerText = "編輯工作帳務記錄";
    document.getElementById("wbill-date").value = item.date || "";
    document.getElementById("wbill-name").value = item.name || "";
    document.getElementById("wbill-hours").value = item.hours || "";
    document.getElementById("wbill-rate").value = item.rate || "";
    document.getElementById("wbill-total").value = item.total || "";
    document.getElementById("wbill-status").value = item.status || "unpaid";
    document.getElementById("wbill-notes").value = item.notes || "";
  } else {
    if (modalTitle) modalTitle.innerText = "新增工作帳務記錄";
    const todayStr = formatDate(new Date());
    document.getElementById("wbill-date").value = todayStr;
    document.getElementById("wbill-name").value = "";
    document.getElementById("wbill-hours").value = "4";
    document.getElementById("wbill-status").value = "unpaid";
    document.getElementById("wbill-notes").value = "";
    updateWorkBillingRateByDateAndName();
  }

  document.getElementById("work-billing-modal").classList.add("active");
}

function onSelectBillingWork() {
  const w = document.getElementById("wbill-name-select").value;
  if (w) {
    document.getElementById("wbill-name").value = w;
    updateWorkBillingRateByDateAndName();
  }
}

function onWorkBillingDateOrNameChange() {
  updateWorkBillingRateByDateAndName();
}

function updateWorkBillingRateByDateAndName() {
  if (currentEditingWorkBillingIndex !== null) return;
  const dateStr = document.getElementById("wbill-date").value;
  const workName = document.getElementById("wbill-name").value.trim();

  if (!dateStr || !workName) {
    if (!document.getElementById("wbill-rate").value) {
      document.getElementById("wbill-rate").value = "";
      calcWorkBillAmount();
    }
    return;
  }

  let matchedWorks = [];
  (state.schedules || []).forEach((sch) => {
    const matches = (sch.works || []).filter((w) => w.name === workName);
    matchedWorks = matchedWorks.concat(matches);
  });

  if (matchedWorks.length > 0 && matchedWorks[0].rate) {
    document.getElementById("wbill-rate").value = matchedWorks[0].rate;
  } else {
    if (!document.getElementById("wbill-rate").value) {
      document.getElementById("wbill-rate").value = "";
    }
  }
  calcWorkBillAmount();
}

function calcWorkBillAmount() {
  const h = Number(document.getElementById("wbill-hours").value) || 0;
  const r = Number(document.getElementById("wbill-rate").value) || 0;
  document.getElementById("wbill-total").value = Math.round(h * r);
}

function saveWorkBillingRecord() {
  triggerHaptic(20);
  const date = document.getElementById("wbill-date").value;
  const name = document.getElementById("wbill-name").value.trim();
  const hours = document.getElementById("wbill-hours").value;
  const rate = document.getElementById("wbill-rate").value;
  const total = document.getElementById("wbill-total").value;
  const status = document.getElementById("wbill-status").value;
  const notes = document.getElementById("wbill-notes").value.trim();

  if (!date || !name || !hours || !rate) {
    alert("請填寫完整工作帳務資訊！");
    return;
  }
  if (!state.workBillings) state.workBillings = [];
  if (!state.finances) state.finances = [];

  if (currentEditingWorkBillingIndex !== null) {
    const oldItem = state.workBillings[currentEditingWorkBillingIndex];
    const billingId = oldItem.id || "wbill_" + Date.now();
    state.workBillings[currentEditingWorkBillingIndex] = { id: billingId, date, name, hours, rate, total, status, notes };

    const finIdx = state.finances.findIndex((f) => f.id === "fin_sync_" + billingId);
    if (finIdx > -1) {
      state.finances[finIdx] = {
        ...state.finances[finIdx],
        date,
        amount: Number(total),
        notes: `工作收入: ${name} (${hours}hr)`
      };
    } else {
      state.finances.unshift({
        id: "fin_sync_" + billingId,
        date,
        type: "income",
        parentCat: "💰 工作收入",
        subCat: "兼職外快",
        amount: Number(total),
        notes: `工作收入: ${name} (${hours}hr)`
      });
    }
  } else {
    const billingId = "wbill_" + Date.now();
    state.workBillings.unshift({ id: billingId, date, name, hours, rate, total, status, notes });

    state.finances.unshift({
      id: "fin_sync_" + billingId,
      date,
      type: "income",
      parentCat: "💰 工作收入",
      subCat: "兼職外快",
      amount: Number(total),
      notes: `工作收入: ${name} (${hours}hr)`
    });
  }

  saveToStorage();
  renderBillings();
  renderFinances();
  closeModal("work-billing-modal");
}

function toggleWorkBillStatus(idx) {
  triggerHaptic(15);
  state.workBillings[idx].status = state.workBillings[idx].status === "paid" ? "unpaid" : "paid";
  saveToStorage();
  renderBillings();
}

function deleteWorkBilling(idx) {
  if (confirm("確定要刪除這筆工作帳務記錄嗎？")) {
    triggerHaptic(25);
    const target = state.workBillings[idx];
    if (target && target.id) {
      state.finances = (state.finances || []).filter((f) => f.id !== "fin_sync_" + target.id);
    }
    state.workBillings.splice(idx, 1);
    saveToStorage();
    renderBillings();
    renderFinances();
  }
}

// ==========================================
// 個人記帳與類別管理邏輯
// ==========================================
function setFinanceMonthCurrent() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  document.getElementById("fin-month-filter").value = `${year}-${month}`;
  renderFinances();
}

function setFinanceMonthAll() {
  document.getElementById("fin-month-filter").value = "";
  renderFinances();
}

function setFinanceAllMode(mode) {
  triggerHaptic(15);
  financeActiveMode = mode;
  financeActiveMainCat = "all";
  financeActiveSubCat = "all";
  renderFinances();
}

function selectFinanceMainCategory(mainCat) {
  triggerHaptic(15);
  financeActiveMode = "main";
  financeActiveMainCat = mainCat;
  financeActiveSubCat = "all";
  renderFinances();
}

function selectFinanceSubCategory(subCat) {
  triggerHaptic(15);
  financeActiveMode = "sub";
  financeActiveSubCat = subCat;
  renderFinances();
}

function toggleShowHiddenItems() {
  triggerHaptic(20);
  state.showHiddenItems = !state.showHiddenItems;
  const btn = document.getElementById("btn-toggle-hidden");
  if (state.showHiddenItems) {
    btn.style.borderColor = "var(--primary)";
    btn.style.color = "var(--primary)";
    btn.innerText = "👁️ 隱藏項目顯示中";
  } else {
    btn.style.borderColor = "var(--border)";
    btn.style.color = "var(--text)";
    btn.innerText = "👁️ 顯示隱藏";
  }
  saveToStorage();
  renderFinances();
}

function toggleRecordHidden(id) {
  triggerHaptic(15);
  const item = (state.finances || []).find((f) => f.id === id);
  if (!item) return;
  item.isHidden = !item.isHidden;
  saveToStorage();
  renderFinances();
}

function onFinanceTypeChange() {
  const type = document.getElementById("fin-type").value;
  const parentSelect = document.getElementById("fin-parent-cat");
  if (!parentSelect) return;
  parentSelect.innerHTML = "";

  const cats = getCategories();
  const parents = Object.keys(cats[type] || {});
  parents.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    parentSelect.appendChild(opt);
  });
  onFinanceParentCatChange();
}

function onFinanceParentCatChange() {
  const type = document.getElementById("fin-type").value;
  const parentCat = document.getElementById("fin-parent-cat").value;
  const subSelect = document.getElementById("fin-sub-cat");
  if (!subSelect) return;
  subSelect.innerHTML = "";

  const cats = getCategories();
  const subs = (cats[type] && cats[type][parentCat]) || [];
  subs.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.innerText = s;
    subSelect.appendChild(opt);
  });
}

function openFinanceModal(editId = null) {
  document.getElementById("fin-edit-id").value = editId || "";
  if (editId) {
    const item = (state.finances || []).find((f) => f.id === editId);
    if (!item) return;
    document.getElementById("fin-modal-title").innerText = "編輯收支記錄";
    document.getElementById("fin-date").value = item.date;
    document.getElementById("fin-type").value = item.type;
    onFinanceTypeChange();
    document.getElementById("fin-parent-cat").value = item.parentCat;
    onFinanceParentCatChange();
    document.getElementById("fin-sub-cat").value = item.subCat;
    document.getElementById("fin-amount").value = item.amount;
    document.getElementById("fin-notes").value = item.notes || "";
  } else {
    document.getElementById("fin-modal-title").innerText = "新增收支記錄";
    document.getElementById("fin-date").value = formatDate(new Date());
    document.getElementById("fin-type").value = "expense";
    onFinanceTypeChange();
    document.getElementById("fin-amount").value = "";
    document.getElementById("fin-notes").value = "";
  }
  document.getElementById("finance-modal").classList.add("active");
}

function saveFinanceRecord() {
  triggerHaptic(20);
  const editId = document.getElementById("fin-edit-id").value;
  const date = document.getElementById("fin-date").value;
  const type = document.getElementById("fin-type").value;
  const parentCat = document.getElementById("fin-parent-cat").value;
  const subCat = document.getElementById("fin-sub-cat").value;
  const amount = Number(document.getElementById("fin-amount").value);
  const notes = document.getElementById("fin-notes").value.trim();

  if (!date || !amount || amount <= 0) {
    alert("請填寫正確的日期與金額！");
    return;
  }

  if (!state.finances) state.finances = [];

  if (editId) {
    const idx = state.finances.findIndex((f) => f.id === editId);
    if (idx > -1) {
      state.finances[idx] = { ...state.finances[idx], date, type, parentCat, subCat, amount, notes };
    }
  } else {
    state.finances.unshift({
      id: "fin_" + Date.now(),
      date,
      type,
      parentCat,
      subCat,
      amount,
      notes,
      remaining: type === "receivable" || type === "payable" ? amount : undefined,
      isHidden: false
    });
  }

  saveToStorage();
  renderFinances();
  closeModal("finance-modal");
}

function openRepayModal(id) {
  const item = (state.finances || []).find((f) => f.id === id);
  if (!item) return;

  document.getElementById("repay-id").value = id;
  const maxRem = item.remaining !== undefined ? item.remaining : item.amount;
  document.getElementById("repay-info").value = `[${item.subCat}] ${item.notes || ""} (未結清: $${maxRem.toLocaleString()})`;
  document.getElementById("repay-date").value = formatDate(new Date());
  document.getElementById("repay-amount").value = maxRem;
  document.getElementById("repay-notes").value = "";

  document.getElementById("repay-modal").classList.add("active");
}

function confirmRepay() {
  triggerHaptic(20);
  const id = document.getElementById("repay-id").value;
  const date = document.getElementById("repay-date").value;
  const repayAmt = Number(document.getElementById("repay-amount").value);
  const notes = document.getElementById("repay-notes").value.trim();

  if (!date || !repayAmt || repayAmt <= 0) {
    alert("請填寫正確的還款日期與金額！");
    return;
  }

  const item = (state.finances || []).find((f) => f.id === id);
  if (!item) return;

  let currentRem = item.remaining !== undefined ? item.remaining : item.amount;
  if (repayAmt > currentRem) {
    alert("還款金額不可大於未結清金額！");
    return;
  }

  item.remaining = currentRem - repayAmt;

  const syncType = item.type === "receivable" ? "income" : "expense";
  state.finances.unshift({
    id: "fin_repay_" + Date.now(),
    date,
    type: syncType,
    parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他",
    subCat: "還款",
    amount: repayAmt,
    notes: notes,
    isHidden: false
  });

  saveToStorage();
  renderFinances();
  closeModal("repay-modal");
  alert("還款成功！");
}

function deleteFinanceRecord(id) {
  if (confirm("確定要刪除這筆記帳記錄嗎？")) {
    triggerHaptic(25);
    const target = (state.finances || []).find((f) => f.id === id);
    if (target && target.subCat === "還款") {
      const refundAmt = Number(target.amount || 0);
      const matchTarget = (state.finances || []).find(
        (f) => (f.type === "receivable" || f.type === "payable") && f.remaining !== undefined
      );
      if (matchTarget) {
        matchTarget.remaining = Number(matchTarget.remaining || 0) + refundAmt;
      }
    }
    state.finances = (state.finances || []).filter((f) => f.id !== id);
    saveToStorage();
    renderFinances();
  }
}

function openCategoryManageModal() {
  document.getElementById("cat-manage-type").value = "expense";
  renderCategoryManageList();
  document.getElementById("category-manage-modal").classList.add("active");
}

function resetCategoriesToDefault() {
  if (confirm("確定要將所有收支類別恢復為預設狀態嗎？")) {
    triggerHaptic(25);
    state.customCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    saveToStorage();
    renderCategoryManageList();
    renderFinances();
    alert("已成功恢復預設類別！");
  }
}

function renderCategoryManageList() {
  const type = document.getElementById("cat-manage-type").value;
  const listEl = document.getElementById("cat-manage-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const cats = getCategories();
  const pObj = cats[type] || {};
  const pKeys = Object.keys(pObj);

  pKeys.forEach((pCat, pIdx) => {
    const pHeader = document.createElement("div");
    pHeader.style =
      "font-weight:700; font-size:0.80rem; padding:6px 6px; background:var(--table-th-bg); margin-top:4px; display:flex; justify-content:space-between; align-items:center;";
    pHeader.innerHTML = `
      <span>${pCat}</span>
      <div style="display:flex; gap:3px;">
        <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${type}', ${pIdx}, -1)">▲主</button>
        <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${type}', ${pIdx}, 1)">▼主</button>
      </div>
    `;
    listEl.appendChild(pHeader);

    const subList = pObj[pCat];
    subList.forEach((subCat, sIdx) => {
      const item = document.createElement("div");
      item.className = "cat-manage-item";
      item.innerHTML = `
        <span>└ ${escapeHtml(subCat)}</span>
        <div class="cat-manage-actions">
          <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${type}', '${pCat}', ${sIdx}, -1)">▲</button>
          <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${type}', '${pCat}', ${sIdx}, 1)">▼</button>
          <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMoveModal('${type}', '${pCat}', ${sIdx})">搬移</button>
          <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMergeModal('${type}', '${pCat}', ${sIdx})">合併</button>
          <button class="btn btn-danger" style="padding:1px 4px; font-size:0.62rem;" onclick="catDelete('${type}', '${pCat}', ${sIdx})">刪除</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  });
}

function catMoveMain(type, pIdx, direction) {
  triggerHaptic(15);
  const cats = getCategories();
  const keys = Object.keys(cats[type]);
  const targetIdx = pIdx + direction;
  if (targetIdx < 0 || targetIdx >= keys.length) return;

  const newPObj = {};
  const movedKey = keys[pIdx];
  keys.splice(pIdx, 1);
  keys.splice(targetIdx, 0, movedKey);

  keys.forEach((k) => {
    newPObj[k] = cats[type][k];
  });
  cats[type] = newPObj;

  saveToStorage();
  renderCategoryManageList();
  renderFinances();
}

function catMoveSub(type, pCat, sIdx, direction) {
  triggerHaptic(15);
  const cats = getCategories();
  const list = cats[type][pCat];
  const targetIdx = sIdx + direction;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[sIdx];
  list[sIdx] = list[targetIdx];
  list[targetIdx] = temp;

  saveToStorage();
  renderCategoryManageList();
  renderFinances();
}

function openAddMainCategoryModal() {
  document.getElementById("cat-add-main-name").value = "";
  document.getElementById("cat-add-main-modal").classList.add("active");
}

function confirmAddMainCategory() {
  const type = document.getElementById("cat-manage-type").value;
  const icon = document.getElementById("cat-add-main-icon").value;
  const rawName = document.getElementById("cat-add-main-name").value.trim();

  if (!rawName) {
    alert("請輸入主類別名稱！");
    return;
  }

  const newName = `${icon} ${rawName}`;
  const cats = getCategories();

  if (cats[type][newName]) {
    alert("此主類別名稱已存在！");
    return;
  }

  triggerHaptic(20);
  cats[type][newName] = ["一般項目"];
  saveToStorage();
  renderCategoryManageList();
  renderFinances();
  closeModal("cat-add-main-modal");
}

function openAddSubCategoryModal() {
  const type = document.getElementById("cat-manage-type").value;
  const cats = getCategories();
  const parents = Object.keys(cats[type] || {});
  if (parents.length === 0) {
    alert("目前沒有主類別可供選擇！");
    return;
  }

  const parentSelect = document.getElementById("cat-add-sub-parent");
  parentSelect.innerHTML = "";
  parents.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    parentSelect.appendChild(opt);
  });

  document.getElementById("cat-add-sub-name").value = "";
  document.getElementById("cat-add-sub-modal").classList.add("active");
}

function confirmAddSubCategory() {
  const type = document.getElementById("cat-manage-type").value;
  const parentCat = document.getElementById("cat-add-sub-parent").value;
  const subName = document.getElementById("cat-add-sub-name").value.trim();

  if (!subName) {
    alert("請輸入子類別名稱！");
    return;
  }

  const cats = getCategories();
  if (!cats[type][parentCat]) return;
  if (cats[type][parentCat].includes(subName)) {
    alert("此子類別在此主類別下已存在！");
    return;
  }

  triggerHaptic(20);
  cats[type][parentCat].push(subName);
  saveToStorage();
  renderCategoryManageList();
  renderFinances();
  closeModal("cat-add-sub-modal");
}

function openCatMoveModal(type, pCat, sIdx) {
  const cats = getCategories();
  const subCat = cats[type][pCat][sIdx];
  activeCatTask = { type, pCat, sIdx, subCat };

  const selectEl = document.getElementById("cat-move-select");
  selectEl.innerHTML = "";
  Object.keys(cats[type]).forEach((p) => {
    if (p !== pCat) {
      const opt = document.createElement("option");
      opt.value = p;
      opt.innerText = p;
      selectEl.appendChild(opt);
    }
  });

  if (selectEl.options.length === 0) {
    alert("沒有其他主類別可以搬移！");
    return;
  }

  document.getElementById("cat-move-modal").classList.add("active");
}

function confirmCatMove() {
  const targetParent = document.getElementById("cat-move-select").value;
  if (!targetParent) return;

  const { type, pCat, sIdx, subCat } = activeCatTask;
  const cats = getCategories();

  triggerHaptic(20);
  cats[type][pCat].splice(sIdx, 1);
  cats[type][targetParent].push(subCat);

  saveToStorage();
  renderCategoryManageList();
  renderFinances();
  closeModal("cat-move-modal");
}

function openCatMergeModal(type, pCat, sIdx) {
  const cats = getCategories();
  const sourceSub = cats[type][pCat][sIdx];
  activeCatTask = { type, pCat, sIdx, sourceSub };

  const availableSubs = cats[type][pCat].filter((_, idx) => idx !== sIdx);
  if (availableSubs.length === 0) {
    alert("此主類別下沒有其他子類別可以合併！");
    return;
  }

  const selectEl = document.getElementById("cat-merge-select");
  selectEl.innerHTML = "";
  availableSubs.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.innerText = s;
    selectEl.appendChild(opt);
  });

  document.getElementById("cat-merge-modal").classList.add("active");
}

function confirmCatMerge() {
  const targetSub = document.getElementById("cat-merge-select").value;
  if (!targetSub) return;

  const { type, pCat, sIdx, sourceSub } = activeCatTask;
  const cats = getCategories();

  triggerHaptic(20);
  (state.finances || []).forEach((f) => {
    if (f.parentCat === pCat && f.subCat === sourceSub) {
      f.subCat = targetSub;
    }
  });

  cats[type][pCat].splice(sIdx, 1);

  saveToStorage();
  renderCategoryManageList();
  renderFinances();
  closeModal("cat-merge-modal");
}

function catDelete(type, pCat, sIdx) {
  const cats = getCategories();
  const subCat = cats[type][pCat][sIdx];

  if (confirm(`確定要刪除「${subCat}」嗎？若先前用過此類別，相關記錄將會遺失，建議改用「合併」功能！`)) {
    triggerHaptic(25);
    cats[type][pCat].splice(sIdx, 1);
    saveToStorage();
    renderCategoryManageList();
    renderFinances();
  }
}

function renderFinances() {
  const tbody = document.getElementById("finance-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const selectedMonth = document.getElementById("fin-month-filter").value;
  const sortOrder = document.getElementById("fin-sort-order")?.value || "desc";

  let totalExpense = 0;
  let totalIncome = 0;
  let totalReceivable = 0;
  let totalPayable = 0;

  (state.finances || []).forEach((item) => {
    const amt = Number(item.amount || 0);
    const rem = item.remaining !== undefined ? item.remaining : amt;
    const itemMonth = (item.date || '').slice(0, 7);

    if (item.type === "receivable") {
      if (rem > 0 || !selectedMonth || itemMonth === selectedMonth) {
        totalReceivable += rem;
      }
    }
    if (item.type === "payable") {
      if (rem > 0 || !selectedMonth || itemMonth === selectedMonth) {
        totalPayable += rem;
      }
    }

    if (item.isHidden && !state.showHiddenItems) return;

    if (selectedMonth && itemMonth !== selectedMonth) return;
    if (item.type === "expense") totalExpense += amt;
    if (item.type === "income") totalIncome += amt;
  });

  const chipsContainer = document.getElementById("finance-filter-chips");
  if (chipsContainer) {
    chipsContainer.innerHTML = "";

    const allChip = document.createElement("div");
    allChip.className = `finance-chip ${financeActiveMode === "all" && financeActiveMainCat === "all" ? "active" : ""}`;
    allChip.innerText = "全部類型";
    allChip.onclick = () => setFinanceAllMode("all");
    chipsContainer.appendChild(allChip);

    const cats = getCategories();
    if (
      financeActiveMode === "all" ||
      financeActiveMode === "all_expense" ||
      financeActiveMode === "all_income" ||
      financeActiveMode === "all_receivable" ||
      financeActiveMode === "all_payable"
    ) {
      Object.keys(cats).forEach((tKey) => {
        const pObj = cats[tKey];
        Object.keys(pObj).forEach((pCat) => {
          const chip = document.createElement("div");
          chip.className = `finance-chip`;
          chip.innerText = pCat;
          chip.onclick = () => selectFinanceMainCategory(pCat);
          chipsContainer.appendChild(chip);
        });
      });
    } else if (financeActiveMode === "main" || financeActiveMode === "sub") {
      const backChip = document.createElement("div");
      backChip.className = `finance-chip`;
      backChip.style.background = "var(--primary)";
      backChip.style.color = "#ffffff";
      backChip.innerText = "◀ 返回主類別";
      backChip.onclick = () => setFinanceAllMode("all");
      chipsContainer.appendChild(backChip);

      let targetSubList = [];
      Object.keys(cats).forEach((tKey) => {
        if (cats[tKey][financeActiveMainCat]) {
          targetSubList = cats[tKey][financeActiveMainCat];
        }
      });

      const allSubChip = document.createElement("div");
      allSubChip.className = `finance-chip ${financeActiveSubCat === "all" ? "active" : ""}`;
      allSubChip.innerText = `全部 (${financeActiveMainCat})`;
      allSubChip.onclick = () => {
        financeActiveSubCat = "all";
        renderFinances();
      };
      chipsContainer.appendChild(allSubChip);

      targetSubList.forEach((subCat) => {
        const chip = document.createElement("div");
        chip.className = `finance-chip ${financeActiveSubCat === subCat ? "active" : ""}`;
        chip.innerText = subCat;
        chip.onclick = () => selectFinanceSubCategory(subCat);
        chipsContainer.appendChild(chip);
      });
    }
  }

  let filteredFinances = [];
  const typeLabels = {
    expense: { name: "支出", cls: "tag-expense" },
    income: { name: "收入", cls: "tag-income" },
    transfer: { name: "轉帳", cls: "tag-paid" },
    receivable: { name: "應收", cls: "tag-receivable" },
    payable: { name: "應付", cls: "tag-payable" }
  };

  (state.finances || []).forEach((item) => {
    const itemMonth = (item.date || '').slice(0, 7);
    const rem = item.remaining !== undefined ? item.remaining : Number(item.amount || 0);

    if (item.isHidden && !state.showHiddenItems) return;

    const isReceivableOrPayable = item.type === "receivable" || item.type === "payable";
    if (isReceivableOrPayable) {
      if (rem === 0 && selectedMonth && itemMonth !== selectedMonth) return;
    } else {
      if (selectedMonth && itemMonth !== selectedMonth) return;
    }

    if (financeActiveMode === "all_expense" && item.type !== "expense") return;
    if (financeActiveMode === "all_income" && item.type !== "income") return;
    if (financeActiveMode === "all_receivable" && item.type !== "receivable") return;
    if (financeActiveMode === "all_payable" && item.type !== "payable") return;
    if (financeActiveMode === "main") {
      if (item.parentCat !== financeActiveMainCat) return;
      if (financeActiveSubCat !== "all" && item.subCat !== financeActiveSubCat) return;
    }
    if (financeActiveMode === "sub") {
      if (item.subCat !== financeActiveSubCat) return;
    }

    filteredFinances.push(item);
  });

  filteredFinances.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return sortOrder === "asc" ? cmp : -cmp;
  });

  let renderedCount = 0;
  filteredFinances.forEach((item) => {
    renderedCount++;
    const amt = Number(item.amount || 0);
    const rem = item.remaining !== undefined ? item.remaining : amt;
    const tInfo = typeLabels[item.type] || { name: item.type, cls: "tag-paid" };

    let extraActionHtml = "";
    if ((item.type === "receivable" || item.type === "payable") && rem > 0) {
      extraActionHtml += `<button class="btn btn-warning" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openRepayModal('${item.id}')">還款</button>`;
    }
    const hideBtnText = item.isHidden ? "解除隱藏" : "隱藏";
    const hideBtnColor = item.isHidden ? "btn-secondary" : "btn-warning";
    extraActionHtml += `<button class="btn ${hideBtnColor}" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="toggleRecordHidden('${item.id}')">${hideBtnText}</button>`;
    extraActionHtml += `<button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openFinanceModal('${item.id}')">編輯</button>`;
    extraActionHtml += `<button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="deleteFinanceRecord('${item.id}')">刪除</button>`;

    let amountDisplay = `$${amt.toLocaleString()}`;
    if (item.type === "income" || item.type === "receivable") amountDisplay = "+" + amountDisplay;
    if (item.type === "expense" || item.type === "payable") amountDisplay = "-" + amountDisplay;

    if ((item.type === "receivable" || item.type === "payable") && rem > 0) {
      amountDisplay += ` (未結: $${rem.toLocaleString()})`;
    }

    const hiddenTag = item.isHidden ? `<span class="tag-hidden">已隱藏</span>` : "";
    const rowOpacity = item.isHidden ? `opacity: 0.55;` : "";

    const tr = document.createElement("tr");
    tr.style = rowOpacity;
    tr.innerHTML = `
      <td>${item.date}</td>
      <td><span class="${tInfo.cls}">${tInfo.name}</span></td>
      <td><strong>${escapeHtml(item.parentCat)}</strong> <span style="color:var(--text-muted);">/ ${escapeHtml(item.subCat)}</span> ${hiddenTag}</td>
      <td><strong style="color:${item.type === "income" || item.type === "receivable" ? "#10b981" : "#ef4444"};">${amountDisplay}</strong></td>
      <td>${escapeHtml(item.notes || "-")}</td>
      <td>${extraActionHtml}</td>
    `;
    tbody.appendChild(tr);
  });

  if (renderedCount === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:12px;">沒有符合條件的記帳紀錄</td>`;
    tbody.appendChild(tr);
  }

  const balance = totalIncome - totalExpense;
  document.getElementById("fin-stat-expense").innerText = `$${totalExpense.toLocaleString()}`;
  document.getElementById("fin-stat-income").innerText = `$${totalIncome.toLocaleString()}`;
  document.getElementById("fin-stat-receivable").innerText = `$${totalReceivable.toLocaleString()}`;
  document.getElementById("fin-stat-payable").innerText = `$${totalPayable.toLocaleString()}`;

  const balEl = document.getElementById("fin-stat-balance");
  balEl.innerText = `$${balance.toLocaleString()}`;
  balEl.style.color = balance >= 0 ? "#10b981" : "#ef4444";
}

// ==========================================
// 調課邏輯與支援編輯 (學校、家教與工作)
// ==========================================
function openOverrideModal(ovrId = null) {
  currentEditingOverrideId = ovrId;
  const sch = getActiveSchedule();
  const select = document.getElementById("ovr-source-select");
  const modalTitle = document.getElementById("override-modal-title");
  const saveBtn = document.getElementById("ovr-save-btn");
  const delBtn = document.getElementById("ovr-delete-btn");

  select.innerHTML = '<option value="">-- 選擇欲調動的課程或工作 --</option>';
  const monday = getMondayOfWeek(new Date(), currentWeekOffset);
  const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];

  (sch.tutorings || []).forEach((t) => {
    const dNum = Number(t.day);
    const curD = new Date(monday);
    curD.setDate(monday.getDate() + (dNum - 1));
    const dateStr = formatDate(curD);
    const opt = document.createElement("option");
    opt.value = JSON.stringify({
      type: "tutoring",
      sourceId: t.id,
      sourceDate: dateStr,
      title: t.student,
      startTime: t.startTime,
      endTime: t.endTime,
      desc: `【家教】${t.student} (${dayNames[dNum]} ${t.startTime}~${t.endTime})`
    });
    opt.innerText = `【家教】${t.student} (${dayNames[dNum]} - ${dateStr})`;
    select.appendChild(opt);
  });

  (sch.works || []).forEach((w) => {
    const dNum = Number(w.day);
    const curD = new Date(monday);
    curD.setDate(monday.getDate() + (dNum - 1));
    const dateStr = formatDate(curD);
    const opt = document.createElement("option");
    opt.value = JSON.stringify({
      type: "work",
      sourceId: w.id,
      sourceDate: dateStr,
      title: w.name,
      startTime: w.startTime,
      endTime: w.endTime,
      desc: `【工作】${w.name} (${dayNames[dNum]} ${w.startTime}~${w.endTime})`
    });
    opt.innerText = `【工作】${w.name} (${dayNames[dNum]} - ${dateStr})`;
    select.appendChild(opt);
  });

  if (sch.courses) {
    Object.keys(sch.courses).forEach((k) => {
      const c = sch.courses[k];
      if (c && c.name) {
        const [dStr, pStr] = k.split("_");
        const dNum = Number(dStr);
        const curD = new Date(monday);
        curD.setDate(monday.getDate() + (dNum - 1));
        const dateStr = formatDate(curD);
        const opt = document.createElement("option");
        opt.value = JSON.stringify({
          type: "school",
          sourceKey: k,
          sourceDate: dateStr,
          title: c.name,
          startTime: "08:10",
          endTime: "09:00",
          desc: `【學校】${c.name} (${dayNames[dNum]} 第 ${pStr} 節)`
        });
        opt.innerText = `【學校】${c.name} (${dayNames[dNum]} 第 ${pStr} 節)`;
        select.appendChild(opt);
      }
    });
  }

  if (ovrId) {
    const ovr = (sch.overrides || []).find((o) => o.id === ovrId);
    if (!ovr) return;
    if (modalTitle) modalTitle.innerText = "編輯調課記錄";
    if (saveBtn) saveBtn.innerText = "儲存修改";
    if (delBtn) delBtn.style.display = "inline-flex";

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      if (!opt.value) continue;
      try {
        const d = JSON.parse(opt.value);
        if ((ovr.sourceId && d.sourceId === ovr.sourceId) || (ovr.sourceKey && d.sourceKey === ovr.sourceKey)) {
          select.selectedIndex = i;
          document.getElementById("ovr-source-desc").value = d.desc;
          break;
        }
      } catch (e) {}
    }

    document.getElementById("ovr-target-date").value = ovr.targetDate;
    document.getElementById("ovr-start-time").value = ovr.startTime;
    document.getElementById("ovr-end-time").value = ovr.endTime;
    document.getElementById("ovr-memo").value = ovr.memo || "";
  } else {
    if (modalTitle) modalTitle.innerText = "臨時調課設定與管理";
    if (saveBtn) saveBtn.innerText = "建立調課";
    if (delBtn) delBtn.style.display = "none";

    document.getElementById("ovr-source-desc").value = "";
    document.getElementById("ovr-target-date").value = formatDate(new Date());
    document.getElementById("ovr-start-time").value = "18:00";
    document.getElementById("ovr-end-time").value = "20:00";
    document.getElementById("ovr-memo").value = "";
  }

  document.getElementById("override-modal").classList.add("active");
}

function populateOverrideOriginal() {
  const val = document.getElementById("ovr-source-select").value;
  if (!val) {
    document.getElementById("ovr-source-desc").value = "";
    return;
  }
  try {
    const data = JSON.parse(val);
    document.getElementById("ovr-source-desc").value = data.desc;
    document.getElementById("ovr-start-time").value = data.startTime;
    document.getElementById("ovr-end-time").value = data.endTime;
  } catch (e) {}
}

function saveClassOverride() {
  triggerHaptic(20);
  const val = document.getElementById("ovr-source-select").value;
  if (!val) {
    alert("請選擇欲調課課程或工作！");
    return;
  }
  const data = JSON.parse(val);
  const targetDate = document.getElementById("ovr-target-date").value;
  const startTime = document.getElementById("ovr-start-time").value;
  const endTime = document.getElementById("ovr-end-time").value;
  const memo = document.getElementById("ovr-memo").value.trim();

  if (!targetDate || !startTime || !endTime) {
    alert("請完整填寫調課資訊！");
    return;
  }
  const sch = getActiveSchedule();
  if (!sch.overrides) sch.overrides = [];

  if (currentEditingOverrideId) {
    const idx = sch.overrides.findIndex((o) => o.id === currentEditingOverrideId);
    if (idx > -1) {
      sch.overrides[idx] = {
        ...sch.overrides[idx],
        type: data.type,
        sourceId: data.sourceId || null,
        sourceKey: data.sourceKey || null,
        sourceDate: data.sourceDate,
        title: data.title,
        targetDate,
        startTime,
        endTime,
        memo
      };
    }
  } else {
    sch.overrides.push({
      id: "ovr_" + Date.now(),
      type: data.type,
      sourceId: data.sourceId || null,
      sourceKey: data.sourceKey || null,
      sourceDate: data.sourceDate,
      title: data.title,
      targetDate,
      startTime,
      endTime,
      memo
    });
  }

  saveToStorage();
  renderSchedule();
  closeModal("override-modal");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

init();