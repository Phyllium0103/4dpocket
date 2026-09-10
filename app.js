// ========================================================
// Supabase 設定、全域狀態與共用函數
// ========================================================
const SUPABASE_URL = "https://hqjqnbzzrduhdiwaxoxp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-xqiL_LXkK2pWt5UopJ5Nw__OxyEmOH";
let supabaseClient = null;

let currentUser = null;
let myProfile = null;
let friendsList = [];
let connectionsList = [];
let userMessages = [];

let isViewingFriend = false;
let friendState = null;
let viewingFriendId = null;
let showIntersection = false;
let currentReadingNoteId = null;
let isSaving = false;

// 狀態管理相關
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
let currentSelectedStudentFilter = "__FILTER_ALL__";
let currentBillingType = "tutoring";
let financeActiveMode = "all";
let financeActiveMainCat = "all";
let financeActiveSubCat = "all";
let isExpenseChartVisible = false;
let activeCatTask = { type: "", pCat: "", sIdx: "" };
let tempDeadlines = [];
let currentEditingDeadlineIdx = null;

// 初始化 Supabase
if (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 5) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase SDK 未載入或設定不正確。");
}

// 離開網頁前的防呆機制
window.addEventListener('beforeunload', (e) => {
    if (isSaving) {
        e.preventDefault();
        e.returnValue = '資料正在儲存中，確定要離開嗎？';
    }
});

// 全域提示 Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('global-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function triggerHaptic(duration = 20) {
    if (navigator.vibrate) navigator.vibrate(duration);
}

// ========================================================
// 預設資料與主題配置
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

const CELL_HEIGHT = 57;

function createDefaultState() {
    const dId = "sch_" + Date.now();
    return {
        themeMode: "light",
        themeStyle: "light-swiss-blue",
        lastLightStyle: "light-swiss-blue",
        lastDarkStyle: "dark-tokyo-night",
        isEditMode: false,
        showLatePeriods: false,
        showTutoring: false,
        showDeadlines: true,
        textAlign: "center",
        is24HourMode: false,
        billings: [],
        workBillings: [],
        finances: [],
        recurringFinances: [],
        customCategories: null,
        categoryOrder: null,
        showHiddenItems: false,
        activeScheduleId: dId,
        schedules: [{
            id: dId,
            title: "115學年度上學期課表",
            startDate: "2026-09-07",
            endDate: "2027-01-10",
            periods: structuredClone(initialDefaultPeriods),
            courses: {},
            tutorings: [],
            works: [],
            overrides: [],
            temporaryEvents: [],
            weeklyMemos: {}
        }]
    };
}

let state = createDefaultState();

// ========================================================
// 工具與資料函數
// ========================================================
function getTargetSchedule() {
    let targetState = (isViewingFriend && friendState) ? friendState : state;
    if (!targetState.schedules || targetState.schedules.length === 0) {
        return state.schedules[0];
    }
    let sch = targetState.schedules.find((s) => s.id === targetState.activeScheduleId) || targetState.schedules[0];
    sch.courses = sch.courses || {};
    sch.tutorings = sch.tutorings || [];
    sch.works = sch.works || [];
    sch.overrides = sch.overrides || [];
    sch.temporaryEvents = sch.temporaryEvents || [];
    sch.weeklyMemos = sch.weeklyMemos || {};
    sch.periods = sch.periods || structuredClone(initialDefaultPeriods);
    return sch;
}

function getActiveSchedule() {
    return getTargetSchedule();
}

function getCategories() {
    if (!state.customCategories) {
        state.customCategories = structuredClone(DEFAULT_CATEGORIES);
    }
    return state.customCategories;
}

function getCategoryKeys(type) {
    const cats = getCategories();
    if (!state.categoryOrder) state.categoryOrder = {};
    if (!state.categoryOrder[type]) state.categoryOrder[type] = Object.keys(cats[type] || {});
    
    const currentKeys = Object.keys(cats[type] || {});
    state.categoryOrder[type] = state.categoryOrder[type].filter(k => currentKeys.includes(k));
    
    currentKeys.forEach(k => {
        if (!state.categoryOrder[type].includes(k)) {
            state.categoryOrder[type].push(k);
        }
    });
    return state.categoryOrder[type];
}

function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    return new Date(dateStr.replace(/-/g, '/'));
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

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
                return (i + 1) * CELL_HEIGHT + ((hasNoon && periods[i + 1].id >= 5) ? CELL_HEIGHT : 0);
            }
        }
    }
    return periods.length * CELL_HEIGHT + (hasNoon ? CELL_HEIGHT : 0);
}

function getComputedThemeColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
function getDefaultSchoolBgHex() { return rgbToHex(getComputedThemeColor("--school-def-bg")) || "#e0f2fe"; }
function getDefaultTutoringBgHex() { return rgbToHex(getComputedThemeColor("--tutoring-def-bg")) || "#fef3c7"; }
function getDefaultWorkBgHex() { return getDefaultTutoringBgHex(); }

function rgbToHex(rgbStr) {
    if (!rgbStr || rgbStr.startsWith("#")) return rgbStr;
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return null;
    return "#" + ((1 << 24) + (Number(match[0]) << 16) + (Number(match[1]) << 8) + Number(match[2])).toString(16).slice(1);
}

function getTextColorForBg(hexColor) {
    if (!hexColor || !hexColor.startsWith("#")) return "var(--text)";
    let hex = hexColor.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) >= 130 ? "#0f172a" : "#ffffff";
}

function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeJS(text) {
    return String(text || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "\\\"");
}

function escapeHtmlWithBr(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
}

// ========================================================
// 認證、好友連線與資料同步
// ========================================================
async function checkAuthSession() {
    if (!supabaseClient) {
        document.getElementById("sync-user-text").innerText = "本機模式";
        return;
    }
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            updateUserUI(true, currentUser.email);
            await fetchMyProfile();
            await fetchConnections();
            await pullCloudData();
            await fetchMessages();
        } else {
            updateUserUI(false);
        }
    } catch (e) {
        console.error("Session check failed:", e);
    }
}

function updateUserUI(isLoggedIn, email = "") {
    const dot = document.getElementById("sync-dot");
    const text = document.getElementById("sync-user-text");
    const btn = document.getElementById("btn-auth-action");
    text.style.color = "inherit";
    
    if (isLoggedIn) {
        dot.className = "status-dot online";
        text.innerText = `已登入: ${email}`;
        btn.innerText = "登出";
        btn.onclick = handleAuthLogout;
    } else {
        dot.className = "status-dot";
        text.innerText = "未登入";
        btn.innerText = "登入/註冊";
        btn.onclick = openAuthModal;
        const nicknameDisplay = document.getElementById("my-nickname-display");
        if (nicknameDisplay) nicknameDisplay.innerText = "未登入";
    }
}

async function fetchMyProfile() {
    try {
        const { data } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
        if (data) {
            myProfile = data;
            document.getElementById("my-nickname-display").innerText = data.nickname ? `(${data.nickname})` : "(設定暱稱)";
        } else {
            await supabaseClient.from('profiles').insert({ id: currentUser.id, email: currentUser.email });
            myProfile = { id: currentUser.id, email: currentUser.email };
            document.getElementById("my-nickname-display").innerText = "(設定暱稱)";
        }
    } catch (e) {
        console.error("Fetch profile failed:", e);
    }
}

function openAuthModal() { 
    document.getElementById("auth-msg").innerText = ""; 
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-modal").classList.add("active"); 
}

async function handleAuthLogin() {
    const e = document.getElementById("auth-email").value.trim();
    const p = document.getElementById("auth-password").value;
    const msgEl = document.getElementById("auth-msg");
    
    if (!e || !p) {
        msgEl.innerText = "請輸入電子郵件與密碼！";
        return;
    }
    
    if (!supabaseClient) {
        msgEl.innerText = "系統錯誤：無法連接至雲端伺服器 (Supabase 未載入)";
        return;
    }

    msgEl.innerText = "登入中...";
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: e, password: p });
        if (error) {
            msgEl.innerText = "登入失敗：" + error.message;
        } else {
            currentUser = data.user;
            updateUserUI(true, e);
            closeModal("auth-modal");
            showToast("登入成功！");
            await fetchMyProfile();
            await fetchConnections();
            await pullCloudData();
            await fetchMessages();
        }
    } catch (err) {
        console.error("Login failed:", err);
        msgEl.innerText = "發生預期外錯誤：" + err.message;
    }
}

async function handleAuthRegister() {
    const e = document.getElementById("auth-email").value.trim();
    const p = document.getElementById("auth-password").value;
    const msgEl = document.getElementById("auth-msg");
    
    if (!e || !p) {
        msgEl.innerText = "請輸入電子郵件與密碼！";
        return;
    }

    if (!supabaseClient) {
        msgEl.innerText = "系統錯誤：無法連接至雲端伺服器 (Supabase 未載入)";
        return;
    }

    msgEl.innerText = "註冊中...";
    try {
        const { error } = await supabaseClient.auth.signUp({ email: e, password: p });
        if (error) {
            msgEl.innerText = "註冊失敗：" + error.message;
        } else {
            closeModal("auth-modal");
            showToast("註冊成功！請直接登入", "success");
        }
    } catch (err) {
        console.error("Register failed:", err);
        msgEl.innerText = "發生預期外錯誤：" + err.message;
    }
}

async function handleAuthLogout() {
    if (!confirm("確定登出？")) return;

    currentUser = null;
    myProfile = null;
    connectionsList = [];
    userMessages = [];
    isViewingFriend = false;
    friendState = null;
    viewingFriendId = null;

    state = createDefaultState();
    localStorage.removeItem("local_schedule_v2_data");

    updateUserUI(false);
    renderSchedule();
    renderBillings();
    renderFinances();
    renderFriendsView();
    renderNotifications();

    switchView('schedule');
    showToast("已成功登出");

    try {
        await supabaseClient.auth.signOut();
    } catch (err) {
        console.error("Supabase signOut failed:", err);
    }
}

async function saveToStorage() {
    isSaving = true;
    const text = document.getElementById("sync-user-text");
    if (text && text.innerText !== "儲存中...") {
        text.dataset.orig = text.innerText;
        text.innerText = "儲存中...";
    }
    
    try {
        localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
        updatePresetDropdowns();
        if (currentUser) {
            await pushCloudData();
        }
    } catch (e) {
        console.error("儲存失敗:", e);
        showToast("本機儲存或同步失敗", "error");
    } finally {
        isSaving = false;
        if (text) text.innerText = currentUser ? `已同步` : "未登入";
    }
}

async function pushCloudData() {
    if (!supabaseClient || !currentUser) return false;
    try {
        const { error } = await supabaseClient.from("user_schedules").upsert({ 
            user_id: currentUser.id, 
            data: state, 
            updated_at: new Date() 
        });
        return !error;
    } catch (e) {
        console.error("Push data failed:", e);
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
            localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
            applyTheme();
            updatePresetDropdowns();
            checkRecurringFinances();
            renderSchedule();
            renderBillings();
            renderFinances();
        } else {
            await pushCloudData();
        }
    } catch (e) {
        console.error("Pull data failed:", e);
    }
}

// ========================================================
// 好友互動與通知
// ========================================================
function openNicknameModal() {
    document.getElementById("my-nickname-input").value = myProfile?.nickname || "";
    document.getElementById("nickname-msg").innerText = "";
    document.getElementById("nickname-modal").classList.add("active");
}

async function saveNickname() {
    const nn = document.getElementById("my-nickname-input").value.trim();
    if (!nn) return;
    
    try {
        const { data: existing } = await supabaseClient.from('profiles').select('id').eq('nickname', nn).single();
        if (existing && existing.id !== currentUser.id) {
            document.getElementById("nickname-msg").innerText = "此暱稱已被使用，請換一個";
            return;
        }
        
        const { error } = await supabaseClient.from('profiles').update({ nickname: nn }).eq('id', currentUser.id);
        if (error) {
            document.getElementById("nickname-msg").innerText = error.message;
        } else {
            myProfile.nickname = nn;
            document.getElementById("my-nickname-display").innerText = `(${nn})`;
            closeModal("nickname-modal");
            showToast("暱稱已更新");
        }
    } catch (err) {
        console.error(err);
    }
}

async function searchFriends() {
    const q = document.getElementById("friend-search-input").value.trim();
    if (!q) return;
    
    try {
        const { data } = await supabaseClient.from('profiles').select('*').or(`email.eq.${q},nickname.eq.${q}`);
        const res = document.getElementById("friend-search-result");
        
        if (data && data.length > 0) {
            const p = data[0];
            if (p.id === currentUser.id) {
                res.innerHTML = "這是你自己。";
                return;
            }
            
            const isConn = connectionsList.find(c => c.requester_id === p.id || c.receiver_id === p.id);
            if (isConn) {
                res.innerHTML = `已存在連線狀態：${p.nickname || p.email} (${isConn.status})`;
                return;
            }
            
            res.innerHTML = `找到用戶：${p.nickname || p.email} 
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem; margin-left:8px;" 
                                     onclick="sendFriendRequest('${p.id}')">送出邀請</button>`;
        } else {
            res.innerHTML = "找不到此用戶。";
        }
    } catch (err) {
        console.error(err);
    }
}

async function sendFriendRequest(fid) {
    try {
        await supabaseClient.from('connections').insert({ requester_id: currentUser.id, receiver_id: fid });
        document.getElementById("friend-search-result").innerHTML = "邀請已發送！";
        fetchConnections();
    } catch (err) {
        console.error(err);
    }
}

async function fetchConnections() {
    if (!currentUser) return;
    try {
        const { data: rawConns } = await supabaseClient.from('connections').select('*');
        if (rawConns && rawConns.length > 0) {
            const ids = new Set();
            rawConns.forEach(c => { ids.add(c.requester_id); ids.add(c.receiver_id); });
            const { data: profs } = await supabaseClient.from('profiles').select('*').in('id', Array.from(ids));
            
            connectionsList = rawConns.map(c => {
                return {
                    ...c,
                    requester: (profs || []).find(p => p.id === c.requester_id) || { id: c.requester_id, nickname: '未知好友' },
                    receiver: (profs || []).find(p => p.id === c.receiver_id) || { id: c.receiver_id, nickname: '未知好友' }
                };
            });
        } else {
            connectionsList = [];
        }
    } catch (err) {
        console.error(err);
    }
    
    renderFriendsView();
    populateFriendSelects();
}

async function acceptReq(cid) { 
    await supabaseClient.from('connections').update({status:'accepted'}).eq('id',cid); 
    fetchConnections(); 
}
async function rejectReq(cid) { 
    await supabaseClient.from('connections').update({status:'rejected'}).eq('id',cid); 
    fetchConnections(); 
}

function renderFriendsView() {
    const flist = document.getElementById("friends-list");
    const rlist = document.getElementById("friends-requests-list");
    flist.innerHTML = "";
    rlist.innerHTML = "";
    
    if (!currentUser) {
        flist.innerHTML = "<div style='font-size:0.75rem; color:var(--text-muted);'>請先登入以使用好友連線功能</div>";
        return;
    }
    
    const accepted = connectionsList.filter(c => c.status === 'accepted');
    if (accepted.length === 0) {
        flist.innerHTML = "<div style='font-size:0.75rem; color:var(--text-muted);'>尚未加入任何好友</div>";
    }
    
    accepted.forEach(c => {
        let friend = String(c.requester_id) === String(currentUser.id) ? c.receiver : c.requester;
        if (Array.isArray(friend)) friend = friend[0];
        
        if (friend) {
            flist.innerHTML += `
                <div class="friend-card" style="margin-bottom: 6px;">
                    <div class="friend-info">
                        <span class="friend-name">${escapeHtml(friend.nickname || friend.email)}</span>
                        <span class="friend-email">${friend.email || "無Email"}</span>
                    </div>
                    <button class="btn" style="padding:4px 8px; font-size:0.7rem;" 
                            onclick="viewFriendSchedule('${friend.id}', '${escapeJS(friend.nickname || friend.email)}')">
                        查看課表
                    </button>
                </div>`;
        }
    });
    
    const pendingRec = connectionsList.filter(c => c.status === 'pending' && String(c.receiver_id) === String(currentUser.id));
    const pendingSent = connectionsList.filter(c => c.status === 'pending' && String(c.requester_id) === String(currentUser.id));
    
    if (pendingRec.length > 0) {
        pendingRec.forEach(c => {
            let req = Array.isArray(c.requester) ? c.requester[0] : c.requester;
            rlist.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid #f59e0b; border-radius:6px; margin-bottom:4px;">
                    <span style="font-size:0.8rem;">${escapeHtml(req.nickname || req.email)} 發來邀請</span>
                    <div>
                        <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="rejectReq('${c.id}')">拒絕</button>
                        <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="acceptReq('${c.id}')">接受</button>
                    </div>
                </div>`;
        });
    }
    
    if (pendingSent.length > 0) {
        pendingSent.forEach(c => {
            let rec = Array.isArray(c.receiver) ? c.receiver[0] : c.receiver;
            rlist.innerHTML += `<div style="padding:8px; font-size:0.75rem; color:var(--text-muted);">等待 ${escapeHtml(rec.nickname || rec.email)} 接受...</div>`;
        });
    }
}

// 訊息通知系統
async function fetchMessages() {
    if (!currentUser) return;
    try {
        const { data } = await supabaseClient.from('user_messages').select(`*, sender:sender_id(nickname, email)`).order('created_at', { ascending: false });
        if (data) {
            userMessages = data;
            let needsSave = false;
            
            for (let m of userMessages) {
                if (m.receiver_id === currentUser.id && m.status === 'unread') {
                    if (m.type === 'request_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec) rec.isPending = false;
                        m.status = 'completed';
                        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'repay_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec) {
                            rec.isPending = false;
                            // 修正：同時涵蓋 payable 與 receivable 的 targetDebtId 尋找
                            const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                            if (p && p.remaining !== undefined) {
                                p.remaining = Math.round(p.remaining - rec.amount);
                            }
                        }
                        m.status = 'completed';
                        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'delete_accept') {
                        const mainDebt = state.finances.find(f => 
                            (f.type === 'receivable' || f.type === 'payable') &&
                            (f.id === m.payload.sourceId || f.targetDebtId === m.payload.sourceId || 
                            (m.payload.targetDebtId && f.id === m.payload.targetDebtId) ||
                            (m.payload.targetDebtId && f.targetDebtId === m.payload.targetDebtId))
                        );
                        if (mainDebt) {
                            state.finances = state.finances.filter(f => f.id !== mainDebt.id && f.targetDebtId !== mainDebt.id && f.id !== m.payload.sourceId && f.targetDebtId !== m.payload.sourceId);
                        }
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意刪除該筆連線紀錄！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'delete_repay_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId || f.sharedId === m.payload.sourceId);
                        if (rec) {
                            const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                            if (p && p.remaining !== undefined) {
                                p.remaining = Math.round(p.remaining + rec.amount);
                            }
                            state.finances = state.finances.filter(f => f.id !== rec.id);
                        }
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意刪除該筆還款紀錄！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'edit_accept') {
                        const p = state.finances.find(f => 
                            (f.type === 'receivable' || f.type === 'payable') &&
                            (f.id === m.payload.sourceId || f.targetDebtId === m.payload.sourceId || 
                            (m.payload.targetDebtId && f.id === m.payload.targetDebtId) ||
                            (m.payload.targetDebtId && f.targetDebtId === m.payload.targetDebtId))
                        );
                        if (p) {
                            const diff = Math.round(Number(m.payload.amount) - p.amount);
                            p.amount = Math.round(Number(m.payload.amount));
                            if (p.remaining !== undefined) p.remaining = Math.round(p.remaining + diff);
                            p.notes = m.payload.notes;
                        }
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意修改紀錄為 $${m.payload.amount}！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'request_reject') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec && rec.isPending) {
                            state.finances = state.finances.filter(f => f.id !== m.payload.sourceId);
                        }
                        m.type = 'notice';
                        await supabaseClient.from('user_messages').update({ type: 'notice' }).eq('id', m.id);
                        needsSave = true;
                    }
                }
            }
            if (needsSave) {
                saveToStorage();
                renderFinances();
            }
            renderNotifications();
        }
    } catch (err) {
        console.error("Fetch messages failed:", err);
    }
}

window.respondRequest = async function(msgId, action) {
    const msg = userMessages.find(m => m.id === msgId);
    if (!msg) return;
    const senderId = msg.sender_id;

    try {
        if (action === 'accept') {
            if (msg.type === 'lend_request') {
                state.finances.unshift({
                    id: "fin_pay_" + Date.now(), date: formatDate(new Date()), type: "payable",
                    parentCat: "📤 應付款項", subCat: "跟人借款", amount: Math.round(Number(msg.payload.amount)),
                    remaining: Math.round(Number(msg.payload.amount)), notes: msg.payload.notes,
                    linkedFriendId: senderId, targetDebtId: msg.payload.sourceId, isPending: false, isHidden: false
                });
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'request_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意對方的紀錄！");
            } else if (msg.type === 'borrow_request') {
                state.finances.unshift({
                    id: "fin_rec_" + Date.now(), date: formatDate(new Date()), type: "receivable",
                    parentCat: "📥 應收款項", subCat: "代墊款項", amount: Math.round(Number(msg.payload.amount)),
                    remaining: Math.round(Number(msg.payload.amount)), notes: msg.payload.notes,
                    linkedFriendId: senderId, targetDebtId: msg.payload.sourceId, isPending: false, isHidden: false
                });
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'request_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意對方的紀錄！");
            } else if (msg.type === 'repay_request') {
                const parent = state.finances.find(f => f.id === msg.payload.targetDebtId || (f.targetDebtId === msg.payload.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                if (parent) {
                    parent.remaining = Math.round(parent.remaining - Number(msg.payload.amount));
                    state.finances.unshift({
                        id: "fin_rep_" + Date.now(), targetDebtId: parent.id, sharedId: msg.payload.sourceId,
                        date: formatDate(new Date()), type: parent.type === "receivable" ? "income" : "expense",
                        parentCat: parent.type === "receivable" ? "💰 工作收入" : "📦 其他", subCat: "還款",
                        amount: Math.round(Number(msg.payload.amount)), notes: msg.payload.notes, linkedFriendId: senderId, isPending: false, isHidden: false
                    });
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'repay_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已確認收款，雙方帳目已同步扣除！");
            } else if (msg.type === 'delete_request') {
                const mainDebt = state.finances.find(f => 
                    (f.type === 'receivable' || f.type === 'payable') &&
                    (f.id === msg.payload.sourceId || f.targetDebtId === msg.payload.sourceId || 
                    (msg.payload.targetDebtId && f.id === msg.payload.targetDebtId) ||
                    (msg.payload.targetDebtId && f.targetDebtId === msg.payload.targetDebtId))
                );
                if (mainDebt) {
                    state.finances = state.finances.filter(f => f.id !== mainDebt.id && f.targetDebtId !== mainDebt.id && f.id !== msg.payload.sourceId && f.targetDebtId !== msg.payload.sourceId);
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'delete_accept', payload: { sourceId: msg.payload.sourceId, targetDebtId: msg.payload.targetDebtId } });
                showToast("已同意並同步刪除雙方紀錄！");
            } else if (msg.type === 'delete_repay_request') {
                const rec = state.finances.find(f => f.id === msg.payload.sourceId || f.sharedId === msg.payload.sourceId);
                if (rec) {
                    const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                    if (p && p.remaining !== undefined) {
                        p.remaining = Math.round(p.remaining + rec.amount);
                    }
                    state.finances = state.finances.filter(f => f.id !== rec.id);
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'delete_repay_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意刪除該筆還款紀錄，雙方金額已回朔！");
            } else if (msg.type === 'edit_request') {
                const p = state.finances.find(f => 
                    (f.type === 'receivable' || f.type === 'payable') &&
                    (f.id === msg.payload.sourceId || f.targetDebtId === msg.payload.sourceId || 
                    (msg.payload.targetDebtId && f.id === msg.payload.targetDebtId) ||
                    (msg.payload.targetDebtId && f.targetDebtId === msg.payload.targetDebtId))
                );
                if (p) {
                    const diff = Math.round(Number(msg.payload.amount) - p.amount);
                    p.amount = Math.round(Number(msg.payload.amount));
                    if (p.remaining !== undefined) {
                        p.remaining = Math.round(p.remaining + diff);
                    }
                    p.notes = msg.payload.notes;
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'edit_accept', payload: { sourceId: msg.payload.sourceId, targetDebtId: msg.payload.targetDebtId, amount: msg.payload.amount, notes: msg.payload.notes } });
                showToast("已同意修改，雙方金額已同步更新！");
            }
        } else if (action === 'reject') {
            await supabaseClient.from('user_messages').insert({
                sender_id: currentUser.id, receiver_id: senderId, type: 'request_reject',
                payload: { sourceId: msg.payload.sourceId, msg: `對方拒絕了您的請求 (${msg.payload.amount ? '$'+msg.payload.amount : ''})` }
            });
            showToast("已拒絕該筆請求！");
        }

        msg.status = 'completed';
        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', msgId);
        
        saveToStorage(); 
        fetchMessages(); 
        renderFinances();
    } catch (e) {
        console.error("回應請求失敗:", e);
        showToast("回應失敗，請重試", "error");
    }
};

function renderNotifications() {
    const mlist = document.getElementById("messages-list");
    mlist.innerHTML = "";
    
    const navBadge = document.getElementById("tab-friends-badge");
    const notiBadge = document.getElementById("noti-badge");

    if (!currentUser) {
        mlist.innerHTML = "<div style='color:var(--text-muted); padding:10px;'>請先登入以查看通知。</div>";
        if (navBadge) navBadge.style.display = "none";
        if (notiBadge) notiBadge.style.display = "none";
        return;
    }
    
    const unreadMsgs = userMessages.filter(m => String(m.receiver_id) === String(currentUser.id) && m.status === 'unread');
    
    if (navBadge) {
        navBadge.innerText = unreadMsgs.length;
        navBadge.style.display = unreadMsgs.length > 0 ? "inline-block" : "none";
    }
    if (notiBadge) {
        notiBadge.innerText = unreadMsgs.length;
        notiBadge.style.display = unreadMsgs.length > 0 ? "inline-block" : "none";
    }
    
    const displayMsgs = userMessages.filter(m => String(m.receiver_id) === String(currentUser.id));
    if (displayMsgs.length === 0) {
        mlist.innerHTML = "<div style='color:var(--text-muted); padding:10px;'>目前無通知。</div>";
        return;
    }
    
    const fragment = document.createDocumentFragment();
    displayMsgs.forEach(m => {
        const isUnread = m.status === 'unread';
        const bg = isUnread ? "var(--override-temp-def-bg)" : "var(--table-th-bg)";
        const txtColor = isUnread ? "var(--override-temp-def-text)" : "var(--text)";
        const border = isUnread ? "1px solid var(--primary)" : "1px solid var(--border)";
        
        const name = escapeHtml(m.sender?.nickname || m.sender?.email);
        const amt = m.payload?.amount || 0;
        const notes = escapeHtml(m.payload?.notes || '');
        
        const card = document.createElement('div');
        card.style.cssText = `background:${bg}; color:${txtColor}; padding:8px; border-radius:6px; margin-bottom:6px; border:${border}`;
        
        let contentHtml = "";
        
        if (m.type === 'lend_request' && isUnread) {
            contentHtml = `<strong>💸 ${name} 請求借出 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意</button> 
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'borrow_request' && isUnread) {
            contentHtml = `<strong>📥 ${name} 請求借入 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'repay_request' && isUnread) {
            contentHtml = `<strong>✅ ${name} 請求確認已還 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">確認收款</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'edit_request' && isUnread) {
            contentHtml = `<strong>✏️ ${name} 請求修改紀錄</strong><br>修改為：$${amt}<br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意修改</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'delete_request' && isUnread) {
            contentHtml = `<strong>🗑️ ${name} 請求刪除主連線紀錄</strong><br>原金額：$${amt}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意刪除</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'delete_repay_request' && isUnread) {
            contentHtml = `<strong>🗑️ ${name} 請求刪除還款紀錄</strong><br>原還款金額：$${amt}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意刪除</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'notice' && isUnread) {
            contentHtml = `<strong>⚠️ 系統通知</strong><br>${m.payload?.msg || '對方已拒絕您的請求'}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="markNoteRead('${m.id}')">了解</button>
                           </div>`;
        } else if (m.type === 'note') {
            const ctxStr = getNoteContextStr(m.payload.day, m.payload.timeKey);
            contentHtml = `<strong>💬 留言：</strong>來自 ${name}<br>
                           <span style="font-size:0.75rem; font-weight:bold; color:var(--primary);">📍 位於：${escapeHtml(ctxStr)}</span>
                           <div style="margin-top:6px; text-align:right;">
                             <button class="btn btn-danger" style="padding:2px 6px; font-size:0.7rem; margin-right:6px;" onclick="deleteMessage('${m.id}')">刪除</button>
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem; margin-right:6px;" onclick="switchView('schedule'); readStickyNote('${m.id}')">前往查看</button>
                             ${isUnread ? `<button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="markNoteRead('${m.id}')">標示為已讀</button>` : ''}
                           </div>`;
        }
        
        if (contentHtml) {
            card.innerHTML = contentHtml;
            fragment.appendChild(card);
        }
    });
    
    mlist.appendChild(fragment);
}

function getNoteContextStr(day, timeKey) {
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    const sch = getActiveSchedule(); 
    let dName = dayNames[day] || ""; 
    let tName = timeKey;
    
    if (!isNaN(timeKey)) {
        const p = (sch.periods || initialDefaultPeriods).find(x => String(x.id) === String(timeKey));
        const c = sch.courses[`${day}_${timeKey}`];
        tName = (p ? p.name : "") + (c && c.name ? ` - ${c.name}` : "");
    } else if (String(timeKey).startsWith('tut_')) {
        const t = (sch.tutorings || []).find(x => x.id === timeKey);
        tName = t ? `家教: ${t.student}` : "家教";
    } else if (String(timeKey).startsWith('work_')) {
        const w = (sch.works || []).find(x => x.id === timeKey);
        tName = w ? `工作: ${w.name}` : "工作";
    } else if (String(timeKey).startsWith('tmp_')) {
        const tmp = (sch.temporaryEvents || []).find(x => x.id === timeKey);
        tName = tmp ? `事件: ${tmp.title}` : "事件";
    }
    return `${dName} ${tName}`;
}

async function markNoteRead(msgId) {
    const msg = userMessages.find(m => m.id === msgId); 
    if (msg) msg.status = 'read'; 
    renderNotifications(); 
    renderSchedule();
    try {
        await supabaseClient.from('user_messages').update({status:'read'}).eq('id', msgId); 
        fetchMessages(); 
    } catch (e) {
        console.error(e);
    }
}

async function deleteMessage(msgId) { 
    if (!confirm("確定永久刪除此通知與相關留言？")) return;
    userMessages = userMessages.filter(m => m.id !== msgId); 
    renderNotifications(); 
    renderSchedule();
    try {
        await supabaseClient.from('user_messages').delete().eq('id', msgId); 
        fetchMessages();
    } catch (e) {
        console.error(e);
    }
}

// ========================================================
// 檢視好友課表與隱私遮罩
// ========================================================
// ========================================================
// 檢視好友課表與隱私遮罩
// ========================================================
async function viewFriendSchedule(fId, fName) {
    try {
        const { data } = await supabaseClient.from("user_schedules").select("data").eq("user_id", fId).single();
        if (data && data.data) {
            isViewingFriend = true; 
            viewingFriendId = fId; 
            friendState = data.data; 
            showIntersection = false;
            
            const chkIntersection = document.getElementById("chk-intersection");
            if (chkIntersection) chkIntersection.checked = false;
            
            document.getElementById("friend-view-title").innerText = `👀 正在查看 ${fName} 的課表`;
            document.getElementById("friend-view-banner").style.display = "flex";
            
            const cbar = document.getElementById("main-control-bar");
            if (cbar) {
                // 【修正】改為 querySelectorAll(".btn")，精準選取按鈕，避免連同分組 div 一起隱藏
                Array.from(cbar.querySelectorAll(".btn")).forEach(btn => {
                    const txt = btn.innerText || "";
                    const hiddenKeywords = ["唯讀模式", "編輯中", "當前課表設定", "節次設定", "臨時調課", "+ 臨時事件", "+ 家教", "+ 工作", "清除自訂顏色"];
                    if (hiddenKeywords.some(t => txt.includes(t))) {
                        btn.style.display = "none"; 
                        btn.classList.add("friend-hidden");
                    }
                });
            }
            switchView('schedule'); 
            renderSchedule();
        } else {
            showToast("無法取得該好友課表，可能對方尚未建立或設定權限。", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("網路錯誤，無法取得好友資料", "error");
    }
}

function exitFriendView() { 
    isViewingFriend = false; 
    viewingFriendId = null; 
    friendState = null; 
    showIntersection = false; 
    document.getElementById("friend-view-banner").style.display = "none"; 
    
    const cbar = document.getElementById("main-control-bar");
    if (cbar) { 
        // 【修正】精準解除按鈕的隱藏狀態
        Array.from(cbar.querySelectorAll(".friend-hidden")).forEach(btn => { 
            btn.style.display = ""; 
            btn.classList.remove("friend-hidden"); 
        }); 
    }
    renderSchedule(); 
}

function toggleIntersection() { 
    showIntersection = document.getElementById("chk-intersection").checked; 
    renderSchedule(); 
}

function isMyTimeFree(day, startMins, endMins) {
    const s = state.schedules.find(x => x.id === state.activeScheduleId) || state.schedules[0]; 
    if (!s) return true;
    
    for (let p of (s.periods || initialDefaultPeriods)) { 
        const k = `${day}_${p.id}`; 
        const c = s.courses[k]; 
        if (c && c.name && timeToMinutes(p.start) < endMins && timeToMinutes(p.end) > startMins) return false; 
    }
    for (let t of (s.tutorings || [])) { 
        if (Number(t.day) === day && timeToMinutes(t.startTime) < endMins && timeToMinutes(t.endTime) > startMins) return false; 
    }
    for (let w of (s.works || [])) { 
        if (Number(w.day) === day && timeToMinutes(w.startTime) < endMins && timeToMinutes(w.endTime) > startMins) return false; 
    }
    for (let t of (s.temporaryEvents || [])) { 
        let st = t.startTime, et = t.endTime; 
        if (t.slotType === 'noon') {
            st = "12:00"; et = "13:00";
        } else if (t.slotType === 'period') { 
            const spObj = (s.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
            if (spObj) { st = spObj.start; et = spObj.end; } 
        } 
        if (Number(t.day) === day && timeToMinutes(st) < endMins && timeToMinutes(et) > startMins) return false; 
    }
    return true;
}

function openPrivacyMaskModal() {
    const sch = getActiveSchedule();
    const listEl = document.getElementById('privacy-mask-list'); 
    listEl.innerHTML = '';
    
    let html = `<div style="font-weight:bold; margin-top:5px; color:var(--primary);">🏫 學校課程</div>`;
    Object.keys(sch.courses || {}).forEach(k => { 
        const c = sch.courses[k]; 
        if (c.name) html += `<div><label class="checkbox-label"><input type="checkbox" id="mask_sch_${k}" ${c.isMasked ? 'checked' : ''}> ${escapeHtml(c.name)}</label></div>`; 
    });
    
    html += `<div style="font-weight:bold; margin-top:10px; color:var(--primary);">📖 家教課程</div>`;
    (sch.tutorings || []).forEach(t => { 
        html += `<div><label class="checkbox-label"><input type="checkbox" id="mask_tut_${t.id}" ${t.isMasked ? 'checked' : ''}> ${escapeHtml(t.student)}</label></div>`; 
    });
    
    html += `<div style="font-weight:bold; margin-top:10px; color:var(--primary);">💼 工作排程</div>`;
    (sch.works || []).forEach(w => { 
        html += `<div><label class="checkbox-label"><input type="checkbox" id="mask_work_${w.id}" ${w.isMasked ? 'checked' : ''}> ${escapeHtml(w.name)}</label></div>`; 
    });
    
    listEl.innerHTML = html;
    document.getElementById('privacy-mask-modal').classList.add('active');
}

function savePrivacyMask() {
    const sch = getActiveSchedule();
    Object.keys(sch.courses || {}).forEach(k => { 
        const el = document.getElementById(`mask_sch_${k}`); 
        if (el) sch.courses[k].isMasked = el.checked; 
    });
    (sch.tutorings || []).forEach(t => { 
        const el = document.getElementById(`mask_tut_${t.id}`); 
        if (el) t.isMasked = el.checked; 
    });
    (sch.works || []).forEach(w => { 
        const el = document.getElementById(`mask_work_${w.id}`); 
        if (el) w.isMasked = el.checked; 
    });
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal('privacy-mask-modal'); 
    showToast('隱私遮罩設定已儲存！');
}

// 留言與便利貼
function openLeaveNoteModal(day, timeKey) { 
    if (!isViewingFriend) return; 
    document.getElementById("note-target-key").value = day || ""; 
    document.getElementById("note-target-time").value = timeKey || ""; 
    document.getElementById("note-content").value = ""; 
    document.getElementById("leave-note-modal").classList.add("active"); 
}

async function sendStickyNote() {
    const cnt = document.getElementById("note-content").value.trim(); 
    if (!cnt) return;
    
    try {
        await supabaseClient.from('user_messages').insert({ 
            sender_id: currentUser.id, 
            receiver_id: viewingFriendId, 
            type: 'note', 
            payload: { 
                day: document.getElementById("note-target-key").value, 
                timeKey: document.getElementById("note-target-time").value, 
                content: cnt 
            } 
        });
        closeModal('leave-note-modal'); 
        await fetchMessages(); 
        renderSchedule(); 
        showToast("留言已貼上！對方將收到通知。");
    } catch (e) {
        console.error(e);
        showToast("發送留言失敗", "error");
    }
}

function readStickyNote(msgId) {
    const m = userMessages.find(x => x.id === msgId); 
    if (!m) return; 
    
    currentReadingNoteId = msgId;
    const ctxStr = getNoteContextStr(m.payload.day, m.payload.timeKey);
    
    document.getElementById("read-note-content").innerHTML = `
        <div style="font-size:0.8rem; color:#b45309; margin-bottom:8px; border-bottom:1px dashed #d97706; padding-bottom:6px;">
            📍 位於：${escapeHtml(ctxStr)}
        </div>
        <div style="font-size:0.9rem; line-height:1.5;">${escapeHtmlWithBr(m.payload.content)}</div>`;
        
    document.getElementById("read-note-modal").classList.add("active");
    
    if (m.status === 'unread') { 
        markNoteRead(msgId); 
    }
}

async function deleteStickyNote() { 
    if (currentReadingNoteId) { 
        await deleteMessage(currentReadingNoteId);
        closeModal('read-note-modal'); 
    } 
}

function getNoteBadgeHtml(day, timeKey) {
    const targetId = isViewingFriend ? viewingFriendId : currentUser?.id; 
    if (!targetId || !currentUser) return "";
    
    let notes = userMessages.filter(m => m.type === 'note' && m.payload.day == String(day) && m.payload.timeKey == String(timeKey));
    if (isViewingFriend) {
        notes = notes.filter(m => String(m.sender_id) === String(currentUser.id) && String(m.receiver_id) === String(viewingFriendId));
    } else {
        notes = notes.filter(m => String(m.receiver_id) === String(currentUser.id));
    }
    
    if (notes.length > 0) {
        const unreadCount = notes.filter(m => m.status === 'unread').length;
        const txt = isViewingFriend ? "💬已留言" : (unreadCount > 0 ? `💬新留言(${unreadCount})` : "💬留言紀錄");
        const bg = (unreadCount > 0 || isViewingFriend) ? "#ef4444" : "#64748b";
        return `<button class="memo-badge" style="border:none; background:${bg}; color:white; cursor:pointer; font-size:0.55rem; font-weight:bold; top:1px; right:1px; z-index:30; padding:1px 3px; border-radius:3px; position:absolute; pointer-events:auto; white-space:nowrap; transform:scale(0.8); transform-origin:top right;" 
                        onmousedown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); readStickyNote('${notes[0].id}')">${txt}</button>`;
    } 
    return "";
}

// ========================================================
// 初始化與功能設定
// ========================================================
function toggleEditMode() { 
    triggerHaptic(25); 
    state.isEditMode = !state.isEditMode; 
    updateEditModeBtn(); 
    saveToStorage(); 
    renderSchedule(); 
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

function toggle24HourMode() { 
    triggerHaptic(25); 
    state.is24HourMode = !state.is24HourMode; 
    update24HourModeBtn(); 
    saveToStorage(); 
    renderSchedule(); 
}

function update24HourModeBtn() { 
    const btn = document.getElementById("btn-24h-mode-toggle"); 
    if (!btn) return; 
    if (state.is24HourMode) { 
        btn.innerHTML = "節次模式"; 
        btn.className = "btn btn-warning"; 
    } else { 
        btn.innerHTML = "24小時模式"; 
        btn.className = "btn btn-secondary"; 
    } 
}

function initThemeDropdown() { 
    const select = document.getElementById("theme-style-select"); 
    if (!select) return; 
    
    const fragment = document.createDocumentFragment();
    THEME_OPTIONS[state.themeMode || "light"].forEach((opt) => { 
        const optionEl = document.createElement("option"); 
        optionEl.value = opt.id; 
        optionEl.innerText = opt.name; 
        if (opt.id === state.themeStyle) optionEl.selected = true; 
        fragment.appendChild(optionEl); 
    });
    
    select.innerHTML = "";
    select.appendChild(fragment);
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
    if (state.themeMode === "dark") state.lastDarkStyle = styleId; 
    else state.lastLightStyle = styleId; 
    applyTheme(); 
}

function applyTheme() { 
    document.documentElement.setAttribute("data-theme-style", state.themeStyle); 
    const btn = document.getElementById("theme-toggle-btn"); 
    if (btn) btn.innerText = state.themeMode === "dark" ? "淺色" : "深色"; 
    initThemeDropdown(); 
    renderSchedule(); 
    saveToStorage(); 
}

function toggleDeadlineBanner() { 
    state.showDeadlines = document.getElementById("chk-show-deadlines").checked; 
    saveToStorage(); 
    renderSchedule(); 
}

function checkRecurringFinances() {
    if (!state.recurringFinances) state.recurringFinances = []; 
    let modified = false; 
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curDay = today.getDate();
    
    state.recurringFinances.forEach(item => {
        if (!item.lastTriggeredMonth) {
            item.lastTriggeredMonth = `${curMonth === 1 ? curYear - 1 : curYear}-${String(curMonth === 1 ? 12 : curMonth - 1).padStart(2, '0')}`;
        }
        
        let [lastY, lastM] = item.lastTriggeredMonth.split('-').map(Number); 
        let checkY = lastY; 
        let checkM = lastM + 1; 
        
        if (checkM > 12) { checkM = 1; checkY++; }
        
        while (checkY < curYear || (checkY === curYear && checkM <= curMonth)) {
            const daysInCheckMonth = new Date(checkY, checkM, 0).getDate(); 
            const targetDay = Math.min(item.dayOfMonth, daysInCheckMonth);
            
            if (checkY === curYear && checkM === curMonth && curDay < targetDay) break;
            
            const entryDate = `${checkY}-${String(checkM).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
            if (!state.finances) state.finances = []; 
            
            state.finances.unshift({ 
                id: "fin_rec_" + Date.now() + Math.floor(Math.random() * 1000), 
                date: entryDate, 
                type: item.type, 
                parentCat: item.parentCat, 
                subCat: item.subCat, 
                amount: Math.round(Number(item.amount)), 
                notes: item.notes || "固定收支", 
                remaining: (item.type === 'receivable' || item.type === 'payable') ? Math.round(Number(item.amount)) : undefined, 
                isHidden: false 
            });
            
            item.lastTriggeredMonth = `${checkY}-${String(checkM).padStart(2, '0')}`; 
            modified = true; 
            
            checkM++; 
            if (checkM > 12) { checkM = 1; checkY++; }
        }
    });
    
    if (modified) { 
        saveToStorage(); 
        renderFinances(); 
    }
}

function init() {
    const saved = localStorage.getItem("local_schedule_v2_data");
    if (saved) { 
        try { 
            const parsed = JSON.parse(saved); 
            if (parsed && typeof parsed === "object") { 
                state = { ...createDefaultState(), ...parsed }; 
                state.recurringFinances = state.recurringFinances || []; 
                if (state.showDeadlines === undefined) state.showDeadlines = true; 
                if (!parsed.schedules || parsed.schedules.length === 0) { 
                    const dId = "sch_" + Date.now(); 
                    state.schedules = [{ 
                        id: dId, 
                        title: parsed.scheduleTitle || "115學年度上學期課表", 
                        startDate: parsed.scheduleStartDate || "2026-09-07", 
                        endDate: parsed.scheduleEndDate || "2027-01-10", 
                        periods: parsed.periods || structuredClone(initialDefaultPeriods), 
                        courses: parsed.courses || {}, 
                        tutorings: parsed.tutorings || [], 
                        works: parsed.works || [], 
                        overrides: parsed.overrides || [], 
                        temporaryEvents: parsed.temporaryEvents || [], 
                        weeklyMemos: parsed.weeklyMemos || {} 
                    }]; 
                    state.activeScheduleId = dId; 
                } 
            } 
        } catch(e) {
            console.error("載入本地資料失敗:", e);
        } 
    }
    
    document.documentElement.setAttribute("data-theme-style", state.themeStyle); 
    initThemeDropdown(); 
    document.getElementById("theme-toggle-btn").innerText = state.themeMode === "dark" ? "淺色" : "深色"; 
    document.getElementById("chk-show-tutor").checked = Boolean(state.showTutoring); 
    document.getElementById("chk-show-deadlines").checked = state.showDeadlines !== false; 
    document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節"; 
    document.getElementById("text-align-select").value = state.textAlign || "center";
    
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
    if (!document.getElementById("bill-month-filter").value) document.getElementById("bill-month-filter").value = ym; 
    if (!document.getElementById("fin-month-filter").value) document.getElementById("fin-month-filter").value = ym;
    
    updateEditModeBtn(); 
    update24HourModeBtn(); 
    updatePresetDropdowns(); 
    checkRecurringFinances(); 
    renderSchedule(); 
    renderBillings(); 
    renderFinances(); 
    checkAuthSession();

    switchView('schedule');
}

function getMondayOfWeek(d, offsetWeeks = 0) { 
    const date = new Date(d);
    const day = date.getDay(); 
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7); 
    date.setHours(0, 0, 0, 0); 
    return date; 
}

function getWeekKey(d) { return formatDate(getMondayOfWeek(d, currentWeekOffset)); }
function formatDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatSlashDate(dateStr) { const p = dateStr.split("-"); return p.length === 3 ? `${p[0]}/${Number(p[1])}/${Number(p[2])}` : dateStr; }
function formatShortDate(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }

function changeWeek(offset) { triggerHaptic(15); currentWeekOffset += offset; renderSchedule(); }
function resetCurrentWeek() { triggerHaptic(15); currentWeekOffset = 0; renderSchedule(); }
function toggleTutorView() { state.showTutoring = document.getElementById("chk-show-tutor").checked; saveToStorage(); renderSchedule(); }
function toggleLatePeriods() { 
    state.showLatePeriods = !state.showLatePeriods; 
    document.getElementById("late-period-text").innerText = state.showLatePeriods ? "隱藏 9-10 節" : "顯示 9-10 節"; 
    saveToStorage(); 
    renderSchedule(); 
}

function switchView(view) {
    triggerHaptic(20);
    ["schedule", "billing", "finance", "friends"].forEach(v => {
        const btn = document.getElementById(`tab-btn-${v}`); 
        if (btn) { 
            if (view === v) btn.classList.add("active"); 
            else btn.classList.remove("active"); 
        }
        const panel = document.getElementById(`${v}-view`); 
        if (panel) {
            panel.style.display = view === v ? "block" : "none";
        }
    });
    
    if (view === "billing") renderBillings(); 
    if (view === "finance") renderFinances(); 
    if (view === "friends") { fetchConnections(); fetchMessages(); }
}

// ========================================================
// 課表選擇與管理
// ========================================================
function openScheduleSelectModal() { 
    const listEl = document.getElementById("schedule-select-list"); 
    listEl.innerHTML = ""; 
    const targetState = isViewingFriend ? friendState : state;
    
    (targetState.schedules || []).forEach((sch) => { 
        const isActive = sch.id === targetState.activeScheduleId; 
        const item = document.createElement("div"); 
        item.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border); background:${isActive ? "var(--today-header-bg)" : "transparent"}; border-radius:6px; margin-bottom:4px;`; 
        
        let html = `<div>
                        <div style="font-weight:700; font-size:0.85rem; color:${isActive ? "var(--today-header-text)" : "var(--text)"};">${escapeHtml(sch.title)}</div>
                        <div style="font-size:0.68rem; color:var(--text-muted);">${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}</div>
                    </div>
                    <div style="display:flex; gap:4px;">
                        ${!isActive ? `<button class="btn" style="padding:2px 6px; font-size:0.68rem;" onclick="switchActiveSchedule('${sch.id}')">切換</button>` : `<span class="tag-paid" style="font-size:0.68rem;">目前顯示中</span>`}
                        ${(!isViewingFriend && targetState.schedules.length > 1) ? `<button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteSchedule('${sch.id}')">刪除</button>` : ""}
                    </div>`; 
        item.innerHTML = html;
        listEl.appendChild(item); 
    }); 
    document.getElementById("schedule-select-modal").classList.add("active"); 
}

function switchActiveSchedule(schId) { 
    triggerHaptic(20); 
    if (isViewingFriend) { 
        friendState.activeScheduleId = schId; 
        renderSchedule(); 
    } else { 
        state.activeScheduleId = schId; 
        saveToStorage(); 
        updatePresetDropdowns(); 
        renderSchedule(); 
    } 
    closeModal("schedule-select-modal"); 
}

function openCreateScheduleModal() { 
    document.getElementById("new-sch-title").value = ""; 
    document.getElementById("new-sch-start").value = formatDate(new Date()); 
    document.getElementById("new-sch-end").value = "2027-01-10"; 
    closeModal("schedule-select-modal"); 
    document.getElementById("create-schedule-modal").classList.add("active"); 
}

function confirmCreateSchedule() { 
    const title = document.getElementById("new-sch-title").value.trim();
    const start = document.getElementById("new-sch-start").value;
    const end = document.getElementById("new-sch-end").value;
    
    if (!title || !start || !end) {
        showToast("請完整填寫！", "error");
        return;
    }
    
    const newId = "sch_" + Date.now(); 
    state.schedules.push({ 
        id: newId, title, startDate: start, endDate: end, 
        periods: structuredClone(initialDefaultPeriods), 
        courses: {}, tutorings: [], works: [], overrides: [], temporaryEvents: [], weeklyMemos: {} 
    }); 
    
    state.activeScheduleId = newId; 
    saveToStorage(); 
    updatePresetDropdowns(); 
    renderSchedule(); 
    closeModal("create-schedule-modal"); 
    showToast(`已建立並切換至「${title}」！`); 
}

function deleteSchedule(schId) { 
    if (state.schedules.length <= 1) {
        showToast("必須保留至少一個課表！", "error");
        return;
    }
    if (confirm("確定刪除此課表？")) { 
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
    const title = document.getElementById("sch-conf-title").value.trim() || "學期課表";
    const start = document.getElementById("sch-conf-start").value;
    const end = document.getElementById("sch-conf-end").value;
    
    if (!start || !end) {
        showToast("請完整填寫日期！", "error");
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

function openPeriodConfigModal() { 
    const sch = getActiveSchedule(); 
    const tbody = document.getElementById("period-config-body"); 
    tbody.innerHTML = ""; 
    
    (sch.periods || initialDefaultPeriods).forEach((p, idx) => { 
        const tr = document.createElement("tr"); 
        tr.innerHTML = `<td style="font-weight:700;">${p.id}</td>
                        <td><input type="text" id="cfg-pname-${idx}" value="${escapeHtml(p.name)}"></td>
                        <td><input type="time" id="cfg-pstart-${idx}" value="${p.start}"></td>
                        <td><input type="time" id="cfg-pend-${idx}" value="${p.end}"></td>`; 
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
            showToast(`請填寫第 ${i + 1} 節時間！`, "error");
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
    if (confirm("恢復預設節次？")) { 
        getActiveSchedule().periods = structuredClone(initialDefaultPeriods); 
        saveToStorage(); 
        openPeriodConfigModal(); 
        renderSchedule(); 
    } 
}

// ========================================================
// 排程繪製 (課表、24小時制) 與邏輯
// ========================================================
function handleSlotClick(day, periodId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        openLeaveNoteModal(day, periodId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const course = sch.courses ? sch.courses[`${day}_${periodId}`] : null; 
    if (!state.isEditMode) {
        openViewDetailModal("school", { day, periodId, course: course || {} }); 
    } else {
        openSchoolModal(day, periodId); 
    }
}

function handleTutoringClick(tId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        const sch = getTargetSchedule(); 
        const tut = sch.tutorings.find(t => t.id === tId); 
        openLeaveNoteModal(tut ? tut.day : "", tId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const tut = (sch.tutorings || []).find((t) => t.id === tId); 
    if (!tut) return; 
    if (!state.isEditMode) openViewDetailModal("tutoring", { tut }); 
    else openTutoringModal(tId); 
}

function handleWorkClick(wId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        const sch = getTargetSchedule(); 
        const work = sch.works.find(w => w.id === wId); 
        openLeaveNoteModal(work ? work.day : "", wId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const work = (sch.works || []).find((w) => w.id === wId); 
    if (!work) return; 
    if (!state.isEditMode) openViewDetailModal("work", { work }); 
    else openWorkModal(wId); 
}

function handleOverrideClick(ovrId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        openLeaveNoteModal("", ovrId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const ovr = (sch.overrides || []).find((o) => o.id === ovrId); 
    if (!ovr) return; 
    if (!state.isEditMode) openViewDetailModal("override", { ovr }); 
    else openOverrideModal(ovrId); 
}

function handleTempEventClick(tmpId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        const sch = getTargetSchedule(); 
        const tmp = sch.temporaryEvents.find(t => t.id === tmpId); 
        openLeaveNoteModal(tmp ? tmp.day : "", tmpId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId); 
    if (!tmp) return; 
    if (!state.isEditMode) openViewDetailModal("temp_event", { tmp }); 
    else openTempEventModal(tmpId); 
}

function renderSchedule() { 
    if (state.is24HourMode) render24HourSchedule(); 
    else renderOriginalSchedule(); 
}

function renderDeadlinesBanner() {
    const banner = document.getElementById("deadline-banner"); 
    if (state.showDeadlines === false || isViewingFriend) { 
        banner.style.display = "none"; 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    let rawDl = []; 
    if (sch.courses) { 
        Object.keys(sch.courses).forEach(k => { 
            const c = sch.courses[k]; 
            if (c && c.deadlines) {
                c.deadlines.forEach(dl => { rawDl.push({ ...dl, courseName: c.name }); });
            }
        }); 
    }
    
    const uniqueMap = {}; 
    let allDl = []; 
    rawDl.forEach(dl => { 
        const key = `${dl.courseName}_${dl.title}_${dl.date}`; 
        if (!uniqueMap[key]) { uniqueMap[key] = true; allDl.push(dl); } 
    });
    
    const today = new Date(); 
    today.setHours(0,0,0,0); 
    allDl = allDl.filter(dl => { 
        const dDate = parseLocalDate(dl.date); 
        dDate.setHours(0,0,0,0); 
        return dDate >= today; 
    }); 
    allDl.sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    
    if (allDl.length === 0) { 
        banner.style.display = "none"; 
        return; 
    } 
    
    banner.style.display = "block";
    const urgentDl = [];
    const normalDl = []; 
    
    allDl.forEach(dl => { 
        const d = parseLocalDate(dl.date); 
        d.setHours(0,0,0,0); 
        const df = Math.round((d - today) / (1000 * 60 * 60 * 24)); 
        dl.diffDays = df; 
        dl.diffText = df === 0 ? "今天" : `${df} 天後`; 
        if (df < 7) urgentDl.push(dl); 
        else normalDl.push(dl); 
    });
    
    const headerTextEl = document.getElementById("deadline-closest-text"); 
    if (urgentDl.length > 0) { 
        headerTextEl.innerHTML = urgentDl.map(dl => `距 [${escapeHtml(dl.courseName)}] ${escapeHtml(dl.title)} <span style="color:var(--primary); margin-left:4px;">${dl.diffText}</span>`).join(''); 
    } else { 
        const closest = normalDl[0]; 
        headerTextEl.innerHTML = `距 [${escapeHtml(closest.courseName)}] ${escapeHtml(closest.title)} 還有 ${closest.diffDays} 天`; 
    }
    
    const listEl = document.getElementById("deadline-list"); 
    listEl.innerHTML = ""; 
    allDl.forEach(dl => { 
        const d = parseLocalDate(dl.date); 
        const item = document.createElement("div"); 
        item.className = "deadline-item"; 
        item.innerHTML = `<span><b>[${escapeHtml(dl.courseName)}]</b> ${escapeHtml(dl.title)}</span> <span style="color:var(--primary); font-weight:600;">${dl.diffText} (${formatShortDate(d)})</span>`; 
        listEl.appendChild(item); 
    });
}

function getDisplayHtml(item, type, weekKey, isMasked, seg) {
    if (isMasked) return `<div class="item-title">忙碌中</div><div class="item-sub">不可見</div>`;
    let badge = "";
    if (type === 'school') {
        if (!isViewingFriend && getActiveSchedule().weeklyMemos[weekKey] && getActiveSchedule().weeklyMemos[weekKey][`school_${item.key}`]) {
            badge = `<span class="memo-badge">📌</span>`;
        }
        return `${badge}<div class="item-title">${escapeHtml(item.course.name)}</div>${item.course.room ? `<div class="item-sub">${escapeHtml(item.course.room)}</div>` : ""}`;
    } else if (type === 'tutoring') {
        if (!isViewingFriend && getActiveSchedule().weeklyMemos[weekKey] && getActiveSchedule().weeklyMemos[weekKey][`tut_${item.id}`]) {
            badge = `<span class="memo-badge">📌</span>`;
        }
        return `${badge}<div class="item-title">${escapeHtml(item.student)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`;
    } else if (type === 'work') {
        return `<div class="item-title">${escapeHtml(item.name)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`;
    } else if (type === 'override' || type === 'temp') {
        return `<div class="item-title">${escapeHtml(item.title)}</div>${item.location ? `<div class="item-sub">${escapeHtml(item.location)}</div>` : ""}`;
    }
}

// 渲染核心邏輯 (使用 DOM Fragment)
function renderOriginalSchedule() {
    try {
        const sch = getActiveSchedule();
        const monday = getMondayOfWeek(new Date(), currentWeekOffset);
        const maxDays = state.showTutoring ? 7 : 5;
        const rangeEnd = new Date(monday); 
        rangeEnd.setDate(monday.getDate() + (maxDays - 1));
        const weekKey = getWeekKey(new Date());
        const alignClass = `align-${state.textAlign || "center"}`;
        
        document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
        const bannerEl = document.getElementById("schedule-footer-banner"); 
        if (bannerEl) {
            bannerEl.innerHTML = isViewingFriend 
                ? `📅 ${escapeHtml(sch.title)} (好友課表) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[點擊切換]</span>` 
                : `📅 ${escapeHtml(sch.title)} (${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[切換/新增]</span>`;
        }
        
        const tableEl = document.getElementById("schedule-table"); 
        if (tableEl) tableEl.style.width = state.showTutoring ? "calc(68px + (100% - 68px) / 5 * 7)" : "100%";
        
        const thead = document.getElementById("schedule-head"); 
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
        
        const schStart = parseLocalDate(sch.startDate || "2026-09-07");
        const schEnd = parseLocalDate(sch.endDate || "2027-01-10"); 
        schStart.setHours(0,0,0,0); 
        schEnd.setHours(23,59,59,999);
        
        if (rangeEnd < schStart || monday > schEnd) { 
            tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`; 
            renderDeadlinesBanner(); 
            return; 
        }
        renderDeadlinesBanner();

        const periodsToRender = (sch.periods || initialDefaultPeriods).filter((p) => !p.optional || state.showLatePeriods);
        const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
        const hasNoonEvents = currentWeekTempEvents.some((t) => t.slotType === "noon");
        const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);
        const firstPeriodStartMins = periodsToRender.length > 0 ? timeToMinutes(periodsToRender[0].start) : 8 * 60;
        const lastPeriodEndMins = periodsToRender.length > 0 ? timeToMinutes(periodsToRender[periodsToRender.length - 1].end) : 17 * 60;
        
        const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));
        const daytimeGrid = Array.from({ length: maxDays + 1 }, () => []);
        const eveningGrid = Array.from({ length: maxDays + 1 }, () => []);

        // 預先計算非學校排程事件
        for (let d = 1; d <= maxDays; d++) {
            const cellDateObj = new Date(monday); 
            cellDateObj.setDate(monday.getDate() + (d - 1)); 
            const nextDateObj = new Date(cellDateObj); nextDateObj.setDate(cellDateObj.getDate() + 1); 
            const prevDateObj = new Date(cellDateObj); prevDateObj.setDate(cellDateObj.getDate() - 1);
            
            const dStr = formatDate(cellDateObj);
            const nextDStr = formatDate(nextDateObj);
            const prevDStr = formatDate(prevDateObj); 
            let nextD = d === 7 ? 1 : d + 1;
            let prevD = d === 1 ? 7 : d - 1;
            
            const processEvent = (item, itemDay, itemDateStr, clickFn, getInnerHtml, defBgVar, defTextVar, itemType) => {
                let sm = timeToMinutes(item.startTime);
                let em = timeToMinutes(item.endTime);
                let isCross = sm > em;
                
                let matchesToday = itemDateStr ? (itemDateStr === dStr) : (Number(itemDay) === d);
                let matchesNextDay = itemDateStr ? (itemDateStr === nextDStr) : (Number(itemDay) === nextD);
                let matchesPrevDay = itemDateStr ? (itemDateStr === prevDStr) : (Number(itemDay) === prevD);
                
                if ((matchesToday && sm < lastPeriodEndMins && (isCross || em > firstPeriodStartMins)) || (matchesPrevDay && isCross && em > firstPeriodStartMins)) {
                    let renderStart = (matchesPrevDay && isCross) ? "00:00" : item.startTime;
                    let renderEnd = (matchesToday && isCross) ? "24:00" : item.endTime;
                    daytimeGrid[d].push({ ...item, clickFn, getInnerHtml, defBgVar, defTextVar, itemType, renderStart, renderEnd });
                }
                
                if ((matchesToday && (isCross || em > lastPeriodEndMins)) || (matchesNextDay && sm < firstPeriodStartMins)) {
                    let extendsFromDaytime = matchesToday && sm < lastPeriodEndMins;
                    eveningGrid[d].push({ ...item, clickFn, getInnerHtml, defBgVar, defTextVar, itemType, extendsFromDaytime });
                }
            };
            
            (sch.tutorings || []).forEach(t => { 
                if (!overriddenSourceIds.has(t.id)) processEvent(t, t.day, null, handleTutoringClick, (i) => getDisplayHtml(t, 'tutoring', weekKey, isViewingFriend && t.isMasked, i) + getNoteBadgeHtml(t.day, t.id), "--tutoring-def-bg", "--tutoring-def-text", "is-tutoring"); 
            });
            currentWeekWorks.forEach(w => { 
                if (!overriddenSourceIds.has(w.id)) processEvent(w, w.day, null, handleWorkClick, (i) => getDisplayHtml(w, 'work', weekKey, isViewingFriend && w.isMasked, i) + getNoteBadgeHtml(w.day, w.id), "--tutoring-def-bg", "--tutoring-def-text", "is-work"); 
            });
            (sch.overrides || []).forEach(o => { 
                processEvent(o, null, o.targetDate, handleOverrideClick, (i) => getDisplayHtml(o, 'override', weekKey, false, i), "--override-temp-def-bg", "--override-temp-def-text", "is-override-temp"); 
            });
            currentWeekTempEvents.forEach(t => { 
                if (t.slotType !== "noon") { 
                    let st = t.startTime, et = t.endTime; 
                    if (t.slotType === "period") { 
                        const spObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
                        if (spObj) { st = spObj.start; et = spObj.end; } 
                    } 
                    const proxyItem = { ...t, startTime: st || "12:00", endTime: et || "13:00" }; 
                    processEvent(proxyItem, t.day, null, handleTempEventClick, (i) => getDisplayHtml(t, 'temp', weekKey, false, i) + getNoteBadgeHtml(t.day, t.id), "--override-temp-def-bg", "--override-temp-def-text", "is-override-temp"); 
                } 
            });
        }

        const fragment = document.createDocumentFragment();

        periodsToRender.forEach((p, pIdx) => {
            const tr = document.createElement("tr");
            const timeTh = document.createElement("td"); 
            timeTh.className = "col-time"; 
            timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div><div style="color:var(--text-muted); font-size:0.58rem;">${escapeHtml(p.start)}</div>`; 
            tr.appendChild(timeTh);
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td");
                const key = `${d}_${p.id}`;
                const wrapper = document.createElement("div"); 
                wrapper.className = "table-col-wrapper"; 
                const slotDiv = document.createElement("div"); 
                slotDiv.className = "cell-slot";
                
                const course = sch.courses ? sch.courses[key] : null; 
                const overriddenCourseKeys = new Set((sch.overrides || []).filter((o) => o.type === "school").map((o) => o.sourceKey));
                const noteBadge = getNoteBadgeHtml(d, p.id);
                
                if (course && course.name && !overriddenCourseKeys.has(key)) {
                    slotDiv.onclick = (e) => { e.stopPropagation(); handleSlotClick(d, p.id); };
                    const msk = isViewingFriend && course.isMasked;
                    const bgStyle = (!msk && course.color) ? `background-color: ${course.color}; color: ${getTextColorForBg(course.color)};` : `background-color: var(--school-def-bg); color: var(--school-def-text);`;
                    slotDiv.innerHTML = `<div class="slot-item ${alignClass}" style="${bgStyle}">${getDisplayHtml({course, key}, 'school', weekKey, msk, null)}${noteBadge}</div>`;
                } else {
                    slotDiv.onclick = (e) => { e.stopPropagation(); handleSlotClick(d, p.id); };
                    if (isViewingFriend && showIntersection && isMyTimeFree(d, timeToMinutes(p.start), timeToMinutes(p.end))) {
                        slotDiv.style.background = "#dcfce7"; 
                        slotDiv.style.border = "1px solid #22c55e";
                    }
                    slotDiv.innerHTML = `<span style="color:var(--border); font-size:0.75rem;">+</span>${noteBadge}`;
                }
                wrapper.appendChild(slotDiv);

                if (pIdx === 0) {
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container";
                    daytimeGrid[d].forEach(item => {
                        const sm = timeToMinutes(item.renderStart); 
                        let em = timeToMinutes(item.renderEnd); 
                        if (sm > em) em = 24 * 60; 
                        
                        const topPx = timeToPixelOffset(sm, periodsToRender, hasNoonEvents);
                        const bottomPx = timeToPixelOffset(em, periodsToRender, hasNoonEvents);
                        const extendsToEvening = em > lastPeriodEndMins; 
                        
                        let cardTop = topPx + 2;
                        let cardHeight = Math.max(bottomPx - topPx, 20) - 4;
                        let radiusStyle = "";
                        const containerHeight = periodsToRender.length * CELL_HEIGHT + (hasNoonEvents ? CELL_HEIGHT : 0);
                        
                        if (extendsToEvening) { 
                            if (state.showTutoring) { 
                                cardHeight = (bottomPx - topPx) + CELL_HEIGHT - 4; 
                                radiusStyle = "z-index: 15;"; 
                            } else { 
                                radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-width: 0; box-shadow: 0 -1px 2px rgba(0,0,0,0.06); z-index: 15;"; 
                                if (cardTop + cardHeight > containerHeight) { 
                                    cardTop = containerHeight - cardHeight; 
                                } 
                            } 
                        } else { 
                            if (cardTop + cardHeight > containerHeight) { 
                                cardTop = containerHeight - cardHeight; 
                            } 
                        }
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        const styleColor = (!isViewingFriend||!item.isMasked) && item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        floatCard.style.cssText = `${styleColor} top: ${cardTop}px; height: ${cardHeight}px; ${radiusStyle}`;
                        floatCard.onclick = (e) => { e.stopPropagation(); item.clickFn(item.id); }; 
                        floatCard.innerHTML = item.getInnerHtml(item); 
                        overlayContainer.appendChild(floatCard);
                    });
                    wrapper.appendChild(overlayContainer);
                }
                td.appendChild(wrapper); 
                tr.appendChild(td);
            }
            fragment.appendChild(tr);

            if (p.id === 4 && hasNoonEvents) {
                const noonTr = document.createElement("tr"); 
                noonTr.className = "noon-row"; 
                noonTr.innerHTML = `<td class="col-time"><div>中午</div><div style="color:var(--text-muted); font-size:0.58rem;">午休</div></td>`;
                for (let d = 1; d <= maxDays; d++) {
                    const td = document.createElement("td");
                    const noonCell = document.createElement("div"); 
                    noonCell.className = "noon-cell";
                    
                    const dayNoonTemps = currentWeekTempEvents.filter((t) => Number(t.day) === d && t.slotType === "noon");
                    if (dayNoonTemps.length > 0) { 
                        dayNoonTemps.forEach((tmp) => { 
                            const card = document.createElement("div"); 
                            card.className = `noon-card is-override-temp ${alignClass}`; 
                            card.style.cssText = `background-color: var(--override-temp-def-bg); color: var(--override-temp-def-text);`; 
                            card.onclick = (e) => { e.stopPropagation(); handleTempEventClick(tmp.id); }; 
                            card.innerHTML = `<div class="item-title">${escapeHtml(tmp.title)}</div>`; 
                            noonCell.appendChild(card); 
                        }); 
                    } else { 
                        noonCell.innerHTML = `<span class="noon-empty">-</span>`; 
                    }
                    td.appendChild(noonCell); 
                    noonTr.appendChild(td);
                }
                fragment.appendChild(noonTr);
            }
        });

        if (state.showTutoring) {
            const eveningTr = document.createElement("tr"); 
            eveningTr.className = "evening-row"; 
            eveningTr.innerHTML = `<td class="col-time"><div>課後</div><div style="color:var(--text-muted); font-size:0.58rem;">夜間</div></td>`;
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td");
                const eveningCell = document.createElement("div"); 
                eveningCell.className = "evening-cell"; 
                let hasContent = false;
                
                eveningGrid[d].forEach(item => {
                    hasContent = true; 
                    let radiusStyle = item.extendsFromDaytime ? "opacity: 0; pointer-events: none;" : "";
                    const card = document.createElement("div"); 
                    card.className = `evening-card ${item.itemType} ${alignClass}`;
                    const styleColor = (!isViewingFriend||!item.isMasked) && item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                    card.style.cssText = `${styleColor} ${radiusStyle}`;
                    card.onclick = (e) => { e.stopPropagation(); item.clickFn(item.id); }; 
                    card.innerHTML = item.getInnerHtml(item); 
                    eveningCell.appendChild(card);
                });
                
                if (!hasContent) eveningCell.innerHTML = `<span class="evening-empty">無夜間行程</span>`;
                td.appendChild(eveningCell); 
                eveningTr.appendChild(td);
            }
            fragment.appendChild(eveningTr);
        }
        
        tbody.appendChild(fragment);
    } catch (err) { 
        console.error("渲染一般課表失敗:", err); 
        showToast("渲染課表時發生錯誤", "error");
    }
}

function render24HourSchedule() {
    try {
        const sch = getActiveSchedule();
        const monday = getMondayOfWeek(new Date(), currentWeekOffset);
        const maxDays = state.showTutoring ? 7 : 5;
        const rangeEnd = new Date(monday); 
        rangeEnd.setDate(monday.getDate() + (maxDays - 1));
        const weekKey = getWeekKey(new Date());
        const alignClass = `align-${state.textAlign || "center"}`;
        
        document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
        
        const bannerEl = document.getElementById("schedule-footer-banner"); 
        if (bannerEl) {
            bannerEl.innerHTML = isViewingFriend 
                ? `📅 ${escapeHtml(sch.title)} (好友課表) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[點擊切換]</span>` 
                : `📅 ${escapeHtml(sch.title)} (${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}) <span style="font-size:0.68rem; color:var(--primary); font-weight:600; margin-left:6px;">[切換/新增]</span>`;
        }
        
        const tableEl = document.getElementById("schedule-table"); 
        if (tableEl) tableEl.style.width = state.showTutoring ? "calc(68px + (100% - 68px) / 5 * 7)" : "100%";
        
        const thead = document.getElementById("schedule-head"); 
        thead.innerHTML = ""; 
        const headTr = document.createElement("tr"); 
        headTr.innerHTML = `<th class="col-time">時間</th>`;
        
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
        
        const schStart = parseLocalDate(sch.startDate || "2026-09-07");
        const schEnd = parseLocalDate(sch.endDate || "2027-01-10"); 
        schStart.setHours(0,0,0,0); 
        schEnd.setHours(23,59,59,999);
        
        if (rangeEnd < schStart || monday > schEnd) { 
            tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`; 
            renderDeadlinesBanner(); 
            return; 
        }
        renderDeadlinesBanner();

        const periods24 = Array.from({length: 24}, (_, i) => ({ id: `h${i}`, name: `${i}:00`, start: `${String(i).padStart(2, '0')}:00`, end: `${String(i + 1).padStart(2, '0')}:00` }));
        const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
        const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);
        const overriddenSourceIds = new Set((sch.overrides || []).map((o) => o.sourceId));
        const overriddenCourseKeys = new Set((sch.overrides || []).filter((o) => o.type === "school").map((o) => o.sourceKey));

        const fragment = document.createDocumentFragment();

        periods24.forEach((p, pIdx) => {
            const tr = document.createElement("tr"); 
            const timeTh = document.createElement("td"); 
            timeTh.className = "col-time"; 
            timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div>`; 
            tr.appendChild(timeTh);
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td"); 
                const currentCellDateStr = weekDates[d - 1];
                const wrapper = document.createElement("div"); 
                wrapper.className = "table-col-wrapper";
                const slotDiv = document.createElement("div"); 
                slotDiv.className = "cell-slot"; 
                slotDiv.innerHTML = `<span style="color:transparent; font-size:0.75rem;">+</span>`; 
                wrapper.appendChild(slotDiv);
                
                const noteBadge = getNoteBadgeHtml(d, p.id);
                if (isViewingFriend && showIntersection && isMyTimeFree(d, timeToMinutes(p.start), timeToMinutes(p.end))) {
                    slotDiv.style.background = "#dcfce7"; 
                    slotDiv.style.border = "1px solid #22c55e";
                }
                slotDiv.onclick = (e) => { e.stopPropagation(); handleSlotClick(d, p.id); };
                slotDiv.innerHTML += noteBadge;

                if (pIdx === 0) {
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container"; 
                    overlayContainer.style.height = `${24 * CELL_HEIGHT}px`;
                    const renderList = []; 
                    const prevCellDateObj = new Date(monday); 
                    prevCellDateObj.setDate(monday.getDate() + (d - 1) - 1); 
                    const prevCellDateStr = formatDate(prevCellDateObj); 
                    const prevD = d === 1 ? 7 : d - 1;

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
                            const b = getNoteBadgeHtml(itemDay || d, item.id);
                            renderList.push({ 
                                color: (isViewingFriend && item.isMasked) ? "#e2e8f0" : seg.color, 
                                startTime: seg.startTime, 
                                endTime: seg.endTime, 
                                itemType: itemType, 
                                clickFn: () => clickFn(item.id), 
                                innerHtml: getInnerHtml(seg) + b, 
                                defBgVar, 
                                defTextVar, 
                                isStartSegment: seg.isStartSegment, 
                                isEndSegment: seg.isEndSegment 
                            }); 
                        });
                    };

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
                                last.sp.end = curr.sp.end; return; 
                            } 
                        } 
                        mergedCourses.push(curr); 
                    });
                    
                    mergedCourses.forEach(item => { 
                        const msk = isViewingFriend && item.course.isMasked; 
                        renderList.push({ 
                            color: msk ? "#e2e8f0" : item.course.color, 
                            startTime: item.sp.start, 
                            endTime: item.sp.end, 
                            itemType: 'is-school', 
                            clickFn: () => handleSlotClick(d, item.sp.id), 
                            innerHtml: getDisplayHtml(item, 'school', weekKey, msk, null), 
                            defBgVar: '--school-def-bg', 
                            defTextVar: '--school-def-text' 
                        }); 
                    });
                    
                    (sch.tutorings || []).forEach(t => { 
                        if (overriddenSourceIds.has(t.id)) return; 
                        addSegments(t, t.day, undefined, handleTutoringClick, (seg) => getDisplayHtml(t, 'tutoring', weekKey, isViewingFriend && t.isMasked, seg), '--tutoring-def-bg', '--tutoring-def-text', 'is-tutoring'); 
                    });
                    currentWeekWorks.forEach(w => { 
                        if (overriddenSourceIds.has(w.id)) return; 
                        addSegments(w, w.day, undefined, handleWorkClick, (seg) => getDisplayHtml(w, 'work', weekKey, isViewingFriend && w.isMasked, seg), '--tutoring-def-bg', '--tutoring-def-text', 'is-work'); 
                    });
                    (sch.overrides || []).forEach(o => { 
                        addSegments(o, undefined, o.targetDate, handleOverrideClick, (seg) => getDisplayHtml(o, 'override', weekKey, false, seg), '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp'); 
                    });
                    currentWeekTempEvents.forEach(t => { 
                        let st = t.startTime, et = t.endTime; 
                        if (t.slotType === "noon") { 
                            st = "12:00"; et = "13:00"; 
                        } 
                        if (t.slotType === "period") { 
                            const spObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
                            if (spObj) { st = spObj.start; et = spObj.end; } 
                        } 
                        const proxyItem = { ...t, startTime: st || "12:00", endTime: et || "13:00" }; 
                        addSegments(proxyItem, t.day, undefined, handleTempEventClick, (seg) => getDisplayHtml(t, 'temp', weekKey, false, seg), '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp'); 
                    });

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
                            cardHeight = Math.max(bottomPx - topPx, 20) - 2; 
                        }
                        if (item.isEndSegment) { 
                            radiusStyle = "border-top-left-radius: 0; border-top-right-radius: 0; border-top: none;"; 
                            cardTop = topPx; 
                            cardHeight = Math.max(bottomPx - topPx, 20) - 2; 
                        }
                        const containerHeight = 24 * CELL_HEIGHT; 
                        if (cardTop + cardHeight > containerHeight) { 
                            cardTop = containerHeight - cardHeight; 
                        }
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        const colorStyle = item.color ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        floatCard.style.cssText = `${colorStyle} top: ${cardTop}px; height: ${cardHeight}px; ${radiusStyle}`;
                        floatCard.onclick = (e) => { e.stopPropagation(); item.clickFn(); }; 
                        floatCard.innerHTML = item.innerHtml; 
                        overlayContainer.appendChild(floatCard);
                    });
                    wrapper.appendChild(overlayContainer);
                }
                td.appendChild(wrapper); 
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
    } catch (err) { 
        console.error("渲染 24 小時制課表失敗:", err); 
        showToast("渲染 24 小時課表時發生錯誤", "error");
    }
}

// ========================================================
// 檢視與編輯 Modal 處理
// ========================================================
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
        const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`school_${day}_${periodId}`]) || "";
        
        let html = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[day]} 第 ${periodId} 節</div>`;
        if (course.type) html += `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(course.type)}</div>`;
        if (course.room) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(course.room)}</div>`;
        if (course.teacher) html += `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(course.teacher)}</div>`;
        if (course.memo) html += `<div class="detail-label">總備忘錄</div><div class="detail-value">${escapeHtmlWithBr(course.memo)}</div>`;
        if (weeklyMemo) html += `<div class="detail-label">每周備忘錄</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(weeklyMemo)}</div>`;
        html += `</div>`;
        bodyEl.innerHTML = html;
        
        switchBtn.onclick = () => { closeModal("view-detail-modal"); openSchoolModal(day, periodId); };
    } else if (type === "tutoring") {
        const { tut } = payload; 
        titleEl.innerText = `家教: ${tut.student}`; 
        const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${tut.id}`]) || "";
        
        let html = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[tut.day]} ${tut.startTime} ~ ${tut.endTime}</div>`;
        if (tut.subject) html += `<div class="detail-label">科目</div><div class="detail-value">${escapeHtml(tut.subject)}</div>`;
        if (tut.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tut.location)}</div>`;
        if (tut.line) html += `<div class="detail-label">Line ID</div><div class="detail-value">${escapeHtml(tut.line)}</div>`;
        if (tut.fb) html += `<div class="detail-label">Facebook</div><div class="detail-value">${escapeHtml(tut.fb)}</div>`;
        if (tut.phone) html += `<div class="detail-label">電話</div><div class="detail-value">${escapeHtml(tut.phone)}</div>`;
        if (tut.rate) html += `<div class="detail-label">收費時薪</div><div class="detail-value">$${escapeHtml(tut.rate)} / hr</div>`;
        if (tut.memo) html += `<div class="detail-label">備忘錄</div><div class="detail-value">${escapeHtmlWithBr(tut.memo)}</div>`;
        if (weeklyMemo) html += `<div class="detail-label">每周備忘錄</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(weeklyMemo)}</div>`;
        html += `</div>`;
        bodyEl.innerHTML = html;
        
        switchBtn.onclick = () => { closeModal("view-detail-modal"); openTutoringModal(tut.id); };
    } else if (type === "work") {
        const { work } = payload; 
        titleEl.innerText = `工作: ${work.name}`;
        
        let html = `<div class="detail-card">
                        <div class="detail-label">類型</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${work.type === "weekly" ? "每週工作" : "固定工作"}</div>
                        <div class="detail-label">時間</div><div class="detail-value">${dayNames[work.day]} ${work.startTime} ~ ${work.endTime}</div>`;
        if (work.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(work.location)}</div>`;
        if (work.rate) html += `<div class="detail-label">工作時薪</div><div class="detail-value">$${escapeHtml(work.rate)} / hr</div>`;
        if (work.memo) html += `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(work.memo)}</div>`;
        html += `</div>`;
        bodyEl.innerHTML = html;
        
        switchBtn.onclick = () => { closeModal("view-detail-modal"); openWorkModal(work.id); };
    } else if (type === "override") {
        const { ovr } = payload; 
        currentViewingOverrideId = ovr.id; 
        titleEl.innerText = `調課: ${ovr.title}`; 
        
        let html = `<div class="detail-card"><div class="detail-label">目標時間</div><div class="detail-value">${ovr.targetDate} (${ovr.startTime}~${ovr.endTime})</div>`;
        if (ovr.memo) html += `<div class="detail-label">備註</div><div class="detail-value">${escapeHtmlWithBr(ovr.memo)}</div>`;
        html += `</div>`;

        // 顯示原課程/行程資訊
        let origHtml = '';
        if (ovr.type === 'school' && ovr.sourceKey && sch.courses && sch.courses[ovr.sourceKey]) {
            const c = sch.courses[ovr.sourceKey];
            origHtml += `<div class="detail-card" style="margin-top:8px; background:var(--bg); border:1px dashed var(--border);">
                            <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px; font-size:0.75rem;">📌 原課程資訊 (學校)</div>
                            <div class="detail-label">課程名稱</div><div class="detail-value">${escapeHtml(c.name)}</div>`;
            if (c.type) origHtml += `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(c.type)}</div>`;
            if (c.room) origHtml += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(c.room)}</div>`;
            if (c.teacher) origHtml += `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(c.teacher)}</div>`;
            if (c.memo) origHtml += `<div class="detail-label">備忘錄</div><div class="detail-value">${escapeHtmlWithBr(c.memo)}</div>`;
            origHtml += `</div>`;
        } else if (ovr.type === 'tutoring' && ovr.sourceId) {
            const t = (sch.tutorings||[]).find(x => x.id === ovr.sourceId);
            if (t) {
                origHtml += `<div class="detail-card" style="margin-top:8px; background:var(--bg); border:1px dashed var(--border);">
                                <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px; font-size:0.75rem;">📌 原課程資訊 (家教)</div>
                                <div class="detail-label">學生</div><div class="detail-value">${escapeHtml(t.student)}</div>`;
                if (t.subject) origHtml += `<div class="detail-label">科目</div><div class="detail-value">${escapeHtml(t.subject)}</div>`;
                if (t.location) origHtml += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(t.location)}</div>`;
                if (t.rate) origHtml += `<div class="detail-label">收費時薪</div><div class="detail-value">$${escapeHtml(t.rate)} / hr</div>`;
                origHtml += `</div>`;
            }
        } else if (ovr.type === 'work' && ovr.sourceId) {
            const w = (sch.works||[]).find(x => x.id === ovr.sourceId);
            if (w) {
                origHtml += `<div class="detail-card" style="margin-top:8px; background:var(--bg); border:1px dashed var(--border);">
                                <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px; font-size:0.75rem;">📌 原行程資訊 (工作)</div>
                                <div class="detail-label">工作名稱</div><div class="detail-value">${escapeHtml(w.name)}</div>`;
                if (w.location) origHtml += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(w.location)}</div>`;
                if (w.rate) origHtml += `<div class="detail-label">工作時薪</div><div class="detail-value">$${escapeHtml(w.rate)} / hr</div>`;
                origHtml += `</div>`;
            }
        }
        html += origHtml;

        bodyEl.innerHTML = html;
        switchBtn.onclick = () => { closeModal("view-detail-modal"); openOverrideModal(ovr.id); }; 
        revertBtn.style.display = "inline-flex";

    } else if (type === "temp_event") {
        const { tmp } = payload; 
        currentViewingTempEventId = tmp.id; 
        titleEl.innerText = `事件: ${tmp.title}`; 
        
        let html = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[tmp.day]} ${tmp.startTime}~${tmp.endTime}</div>`;
        if (tmp.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tmp.location)}</div>`;
        if (tmp.memo) html += `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(tmp.memo)}</div>`;
        html += `</div>`;

        // 顯示該節次被覆蓋的原課程資訊
        let origHtml = '';
        if (tmp.slotType === 'period' && tmp.periodId && tmp.day) {
            const c = sch.courses && sch.courses[`${tmp.day}_${tmp.periodId}`];
            if (c && c.name) {
                origHtml += `<div class="detail-card" style="margin-top:8px; background:var(--bg); border:1px dashed var(--border);">
                                <div style="font-weight:bold; color:var(--text-muted); margin-bottom:4px; font-size:0.75rem;">📌 該節次原課程資訊</div>
                                <div class="detail-label">課程名稱</div><div class="detail-value">${escapeHtml(c.name)}</div>`;
                if (c.type) origHtml += `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(c.type)}</div>`;
                if (c.room) origHtml += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(c.room)}</div>`;
                if (c.teacher) origHtml += `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(c.teacher)}</div>`;
                if (c.memo) origHtml += `<div class="detail-label">備忘錄</div><div class="detail-value">${escapeHtmlWithBr(c.memo)}</div>`;
                origHtml += `</div>`;
            }
        }
        html += origHtml;

        bodyEl.innerHTML = html;
        switchBtn.onclick = () => { closeModal("view-detail-modal"); openTempEventModal(tmp.id); };
    }
    document.getElementById("view-detail-modal").classList.add("active");
}

function revertCurrentOverride() { 
    if (confirm("確定取消此調課？")) { 
        const sch = getActiveSchedule(); 
        sch.overrides = (sch.overrides || []).filter(o => o.id !== currentViewingOverrideId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("view-detail-modal"); 
        showToast("已復原調課");
    } 
}

function deleteOverrideFromModal() { 
    if (confirm("確定刪除此調課？")) { 
        const sch = getActiveSchedule(); 
        sch.overrides = (sch.overrides || []).filter(o => o.id !== currentEditingOverrideId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("override-modal"); 
        showToast("已刪除調課紀錄");
    } 
}

function deleteTempEventFromModal() { 
    if (confirm("確定刪除此事件？")) { 
        const sch = getActiveSchedule(); 
        sch.temporaryEvents = (sch.temporaryEvents || []).filter(t => t.id !== currentEditingTempEventId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("temp-event-modal"); 
        showToast("已刪除臨時事件");
    } 
}

// 學校課程 Modal
function openSchoolModal(day, period) {
    currentEditingSlot = { day, period }; 
    const sch = getActiveSchedule();
    const key = `${day}_${period}`;
    const course = (sch.courses && sch.courses[key]) || {};
    
    document.getElementById("sch-name").value = course.name || ""; 
    document.getElementById("sch-room").value = course.room || ""; 
    document.getElementById("sch-teacher").value = course.teacher || ""; 
    document.getElementById("sch-memo").value = course.memo || ""; 
    
    const isMaskedEl = document.getElementById("sch-is-masked");
    if (isMaskedEl) isMaskedEl.checked = course.isMasked || false; 
    
    document.getElementById("sch-weekly-memo").value = (sch.weeklyMemos[getWeekKey(new Date())] && sch.weeklyMemos[getWeekKey(new Date())][`school_${key}`]) || "";
    
    tempDeadlines = course.deadlines ? structuredClone(course.deadlines) : []; 
    currentEditingDeadlineIdx = null; 
    document.getElementById("btn-add-dl").innerText = "新增"; 
    renderModalDeadlines();
    
    const typeSelect = document.getElementById("sch-type-select");
    const cType = course.type || "必修"; 
    if (Array.from(typeSelect.options).some(o => o.value === cType)) { 
        typeSelect.value = cType; 
        document.getElementById("sch-type-custom-wrap").style.display = "none"; 
    } else { 
        typeSelect.value = "custom"; 
        document.getElementById("sch-type-custom-wrap").style.display = "block"; 
        document.getElementById("sch-type-custom").value = cType; 
    }
    
    document.getElementById("sch-color").value = course.color || getDefaultSchoolBgHex(); 
    document.getElementById("school-modal").classList.add("active");
}

function saveSchoolCourse() {
    triggerHaptic(20); 
    if (!currentEditingSlot) return; 
    
    const sch = getActiveSchedule();
    const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
    const name = document.getElementById("sch-name").value.trim();
    const color = document.getElementById("sch-color").value; 
    
    let typeVal = document.getElementById("sch-type-select").value; 
    if (typeVal === "custom") typeVal = document.getElementById("sch-type-custom").value.trim() || "必修";
    
    const memo = document.getElementById("sch-memo").value.trim(); 
    const isMaskedEl = document.getElementById("sch-is-masked");
    const isMasked = isMaskedEl ? isMaskedEl.checked : false; 
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
        sch.courses[key] = { 
            name, type: typeVal, room: document.getElementById("sch-room").value.trim(), 
            teacher: document.getElementById("sch-teacher").value.trim(), 
            memo: memo, isMasked: isMasked, 
            color: color.toLowerCase() === getDefaultSchoolBgHex().toLowerCase() ? undefined : color, 
            deadlines: structuredClone(tempDeadlines) 
        };
        
        Object.keys(sch.courses).forEach(k => { 
            if (sch.courses[k].name === name || (oldName && sch.courses[k].name === oldName)) { 
                sch.courses[k].name = name; 
                sch.courses[k].deadlines = structuredClone(tempDeadlines); 
                sch.courses[k].memo = memo; 
                if (weeklyMemo) { 
                    sch.weeklyMemos[weekKey][`school_${k}`] = weeklyMemo; 
                } else { 
                    delete sch.weeklyMemos[weekKey][`school_${k}`]; 
                } 
            } 
        });
    }
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("school-modal");
    showToast("課程儲存成功");
}

function deleteSchoolCourse() { 
    if (!currentEditingSlot) return; 
    if (confirm("清空該節？")) { 
        triggerHaptic(25); 
        delete getActiveSchedule().courses[`${currentEditingSlot.day}_${currentEditingSlot.period}`]; 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("school-modal"); 
        showToast("已清空該節課程");
    } 
}

function renderModalDeadlines() { 
    const container = document.getElementById("sch-deadlines-container"); 
    container.innerHTML = ""; 
    
    if (tempDeadlines.length === 0) { 
        container.innerHTML = `<div style="font-size:0.7rem; color:var(--text-muted);">無排定日程</div>`; 
        return; 
    } 
    
    tempDeadlines.sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date)); 
    
    const fragment = document.createDocumentFragment();
    tempDeadlines.forEach((dl, idx) => { 
        const row = document.createElement("div"); 
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:var(--table-th-bg); padding:4px 6px; border-radius:4px; margin-bottom:4px; font-size:0.75rem;"; 
        row.innerHTML = `<span>${escapeHtml(dl.title)} <b style="color:var(--primary);">${formatSlashDate(dl.date)}</b></span>
                         <div>
                           <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.6rem; margin-right:4px;" onclick="editSchoolDeadline(${idx})">編</button>
                           <button class="btn btn-danger" style="padding:1px 4px; font-size:0.6rem;" onclick="removeSchoolDeadline(${idx})">刪</button>
                         </div>`; 
        fragment.appendChild(row); 
    });
    container.appendChild(fragment);
}

function addSchoolDeadline() { 
    const title = document.getElementById("sch-new-dl-title").value.trim();
    const date = document.getElementById("sch-new-dl-date").value; 
    
    if (!title || !date) {
        showToast("請填寫日程名稱與日期！", "error");
        return;
    }
    
    if (currentEditingDeadlineIdx !== null) { 
        tempDeadlines[currentEditingDeadlineIdx] = { id: tempDeadlines[currentEditingDeadlineIdx].id, title, date }; 
        currentEditingDeadlineIdx = null; 
        document.getElementById("btn-add-dl").innerText = "新增"; 
    } else { 
        tempDeadlines.push({ id: "dl_" + Date.now(), title, date }); 
    } 
    
    document.getElementById("sch-new-dl-title").value = ""; 
    renderModalDeadlines(); 
}

function editSchoolDeadline(idx) { 
    currentEditingDeadlineIdx = idx; 
    const dl = tempDeadlines[idx]; 
    document.getElementById("sch-new-dl-title").value = dl.title; 
    document.getElementById("sch-new-dl-date").value = dl.date; 
    document.getElementById("btn-add-dl").innerText = "儲存"; 
}

function removeSchoolDeadline(idx) { 
    tempDeadlines.splice(idx, 1); 
    renderModalDeadlines(); 
}

// ========================================================
// 家教與工作 Modal
// ========================================================
function openTutoringModal(id = null) {
    currentEditingTutoringId = id; 
    const sch = getActiveSchedule();
    const defHex = getDefaultTutoringBgHex();
    
    if (id) {
        const tut = (sch.tutorings || []).find((t) => t.id === id); 
        if (!tut) return;
        
        ["student","day","start-time","end-time","subject","location","line","fb","phone","rate","memo"].forEach(k => { 
            const val = tut[k.replace(/-([a-z])/g, g => g[1].toUpperCase())];
            document.getElementById(`tut-${k}`).value = val || ""; 
        });
        
        const isMaskedEl = document.getElementById("tut-is-masked");
        if (isMaskedEl) isMaskedEl.checked = tut.isMasked || false;
        
        document.getElementById("tut-color").value = tut.color || defHex; 
        document.getElementById("tut-weekly-memo").value = (sch.weeklyMemos[getWeekKey(new Date())] && sch.weeklyMemos[getWeekKey(new Date())][`tut_${id}`]) || ""; 
        document.getElementById("tut-delete-btn").style.display = "block";
    } else {
        ["student","subject","location","line","fb","phone","rate","memo","weekly-memo"].forEach(k => document.getElementById(`tut-${k}`).value = ""); 
        
        const isMaskedEl = document.getElementById("tut-is-masked");
        if (isMaskedEl) isMaskedEl.checked = false;
        
        document.getElementById("tut-day").value = "6"; 
        document.getElementById("tut-start-time").value = "18:00"; 
        document.getElementById("tut-end-time").value = "20:00"; 
        document.getElementById("tut-color").value = defHex; 
        document.getElementById("tut-delete-btn").style.display = "none";
    }
    document.getElementById("tutoring-modal").classList.add("active");
}

function saveTutoringClass() {
    const student = document.getElementById("tut-student").value.trim(); 
    if (!student) {
        showToast("請填寫學生姓名！", "error");
        return;
    }
    
    const sch = getActiveSchedule();
    const color = document.getElementById("tut-color").value;
    const savedColor = color.toLowerCase() === getDefaultTutoringBgHex().toLowerCase() ? undefined : color;
    const isMaskedEl = document.getElementById("tut-is-masked");
    const isMasked = isMaskedEl ? isMaskedEl.checked : false;
    
    const itemData = { 
        id: currentEditingTutoringId || "tut_" + Date.now(), 
        student, 
        day: document.getElementById("tut-day").value, 
        startTime: document.getElementById("tut-start-time").value, 
        endTime: document.getElementById("tut-end-time").value, 
        subject: document.getElementById("tut-subject").value.trim(), 
        location: document.getElementById("tut-location").value.trim(), 
        line: document.getElementById("tut-line").value.trim(), 
        fb: document.getElementById("tut-fb").value.trim(), 
        phone: document.getElementById("tut-phone").value.trim(), 
        rate: document.getElementById("tut-rate").value, 
        memo: document.getElementById("tut-memo").value.trim(), 
        isMasked: isMasked, 
        color: savedColor 
    };
    
    if (currentEditingTutoringId) { 
        const idx = sch.tutorings.findIndex((t) => t.id === currentEditingTutoringId); 
        if (idx > -1) sch.tutorings[idx] = itemData; 
    } else { 
        sch.tutorings.push(itemData); 
    }
    
    const wk = getWeekKey(new Date());
    const memo = document.getElementById("tut-weekly-memo").value.trim(); 
    if (!sch.weeklyMemos) sch.weeklyMemos = {}; 
    if (!sch.weeklyMemos[wk]) sch.weeklyMemos[wk] = {}; 
    if (memo) {
        sch.weeklyMemos[wk][`tut_${itemData.id}`] = memo; 
    } else {
        delete sch.weeklyMemos[wk][`tut_${itemData.id}`];
    }
    
    saveToStorage(); 
    renderSchedule(); 
    renderBillings(); 
    closeModal("tutoring-modal");
    showToast("家教設定已儲存");
}

function deleteTutoringClass() { 
    if (confirm("刪除此家教？")) { 
        getActiveSchedule().tutorings = getActiveSchedule().tutorings.filter(t => t.id !== currentEditingTutoringId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("tutoring-modal"); 
        showToast("已刪除家教紀錄");
    } 
}

function openWorkModal(id = null) {
    currentEditingWorkId = id; 
    const sch = getActiveSchedule();
    const defHex = getDefaultWorkBgHex();
    
    if (id) {
        const work = (sch.works || []).find((w) => w.id === id); 
        if (!work) return;
        
        ["type","name","day","start-time","end-time","location","rate","memo"].forEach(k => { 
            const val = work[k.replace(/-([a-z])/g, g => g[1].toUpperCase())];
            document.getElementById(`work-${k}`).value = val || ""; 
        });
        
        const isMaskedEl = document.getElementById("work-is-masked");
        if (isMaskedEl) isMaskedEl.checked = work.isMasked || false;
        
        document.getElementById("work-color").value = work.color || defHex; 
        document.getElementById("work-delete-btn").style.display = "block";
    } else {
        ["name","location","rate","memo"].forEach(k => document.getElementById(`work-${k}`).value = ""); 
        
        const isMaskedEl = document.getElementById("work-is-masked");
        if (isMaskedEl) isMaskedEl.checked = false;
        
        document.getElementById("work-type").value = "fixed"; 
        document.getElementById("work-day").value = "1"; 
        document.getElementById("work-start-time").value = "09:00"; 
        document.getElementById("work-end-time").value = "12:00"; 
        document.getElementById("work-color").value = defHex; 
        document.getElementById("work-delete-btn").style.display = "none";
    }
    document.getElementById("work-modal").classList.add("active");
}

function saveWorkClass() {
    const name = document.getElementById("work-name").value.trim(); 
    if (!name) {
        showToast("請填寫工作名稱！", "error");
        return;
    }
    
    const sch = getActiveSchedule();
    const color = document.getElementById("work-color").value;
    const savedColor = color.toLowerCase() === getDefaultWorkBgHex().toLowerCase() ? undefined : color;
    const isMaskedEl = document.getElementById("work-is-masked");
    const isMasked = isMaskedEl ? isMaskedEl.checked : false;
    
    const itemData = { 
        id: currentEditingWorkId || "work_" + Date.now(), 
        type: document.getElementById("work-type").value, 
        weekKey: document.getElementById("work-type").value === "weekly" ? getWeekKey(new Date()) : undefined, 
        name, 
        day: document.getElementById("work-day").value, 
        startTime: document.getElementById("work-start-time").value, 
        endTime: document.getElementById("work-end-time").value, 
        location: document.getElementById("work-location").value.trim(), 
        rate: document.getElementById("work-rate").value, 
        memo: document.getElementById("work-memo").value.trim(), 
        isMasked: isMasked, 
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
    showToast("工作排程已儲存");
}

function deleteWorkClass() { 
    if (confirm("刪除此工作排程？")) { 
        getActiveSchedule().works = getActiveSchedule().works.filter((w) => w.id !== currentEditingWorkId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("work-modal"); 
        showToast("已刪除工作排程");
    } 
}

// 臨時事件與調課 Modal 
function openTempEventModal(tmpId = null) {
    currentEditingTempEventId = tmpId; 
    const sch = getActiveSchedule();
    
    if (tmpId) {
        const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId);
        ["title","day","slot-type","start-time","end-time","location","memo"].forEach(k => {
            const val = tmp[k.replace(/-([a-z])/g, g => g[1].toUpperCase())];
            document.getElementById(`tmp-${k}`).value = val || "";
        });
        
        // 傳入 true，表示正在載入原有資料，不要洗掉既有儲存的時間
        onTempSlotTypeChange(tmp.slotType || "period", true); 
        if (tmp.slotType === "period") {
            document.getElementById("tmp-period-id").value = tmp.periodId || "1"; 
        }
        document.getElementById("tmp-delete-btn").style.display = "inline-flex";
    } else {
        ["title","location","memo"].forEach(k => document.getElementById(`tmp-${k}`).value = "");
        document.getElementById("tmp-day").value = "1"; 
        document.getElementById("tmp-slot-type").value = "period"; 
        document.getElementById("tmp-period-id").value = "1"; 
        document.getElementById("tmp-start-time").value = "12:00"; 
        document.getElementById("tmp-end-time").value = "13:00"; 
        onTempSlotTypeChange("period", true); 
        document.getElementById("tmp-delete-btn").style.display = "none";
    }
    document.getElementById("temp-event-modal").classList.add("active");
}

function onTempSlotTypeChange(type, isInit = false) { 
    document.getElementById("tmp-period-wrap").style.display = type === "period" ? "block" : "none"; 
    document.getElementById("tmp-time-wrap").style.display = type !== "period" ? "flex" : "none"; 

    const startTimeInput = document.getElementById("tmp-start-time");
    const endTimeInput = document.getElementById("tmp-end-time");

    if (type === "noon") {
        if (!isInit) {
            startTimeInput.value = "12:00";
            endTimeInput.value = "13:00";
        }
        startTimeInput.disabled = true;
        endTimeInput.disabled = true;
    } else {
        startTimeInput.disabled = false;
        endTimeInput.disabled = false;
        if (type === "evening" && !isInit) {
            startTimeInput.value = "18:00";
            endTimeInput.value = "20:00";
        }
    }
}

function saveTempEvent() { 
    const title = document.getElementById("tmp-title").value.trim();
    const slotType = document.getElementById("tmp-slot-type").value; 
    
    if (!title) {
        showToast("請輸入事件名稱！", "error");
        return;
    }
    
    const sch = getActiveSchedule(); 
    let startTime = document.getElementById("tmp-start-time").value;
    let endTime = document.getElementById("tmp-end-time").value; 
    
    if (slotType === "period") { 
        const pObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === document.getElementById("tmp-period-id").value); 
        if (pObj) { 
            startTime = pObj.start; 
            endTime = pObj.end; 
        } 
    } else if (slotType === "noon") {
        // 後端防呆防護：強制設定為中午時段
        startTime = "12:00";
        endTime = "13:00";
    }
    
    const item = { 
        id: currentEditingTempEventId || "tmp_" + Date.now(), 
        weekKey: getWeekKey(new Date()), 
        day: document.getElementById("tmp-day").value, 
        slotType, 
        periodId: slotType === "period" ? document.getElementById("tmp-period-id").value : null, 
        title, startTime, endTime, 
        location: document.getElementById("tmp-location").value.trim(), 
        memo: document.getElementById("tmp-memo").value.trim() 
    }; 
    
    if (currentEditingTempEventId) { 
        const idx = sch.temporaryEvents.findIndex(t => t.id === currentEditingTempEventId); 
        if (idx > -1) sch.temporaryEvents[idx] = item; 
    } else { 
        sch.temporaryEvents.push(item); 
    } 
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("temp-event-modal"); 
    showToast("臨時事件已儲存");
}

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
            if (c && c.name && p) {
                selectEl.appendChild(new Option(`[課程] ${dayNames[day]} ${p.name} - ${c.name}`, `school_${key}`)); 
            }
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
    if (!val) { 
        descEl.value = ""; 
        return; 
    } 
    descEl.value = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text; 
}

function saveClassOverride() {
    const val = document.getElementById("ovr-source-select").value;
    const targetDate = document.getElementById("ovr-target-date").value;
    const startTime = document.getElementById("ovr-start-time").value;
    const endTime = document.getElementById("ovr-end-time").value; 
    
    if (!val || !targetDate || !startTime || !endTime) {
        showToast("請完整填寫！", "error");
        return;
    }
    
    const [type, ...keyParts] = val.split("_"); 
    const sourceIdOrKey = keyParts.join("_"); 
    const sch = getActiveSchedule(); 
    const title = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text.split("] ")[1];
    
    const obj = { 
        id: currentEditingOverrideId || "ovr_" + Date.now(), 
        type, 
        sourceKey: type === "school" ? sourceIdOrKey : undefined, 
        sourceId: type !== "school" ? sourceIdOrKey : undefined, 
        title, targetDate, startTime, endTime, 
        memo: document.getElementById("ovr-memo").value.trim() 
    };
    
    if (currentEditingOverrideId) { 
        const idx = sch.overrides.findIndex(o => o.id === currentEditingOverrideId); 
        if (idx > -1) sch.overrides[idx] = obj; 
    } else { 
        sch.overrides.push(obj); 
    } 
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("override-modal");
    showToast("調課設定已儲存");
}

// Preset 選單更新
function updatePresetDropdowns() {
    const sch = state.schedules.find(s => s.id === state.activeScheduleId) || state.schedules[0];
    
    const cSel = document.getElementById("sch-preset-select"); 
    if (cSel) { 
        cSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uC = {}; 
        Object.values(sch.courses || {}).forEach((c) => { 
            if (c.name && !uC[c.name]) { 
                uC[c.name] = c; 
                cSel.appendChild(new Option(c.name, JSON.stringify(c))); 
            } 
        }); 
    }
    
    const tSel = document.getElementById("tut-preset-select"); 
    if (tSel) { 
        tSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uT = {}; 
        (sch.tutorings || []).forEach((t) => { 
            if (t.student && !uT[t.student]) { 
                uT[t.student] = t; 
                tSel.appendChild(new Option(t.student, JSON.stringify(t))); 
            } 
        }); 
    }
    
    const wSel = document.getElementById("work-preset-select"); 
    if (wSel) { 
        wSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uW = {}; 
        (state.schedules || []).forEach(s => {
            (s.works || []).forEach(w => { 
                if (w.name && !uW[w.name]) { 
                    uW[w.name] = w; 
                    wSel.appendChild(new Option(w.name, JSON.stringify(w))); 
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
        
        const mEl = document.getElementById("sch-is-masked");
        if (mEl) mEl.checked = c.isMasked || false; 
        
        document.getElementById("sch-color").value = c.color || getDefaultSchoolBgHex(); 
        
        if (c.deadlines) { 
            tempDeadlines = structuredClone(c.deadlines); 
            renderModalDeadlines(); 
        } 
    } catch(e) { console.error(e); } 
}

function onSchTypeChange(val) { 
    document.getElementById("sch-type-custom-wrap").style.display = val === "custom" ? "block" : "none"; 
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
        
        const mEl = document.getElementById("tut-is-masked");
        if (mEl) mEl.checked = t.isMasked || false; 
        
        document.getElementById("tut-color").value = t.color || getDefaultTutoringBgHex(); 
    } catch(e) { console.error(e); } 
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
        
        const mEl = document.getElementById("work-is-masked");
        if (mEl) mEl.checked = w.isMasked || false; 
        
        document.getElementById("work-color").value = w.color || getDefaultWorkBgHex(); 
    } catch(e) { console.error(e); } 
}

function clearAllCustomColors() { 
    if (confirm("確定清除？")) { 
        triggerHaptic(25); 
        const sch = state.schedules.find(s => s.id === state.activeScheduleId); 
        if (sch.courses) Object.keys(sch.courses).forEach((k) => delete sch.courses[k].color); 
        if (sch.tutorings) sch.tutorings.forEach((t) => delete t.color); 
        if (sch.works) sch.works.forEach((w) => delete w.color); 
        saveToStorage(); 
        renderSchedule(); 
        showToast("已清除所有自訂顏色"); 
    } 
}

function onTextAlignChange(val) { 
    triggerHaptic(15); 
    state.textAlign = val; 
    saveToStorage(); 
    renderSchedule(); 
}

function resetSchoolColor() { document.getElementById("sch-color").value = getDefaultSchoolBgHex(); }
function resetTutoringColor() { document.getElementById("tut-color").value = getDefaultTutoringBgHex(); }
function resetWorkColor() { document.getElementById("work-color").value = getDefaultWorkBgHex(); }


// ========================================================
// 帳務系統 (Billing & Finance)
// ========================================================
function switchBillingType(type) { 
    currentBillingType = type; 
    currentSelectedStudentFilter = "__FILTER_ALL__"; 
    document.getElementById("btn-billing-type-tutoring").className = `billing-type-btn ${type === "tutoring" ? "active" : ""}`; 
    document.getElementById("btn-billing-type-work").className = `billing-type-btn ${type === "work" ? "active" : ""}`; 
    document.getElementById("nav-billing-text").innerText = type === "tutoring" ? "家教帳務" : "工作帳務"; 
    renderBillings(); 
}

function openCurrentBillingModal() { 
    currentBillingType === "work" ? openWorkBillingModal() : openBillingModal(); 
}

function setBillingMonthCurrent() { 
    const now = new Date(); 
    document.getElementById("bill-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
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
    const isWork = currentBillingType === "work";
    const selectedMonth = document.getElementById("bill-month-filter").value;
    const sortOrder = document.getElementById("bill-sort-order").value;
    
    document.getElementById("th-billing-target").innerText = isWork ? "工作名稱" : "學生"; 
    document.getElementById("stat-unpaid-title").innerText = isWork ? "未領取金額" : "未繳清金額";
    
    const allNamesSet = new Set(); 
    (state.schedules || []).forEach(sch => { 
        (isWork ? sch.works : sch.tutorings).forEach(x => { 
            if (x.name || x.student) allNamesSet.add(x.name || x.student); 
        }); 
    }); 
    (isWork ? state.workBillings : state.billings).forEach(b => { 
        if (b.name || b.student) allNamesSet.add(b.name || b.student); 
    });
    
    const chips = document.getElementById("student-filter-chips"); 
    let chipsHtml = `<div class="student-chip ${currentSelectedStudentFilter === "__FILTER_ALL__" ? "active" : ""}" onclick="setStudentFilter('__FILTER_ALL__')">${isWork ? "全部工作" : "全部學生"}</div>`; 
    Array.from(allNamesSet).forEach(item => {
        chipsHtml += `<div class="student-chip ${currentSelectedStudentFilter === item ? "active" : ""}" onclick="setStudentFilter('${escapeJS(item)}')">${escapeHtml(item)}</div>`;
    }); 
    chips.innerHTML = chipsHtml;
    
    let tH = 0, tI = 0, tU = 0;
    const statMap = {};
    
    (isWork ? state.workBillings : state.billings).forEach(r => { 
        if (selectedMonth && (r.date || '').slice(0, 7) !== selectedMonth) return; 
        
        const targetName = (isWork ? r.name : r.student) || "未具名";
        const h = Number(r.hours || 0);
        const tot = Number(r.total || 0); 
        
        if (!statMap[targetName]) statMap[targetName] = { h:0, i:0, u:0, p:0 }; 
        statMap[targetName].h += h; 
        statMap[targetName].i += tot; 
        if (r.status === "unpaid") statMap[targetName].u += tot; else statMap[targetName].p += tot; 
        
        if (currentSelectedStudentFilter === "__FILTER_ALL__" || currentSelectedStudentFilter === targetName) { 
            tH += h; 
            tI += tot; 
            if (r.status === "unpaid") tU += tot; 
        } 
    });
    
    const statsC = document.getElementById("student-stats-container"); 
    let statsHtml = ""; 
    Object.keys(statMap).forEach(k => { 
        statsHtml += `<div class="student-stat-card"><div class="student-stat-name">${escapeHtml(k)}</div><div class="student-stat-row"><span>時數：</span><strong>${statMap[k].h} hr</strong></div><div class="student-stat-row"><span>應收：</span><strong>$${statMap[k].i.toLocaleString()}</strong></div><div class="student-stat-row"><span>已收：</span><span style="color:#15803d; font-weight:700;">$${statMap[k].p.toLocaleString()}</span></div><div class="student-stat-row"><span>未繳：</span><span style="color:#ef4444; font-weight:700;">$${statMap[k].u.toLocaleString()}</span></div></div>`; 
    }); 
    statsC.innerHTML = statsHtml;
    
    const targetArray = isWork ? state.workBillings : state.billings;
    const filtered = targetArray.map((record, idx) => ({record, idx}))
        .filter(({record}) => (!selectedMonth || (record.date||'').slice(0,7) === selectedMonth) && (currentSelectedStudentFilter === "__FILTER_ALL__" || (isWork ? record.name : record.student) === currentSelectedStudentFilter))
        .sort((a,b) => sortOrder === "asc" ? a.record.date.localeCompare(b.record.date) : b.record.date.localeCompare(a.record.date));
    
    const fragment = document.createDocumentFragment();
    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="8" style="text-align:center; color:var(--text-muted); padding:12px;">無紀錄</td>`;
        fragment.appendChild(tr);
    } else {
        filtered.forEach(({record, idx}) => { 
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${record.date}</td>
                            <td><strong>${escapeHtml(isWork ? record.name : record.student)}</strong></td>
                            <td>${record.hours}h</td>
                            <td>$${record.rate}</td>
                            <td><strong style="color:var(--primary);">$${record.total}</strong></td>
                            <td><span class="${record.status === "paid" ? "tag-paid" : "tag-unpaid"}">${record.status === "paid" ? "已清" : "未清"}</span></td>
                            <td>${escapeHtml(record.notes || "-")}</td>
                            <td>
                                <button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'toggleWorkBillStatus' : 'toggleBillStatus'}(${idx})">切換</button> 
                                <button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'openWorkBillingModal' : 'openBillingModal'}(${idx})">編輯</button> 
                                <button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="${isWork ? 'deleteWorkBilling' : 'deleteBilling'}(${idx})">刪除</button>
                            </td>`; 
            fragment.appendChild(tr);
        }); 
    }
    
    tbody.innerHTML = "";
    tbody.appendChild(fragment);
    
    document.getElementById("stat-total-hours").innerText = `${tH} 小時`; 
    document.getElementById("stat-total-income").innerText = `$${tI.toLocaleString()}`; 
    document.getElementById("stat-unpaid").innerText = `$${tU.toLocaleString()}`;
}

async function syncBillingToFinance(billId, date, total, notes, isWork = false) {
    const finId = "fin_sync_" + billId; 
    const finIdx = state.finances.findIndex(f => f.id === finId);
    if (finIdx > -1) { 
        state.finances[finIdx].date = date; 
        state.finances[finIdx].amount = Math.round(Number(total)); 
        state.finances[finIdx].notes = notes; 
    } else { 
        state.finances.unshift({ 
            id: finId, 
            date, 
            type: "income", 
            parentCat: "💰 工作收入", 
            subCat: isWork ? "兼職外快" : "家教收入", 
            amount: Math.round(Number(total)), 
            notes, 
            isHidden: false 
        }); 
    }
}

function openBillingModal(idx = null) {
    currentEditingBillingIndex = idx; 
    const sel = document.getElementById("bill-student-select"); 
    sel.innerHTML = '<option value="">-- 現有家教 --</option>';
    
    const names = new Set((state.schedules || []).flatMap(s => (s.tutorings || []).map(t => t.student)));
    names.forEach(s => { 
        if (s) sel.appendChild(new Option(s, s)); 
    });
    
    if (idx !== null) { 
        const item = state.billings[idx]; 
        ["date","student","hours","rate","total","status","notes"].forEach(k => {
            document.getElementById(`bill-${k}`).value = item[k] || "";
        }); 
    } else { 
        ["student","notes"].forEach(k => document.getElementById(`bill-${k}`).value = ""); 
        document.getElementById("bill-date").value = formatDate(new Date()); 
        document.getElementById("bill-hours").value = "2"; 
        document.getElementById("bill-status").value = "unpaid"; 
        updateBillingRateByDateAndStudent(); 
    }
    document.getElementById("billing-modal").classList.add("active");
}

function onSelectBillingStudent() { 
    document.getElementById("bill-student").value = document.getElementById("bill-student-select").value; 
    updateBillingRateByDateAndStudent(); 
}

function onBillingDateOrStudentChange() { 
    updateBillingRateByDateAndStudent(); 
}

function updateBillingRateByDateAndStudent() { 
    if (currentEditingBillingIndex !== null) return; 
    const name = document.getElementById("bill-student").value.trim(); 
    const tuts = (state.schedules || []).flatMap(s => (s.tutorings || []).filter(t => t.student === name)); 
    
    const targetDay = (parseLocalDate(document.getElementById("bill-date").value).getDay() || 7);
    const targetTut = tuts.find(t => Number(t.day) === targetDay) || tuts[0] || {rate: ""};
    
    document.getElementById("bill-rate").value = targetTut.rate || ""; 
    calcBillAmount(); 
}

function calcBillAmount() { 
    document.getElementById("bill-total").value = Math.round((Number(document.getElementById("bill-hours").value) || 0) * (Number(document.getElementById("bill-rate").value) || 0)); 
}

async function saveBillingRecord() {
    const date = document.getElementById("bill-date").value;
    const student = document.getElementById("bill-student").value.trim();
    const hours = document.getElementById("bill-hours").value;
    const rate = document.getElementById("bill-rate").value;
    const total = document.getElementById("bill-total").value;
    
    if (!date || !student || !hours || !rate) {
        showToast("請完整填寫！", "error");
        return;
    }
    
    const obj = { 
        id: currentEditingBillingIndex !== null ? state.billings[currentEditingBillingIndex].id : "bill_" + Date.now(), 
        date, student, hours, rate, total, 
        status: document.getElementById("bill-status").value, 
        notes: document.getElementById("bill-notes").value.trim() 
    };
    
    if (currentEditingBillingIndex !== null) {
        state.billings[currentEditingBillingIndex] = obj; 
    } else {
        state.billings.unshift(obj);
    }
    
    await syncBillingToFinance(obj.id, date, total, `家教: ${student} (${hours}hr)`, false);
    saveToStorage(); 
    renderBillings(); 
    renderFinances(); 
    closeModal("billing-modal");
    showToast("帳務已儲存");
}

function toggleBillStatus(idx) { 
    state.billings[idx].status = state.billings[idx].status === "paid" ? "unpaid" : "paid"; 
    saveToStorage(); 
    renderBillings(); 
}

function deleteBilling(idx) { 
    if (confirm("刪除？")) { 
        state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.billings[idx].id); 
        state.billings.splice(idx, 1); 
        saveToStorage(); 
        renderBillings(); 
        renderFinances(); 
        showToast("已刪除紀錄");
    } 
}

function openWorkBillingModal(idx = null) {
    currentEditingWorkBillingIndex = idx; 
    const sel = document.getElementById("wbill-name-select"); 
    sel.innerHTML = '<option value="">-- 現有工作 --</option>';
    
    new Set((state.schedules || []).flatMap(s => (s.works || []).map(w => w.name))).forEach(n => { 
        if (n) sel.appendChild(new Option(n, n)); 
    });
    
    if (idx !== null) { 
        const item = state.workBillings[idx]; 
        ["date","name","hours","rate","total","status","notes"].forEach(k => document.getElementById(`wbill-${k}`).value = item[k] || ""); 
    } else { 
        ["name","notes"].forEach(k => document.getElementById(`wbill-${k}`).value = ""); 
        document.getElementById("wbill-date").value = formatDate(new Date()); 
        document.getElementById("wbill-hours").value = "4"; 
        document.getElementById("wbill-status").value = "unpaid"; 
        updateWorkBillingRateByDateAndName(); 
    }
    document.getElementById("work-billing-modal").classList.add("active");
}

function onSelectBillingWork() { 
    document.getElementById("wbill-name").value = document.getElementById("wbill-name-select").value; 
    updateWorkBillingRateByDateAndName(); 
}

function onWorkBillingDateOrNameChange() { 
    updateWorkBillingRateByDateAndName(); 
}

function updateWorkBillingRateByDateAndName() { 
    if (currentEditingWorkBillingIndex !== null) return; 
    const name = document.getElementById("wbill-name").value.trim(); 
    document.getElementById("wbill-rate").value = ((state.schedules || []).flatMap(s => (s.works || []).filter(w => w.name === name))[0] || {rate:""}).rate || ""; 
    calcWorkBillAmount(); 
}

function calcWorkBillAmount() { 
    document.getElementById("wbill-total").value = Math.round((Number(document.getElementById("wbill-hours").value) || 0) * (Number(document.getElementById("wbill-rate").value) || 0)); 
}

async function saveWorkBillingRecord() {
    const date = document.getElementById("wbill-date").value;
    const name = document.getElementById("wbill-name").value.trim();
    const hours = document.getElementById("wbill-hours").value;
    const rate = document.getElementById("wbill-rate").value;
    const total = document.getElementById("wbill-total").value;
    
    if (!date || !name || !hours || !rate) {
        showToast("請完整填寫！", "error");
        return;
    }
    
    const obj = { 
        id: currentEditingWorkBillingIndex !== null ? state.workBillings[currentEditingWorkBillingIndex].id : "wbill_" + Date.now(), 
        date, name, hours, rate, total, 
        status: document.getElementById("wbill-status").value, 
        notes: document.getElementById("wbill-notes").value.trim() 
    };
    
    if (currentEditingWorkBillingIndex !== null) {
        state.workBillings[currentEditingWorkBillingIndex] = obj; 
    } else {
        state.workBillings.unshift(obj);
    }
    
    await syncBillingToFinance(obj.id, date, total, `工作: ${name} (${hours}hr)`, true);
    saveToStorage(); 
    renderBillings(); 
    renderFinances(); 
    closeModal("work-billing-modal");
    showToast("帳務已儲存");
}

function toggleWorkBillStatus(idx) { 
    state.workBillings[idx].status = state.workBillings[idx].status === "paid" ? "unpaid" : "paid"; 
    saveToStorage(); 
    renderBillings(); 
}

function deleteWorkBilling(idx) { 
    if (confirm("刪除？")) { 
        state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.workBillings[idx].id); 
        state.workBillings.splice(idx, 1); 
        saveToStorage(); 
        renderBillings(); 
        renderFinances(); 
        showToast("已刪除紀錄");
    } 
}

// ========================================================
// 收支管理 (Finance)
// ========================================================
function toggleExpenseChart() { 
    triggerHaptic(20); 
    isExpenseChartVisible = !isExpenseChartVisible; 
    const container = document.getElementById("expense-chart-container"); 
    if (isExpenseChartVisible) { 
        container.classList.add("active"); 
        financeActiveMode = "all_expense"; 
    } else { 
        container.classList.remove("active"); 
        financeActiveMode = "all"; 
    } 
    financeActiveMainCat = "all"; 
    financeActiveSubCat = "all"; 
    renderFinances(); 
}

function renderChartData() {
    const container = document.getElementById("expense-chart-content"); 
    container.innerHTML = ""; 
    const selectedMonth = document.getElementById("fin-month-filter").value; 
    let totalExpense = 0; 
    const catSums = {};
    
    (state.finances || []).forEach(item => { 
        if (item.isHidden && !state.showHiddenItems) return; 
        if (item.type !== "expense") return; 
        if (selectedMonth && (item.date || "").slice(0,7) !== selectedMonth) return; 
        const amt = Number(item.amount || 0); 
        totalExpense += amt; 
        if (!catSums[item.parentCat]) catSums[item.parentCat] = 0; 
        catSums[item.parentCat] += amt; 
    });
    
    if (totalExpense === 0) { 
        container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted);">無支出資料</div>`; 
        return; 
    }
    
    const data = Object.keys(catSums).map(cat => ({ cat, amt: catSums[cat], pct: catSums[cat] / totalExpense })).sort((a,b) => b.amt - a.amt); 
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#14b8a6', '#f43f5e'];
    
    let svgHTML = `<svg width="120" height="120" viewBox="0 0 32 32" style="transform: rotate(-90deg); border-radius:50%;">`;
    let offset = 0;
    const C = 2 * Math.PI * 10;
    
    data.forEach((item, idx) => { 
        item.color = colors[idx % colors.length]; 
        const slice = item.pct * C; 
        svgHTML += `<circle r="10" cx="16" cy="16" fill="transparent" stroke="${item.color}" stroke-width="6" stroke-dasharray="${slice} ${C}" stroke-dashoffset="${-offset}"></circle>`; 
        offset += slice; 
    }); 
    svgHTML += `</svg>`;
    
    let legendHTML = `<div style="display:flex; flex-direction:column; gap:4px;">`; 
    data.forEach(item => { 
        legendHTML += `<div class="legend-item"><div class="legend-color" style="background:${item.color};"></div><span>${escapeHtml(item.cat)}: ${Math.round(item.pct * 100)}% ($${item.amt.toLocaleString()})</span></div>`; 
    }); 
    legendHTML += `</div>`; 
    
    container.innerHTML = svgHTML + legendHTML;
}

function setFinanceMonthCurrent() { 
    const now = new Date(); 
    document.getElementById("fin-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
    renderFinances(); 
}

function setFinanceMonthAll() { 
    document.getElementById("fin-month-filter").value = ""; 
    renderFinances(); 
}

function setFinanceAllMode(mode) { 
    financeActiveMode = mode; 
    financeActiveMainCat = "all"; 
    financeActiveSubCat = "all"; 
    renderFinances(); 
}

function selectFinanceMainCategory(cat) { 
    financeActiveMode = "main"; 
    financeActiveMainCat = cat; 
    financeActiveSubCat = "all"; 
    renderFinances(); 
}

function selectFinanceSubCategory(cat) { 
    financeActiveMode = "sub"; 
    financeActiveSubCat = cat; 
    renderFinances(); 
}

function toggleShowHiddenItems() { 
    state.showHiddenItems = !state.showHiddenItems; 
    const btn = document.getElementById("btn-toggle-hidden"); 
    btn.style.borderColor = state.showHiddenItems ? "var(--primary)" : "var(--border)"; 
    btn.style.color = state.showHiddenItems ? "var(--primary)" : "var(--text)"; 
    btn.innerText = state.showHiddenItems ? "👁️ 隱藏項目顯示中" : "👁️ 顯示隱藏"; 
    saveToStorage(); 
    renderFinances(); 
}

function toggleRecordHidden(id) { 
    const item = state.finances.find(f => f.id === id); 
    if (item) { 
        item.isHidden = !item.isHidden; 
        saveToStorage(); 
        renderFinances(); 
    } 
}

function onFinanceTypeChange() { 
    const pSel = document.getElementById("fin-parent-cat"); 
    pSel.innerHTML = ""; 
    getCategoryKeys(document.getElementById("fin-type").value).forEach(p => pSel.appendChild(new Option(p, p))); 
    onFinanceParentCatChange(); 
    
    const type = document.getElementById("fin-type").value; 
    const wrap = document.getElementById("fin-friend-wrap");
    if (wrap) {
        if (type === 'receivable' || type === 'payable') { 
            wrap.style.display = "block"; 
        } else { 
            wrap.style.display = "none"; 
            document.getElementById("fin-friend-select").value = ""; 
        }
    }
}

function onFinanceParentCatChange() { 
    const sSel = document.getElementById("fin-sub-cat"); 
    sSel.innerHTML = ""; 
    (getCategories()[document.getElementById("fin-type").value][document.getElementById("fin-parent-cat").value] || []).forEach(s => sSel.appendChild(new Option(s, s))); 
}

function populateFriendSelects() {
    const finSel = document.getElementById('fin-friend-select'); 
    if (!finSel) return;
    
    finSel.innerHTML = '<option value="">-- 不發送 --</option>';
    if (!currentUser || !connectionsList) return;
    
    connectionsList.forEach(c => { 
        if (c.status !== 'accepted') return;
        let friend = null;
        if (String(c.requester_id) === String(currentUser.id)) friend = c.receiver;
        else if (String(c.receiver_id) === String(currentUser.id)) friend = c.requester;
        
        if (Array.isArray(friend)) friend = friend[0];
        
        if (friend) {
            finSel.appendChild(new Option(friend.nickname || friend.email || `好友 (${friend.id.substring(0,6)})`, friend.id)); 
        }
    });
}

function openFinanceModal(id = null) {
    if (currentUser) { 
        fetchConnections().then(() => populateFriendSelects()); 
    } else { 
        populateFriendSelects(); 
    }

    document.getElementById("fin-edit-id").value = id || "";
    if (document.getElementById("fin-friend-select")) {
        document.getElementById("fin-friend-select").value = "";
    }
    
    if (id) { 
        const item = state.finances.find(f => f.id === id); 
        document.getElementById("fin-modal-title").innerText = "編輯收支"; 
        document.getElementById("fin-date").value = item.date; 
        document.getElementById("fin-type").value = item.type; 
        onFinanceTypeChange(); 
        document.getElementById("fin-parent-cat").value = item.parentCat; 
        onFinanceParentCatChange(); 
        document.getElementById("fin-sub-cat").value = item.subCat; 
        document.getElementById("fin-amount").value = item.amount; 
        document.getElementById("fin-notes").value = item.notes || ""; 
    } else { 
        document.getElementById("fin-modal-title").innerText = "新增收支"; 
        document.getElementById("fin-date").value = formatDate(new Date()); 
        document.getElementById("fin-type").value = "expense"; 
        onFinanceTypeChange(); 
        document.getElementById("fin-amount").value = ""; 
        document.getElementById("fin-notes").value = ""; 
    }
    document.getElementById("finance-modal").classList.add("active");
}

async function saveFinanceRecord() {
    const id = document.getElementById("fin-edit-id").value;
    const date = document.getElementById("fin-date").value;
    const type = document.getElementById("fin-type").value;
    const parentCat = document.getElementById("fin-parent-cat").value;
    const subCat = document.getElementById("fin-sub-cat").value;
    const amount = Math.round(Number(document.getElementById("fin-amount").value));
    const notes = document.getElementById("fin-notes").value.trim();
    
    const friendSel = document.getElementById('fin-friend-select');
    const friendId = friendSel ? friendSel.value : null;
    
    if (!date || !amount) {
        showToast("填寫完整！", "error");
        return;
    }

    try {
        if (id) { 
            const idx = state.finances.findIndex(f => f.id === id); 
            const oldItem = state.finances[idx]; 
            const isShared = !!(oldItem.linkedFriendId || oldItem.targetDebtId);
            const isCreditor = oldItem.type === 'receivable' || (oldItem.type === 'income' && oldItem.subCat === '還款');

            if (isShared && !isCreditor) {
                showToast("只有應收方可以修改連線紀錄！", "error");
                return;
            }

            if (isShared && isCreditor && oldItem.linkedFriendId && currentUser) {
                 if (amount !== oldItem.amount || notes !== oldItem.notes) {
                     await supabaseClient.from('user_messages').insert({
                         sender_id: currentUser.id, receiver_id: oldItem.linkedFriendId, type: 'edit_request',
                         payload: { sourceId: id, targetDebtId: oldItem.targetDebtId, amount, notes }
                     });
                     showToast("已發送修改請求給對方，待對方同意後同步更新！");
                     closeModal("finance-modal");
                     return;
                 }
            }

            if (oldItem.targetDebtId && oldItem.subCat === "還款") { 
                const diff = Math.round(amount - oldItem.amount); 
                const targetDebt = state.finances.find(f => f.id === oldItem.targetDebtId); 
                if (targetDebt && targetDebt.remaining !== undefined) {
                    targetDebt.remaining = Math.round(targetDebt.remaining - diff); 
                }
            } 
            state.finances[idx] = { ...oldItem, date, type, parentCat, subCat, amount, notes }; 

        } else { 
            const newId = "fin_" + Date.now();
            if (friendId && currentUser) {
                let actionType = '';
                if (type === 'receivable') actionType = 'lend_request';
                else if (type === 'payable') actionType = 'borrow_request';

                if (actionType) {
                    state.finances.unshift({
                        id: newId, date, type, parentCat, subCat, amount, notes,
                        remaining: amount, isHidden: false, isPending: true, linkedFriendId: friendId
                    });
                    await supabaseClient.from('user_messages').insert({
                        sender_id: currentUser.id, receiver_id: friendId, type: actionType,
                        payload: { sourceId: newId, amount, notes }
                    });
                    showToast("已發送請求給好友，等待對方同意確認！");
                    saveToStorage(); 
                    renderFinances(); 
                    closeModal("finance-modal");
                    return;
                }
            }
            state.finances.unshift({ 
                id: newId, date, type, parentCat, subCat, amount, notes, 
                remaining: (type === "receivable" || type === "payable") ? amount : undefined, 
                isHidden: false, isPending: false 
            }); 
        }

        saveToStorage(); 
        renderFinances(); 
        closeModal("finance-modal");
        showToast("收支紀錄已儲存");
    } catch (e) {
        console.error("儲存收支失敗:", e);
        showToast("儲存失敗，請重試", "error");
    }
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

async function confirmRepay() {
    const id = document.getElementById("repay-id").value;
    const date = document.getElementById("repay-date").value;
    const amt = Math.round(Number(document.getElementById("repay-amount").value));
    const notes = document.getElementById("repay-notes").value.trim();
    
    const item = state.finances.find(f => f.id === id); 
    const rem = item.remaining !== undefined ? item.remaining : item.amount;
    
    if (!date || amt <= 0 || amt > rem) {
        showToast("金額錯誤！請輸入大於零的有效金額。", "error");
        return;
    }

    const isShared = !!item.linkedFriendId;

    try {
        if (isShared && currentUser) {
            const repayId = "fin_repay_" + Date.now();
            state.finances.unshift({
                id: repayId, targetDebtId: id, sharedId: repayId, date, 
                type: item.type === "receivable" ? "income" : "expense", 
                parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他", subCat: "還款",
                amount: amt, notes: notes, linkedFriendId: item.linkedFriendId, isPending: true, isHidden: false
            });
            await supabaseClient.from('user_messages').insert({
                sender_id: currentUser.id, receiver_id: item.linkedFriendId, type: 'repay_request',
                payload: { sourceId: repayId, targetDebtId: item.targetDebtId || id, amount: amt, notes: notes }
            });
            showToast("還款/收款請求已發送給對方，等待對方確認！");
        } else {
            item.remaining = Math.round(rem - amt);
            state.finances.unshift({
                id: "fin_repay_" + Date.now(), targetDebtId: id, date, type: item.type === "receivable" ? "income" : "expense",
                parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他", subCat: "還款", amount: amt, notes: notes,
                linkedFriendId: item.linkedFriendId, isPending: false, isHidden: false
            });
            showToast("還款紀錄已建立！");
        }

        saveToStorage(); 
        renderFinances(); 
        closeModal("repay-modal");
    } catch (e) {
        console.error("還款處理失敗:", e);
        showToast("還款處理失敗", "error");
    }
}

async function deleteFinanceRecord(id) {
    const target = state.finances.find(f => f.id === id); 
    if (!target) return;
    
    const isShared = !!(target.linkedFriendId || target.targetDebtId);
    const isCreditor = target.type === 'receivable' || (target.type === 'income' && target.subCat === '還款');

    if (isShared && !isCreditor && target.subCat !== "還款") {
        showToast("只有應收方可以發起刪除主借款紀錄！", "error");
        return;
    }

    try {
        if (target.subCat === "還款") {
            if (target.isPending) {
                state.finances = state.finances.filter(f => f.id !== id);
                saveToStorage(); 
                renderFinances();
                return;
            } else if (target.linkedFriendId && currentUser) {
                if (!confirm("此為連線還款紀錄，確定發送刪除請求？")) return;
                await supabaseClient.from('user_messages').insert({
                    sender_id: currentUser.id, receiver_id: target.linkedFriendId, type: 'delete_repay_request',
                    payload: { sourceId: target.sharedId || target.id, targetDebtId: target.targetDebtId, amount: target.amount }
                });
                showToast("已發送還款刪除請求，待對方同意後同步刪除！");
                return;
            }
        } else if (isShared && isCreditor && target.linkedFriendId && currentUser) {
             if (!confirm("此為連線紀錄，確定發送刪除請求？（將連帶刪除相關還款紀錄）")) return;
             await supabaseClient.from('user_messages').insert({
                 sender_id: currentUser.id, receiver_id: target.linkedFriendId, type: 'delete_request',
                 payload: { sourceId: id, targetDebtId: target.targetDebtId, amount: target.amount }
             });
             showToast("已發送刪除請求，待對方同意後同步刪除！");
             return;
        } else {
            if (target.type === "receivable" || target.type === "payable") { 
                const relatedRepayments = state.finances.filter(f => f.targetDebtId === id); 
                if (relatedRepayments.length > 0) { 
                    if (!confirm("此紀錄包含已還款紀錄，確定要連帶刪除嗎？")) return; 
                    state.finances = state.finances.filter(f => f.targetDebtId !== id); 
                } else { 
                    if (!confirm("確定刪除此紀錄？")) return; 
                } 
            } else { 
                if (!confirm("確定刪除此紀錄？")) return; 
            }
        }

        if (target.subCat === "還款" && target.targetDebtId) { 
            const m = state.finances.find(f => f.id === target.targetDebtId); 
            if (m && m.remaining !== undefined) m.remaining = Math.round(m.remaining + target.amount); 
        }

        state.finances = state.finances.filter(f => f.id !== id); 
        saveToStorage(); 
        renderFinances();
        showToast("已刪除紀錄");
    } catch (e) {
        console.error("刪除紀錄失敗:", e);
        showToast("刪除失敗", "error");
    }
}

function renderFinances() {
    const tbody = document.getElementById("finance-body"); 
    const selectedMonth = document.getElementById("fin-month-filter").value;
    const sortOrder = document.getElementById("fin-sort-order").value; 
    let tE = 0, tI = 0, tR = 0, tP = 0;
    
    (state.finances || []).forEach((item) => { 
        if (item.isPending) return; 
        const amt = Number(item.amount || 0);
        const rem = item.remaining !== undefined ? item.remaining : amt;
        const mo = (item.date || '').slice(0, 7); 
        
        if (item.type === "receivable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) tR += rem; 
        if (item.type === "payable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) tP += rem; 
        
        if (item.isHidden && !state.showHiddenItems) return; 
        if (selectedMonth && mo !== selectedMonth) return; 
        
        if (item.type === "expense") tE += amt; 
        if (item.type === "income") tI += amt; 
    });
    
    const chips = document.getElementById("finance-filter-chips"); 
    let chipsHtml = `<div class="finance-chip ${financeActiveMode === "all" ? "active" : ""}" onclick="setFinanceAllMode('all')">全部類型</div>`; 
    const cats = getCategories(); 
    
    if (financeActiveMode.startsWith("all")) { 
        Object.keys(cats).forEach(k => getCategoryKeys(k).forEach(p => {
            chipsHtml += `<div class="finance-chip" onclick="selectFinanceMainCategory('${escapeJS(p)}')">${escapeHtml(p)}</div>`;
        })); 
    } else { 
        chipsHtml += `<div class="finance-chip" style="background:var(--primary);color:#fff;" onclick="setFinanceAllMode('all')">◀ 返回</div>
                      <div class="finance-chip ${financeActiveSubCat === "all" ? "active" : ""}" onclick="selectFinanceSubCategory('all')">全部 (${escapeHtml(financeActiveMainCat)})</div>`; 
        let subs = []; 
        Object.values(cats).forEach(t => { 
            if (t[financeActiveMainCat]) subs = t[financeActiveMainCat]; 
        }); 
        subs.forEach(s => {
            chipsHtml += `<div class="finance-chip ${financeActiveSubCat === s ? "active" : ""}" onclick="selectFinanceSubCategory('${escapeJS(s)}')">${escapeHtml(s)}</div>`;
        }); 
    } 
    chips.innerHTML = chipsHtml;
    
    const lbls = { 
        expense: { n: "支出", c: "tag-expense" }, 
        income: { n: "收入", c: "tag-income" }, 
        transfer: { n: "轉帳", c: "tag-paid" }, 
        receivable: { n: "應收", c: "tag-receivable" }, 
        payable: { n: "應付", c: "tag-payable" } 
    }; 
    
    const filteredFinances = state.finances.filter(i => { 
        if (i.isPending) return false; 
        if (i.isHidden && !state.showHiddenItems) return false; 
        const mo = (i.date||'').slice(0,7);
        const rem = i.remaining !== undefined ? i.remaining : i.amount; 
        
        if (i.type === "receivable" || i.type === "payable") { 
            if (rem === 0 && selectedMonth && mo !== selectedMonth) return false; 
        } else { 
            if (selectedMonth && mo !== selectedMonth) return false; 
        } 
        
        if (financeActiveMode === "all_expense" && i.type !== "expense") return false; 
        if (financeActiveMode === "all_income" && i.type !== "income") return false; 
        if (financeActiveMode === "all_receivable" && i.type !== "receivable") return false; 
        if (financeActiveMode === "all_payable" && i.type !== "payable") return false; 
        if (financeActiveMode === "main" && (i.parentCat !== financeActiveMainCat || (financeActiveSubCat !== "all" && i.subCat !== financeActiveSubCat))) return false; 
        if (financeActiveMode === "sub" && i.subCat !== financeActiveSubCat) return false; 
        return true; 
    }).sort((a,b) => sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));

    const fragment = document.createDocumentFragment();
    if (filteredFinances.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" style="text-align:center; padding:12px;">無紀錄</td>`;
        fragment.appendChild(tr);
    } else {
        filteredFinances.forEach(i => {
            const amt = Number(i.amount);
            const rem = i.remaining !== undefined ? i.remaining : amt;
            const tl = lbls[i.type]; 
            const isShared = !!(i.linkedFriendId || i.targetDebtId);
            const isCreditor = i.type === 'receivable' || (i.type === 'income' && i.subCat === '還款');

            let ex = "";
            if ((i.type === "receivable" || i.type === "payable") && rem > 0) { 
                ex += `<button class="btn btn-warning" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openRepayModal('${i.id}')">還款</button>`; 
            } 
            ex += `<button class="btn ${i.isHidden?'btn-secondary':'btn-warning'}" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="toggleRecordHidden('${i.id}')">${i.isHidden?'解除隱藏':'隱藏'}</button>`;
            
            if (!isShared || isCreditor) {
                ex += `<button class="btn btn-secondary" style="padding:2px 4px; font-size:0.68rem; margin-right:3px;" onclick="openFinanceModal('${i.id}')">編輯</button>
                       <button class="btn btn-danger" style="padding:2px 4px; font-size:0.68rem;" onclick="deleteFinanceRecord('${i.id}')">刪除</button>`;
            }

            const dAmt = `${(i.type==='income'||i.type==='receivable')?'+':'-'}$${amt.toLocaleString()}${((i.type==='receivable'||i.type==='payable')&&rem>0)?` (未結:$${rem})`:''}`; 
            
            const tr = document.createElement("tr");
            tr.style.cssText = i.isHidden ? 'opacity:0.55;' : '';
            tr.innerHTML = `<td>${i.date}</td>
                            <td><span class="${tl.c}">${tl.n}</span></td>
                            <td><strong>${escapeHtml(i.parentCat)}</strong> <span style="color:var(--text-muted);">/ ${escapeHtml(i.subCat)}</span> ${i.isHidden?'<span class="tag-hidden">已隱藏</span>':''}</td>
                            <td><strong style="color:${(i.type==='income'||i.type==='receivable')?'#10b981':'#ef4444'};">${dAmt}</strong></td>
                            <td>${escapeHtml(i.notes||"-")}</td>
                            <td>${ex}</td>`;
            fragment.appendChild(tr);
        });
    }

    tbody.innerHTML = "";
    tbody.appendChild(fragment);
    
    document.getElementById("fin-stat-expense").innerText = `$${tE.toLocaleString()}`; 
    document.getElementById("fin-stat-income").innerText = `$${tI.toLocaleString()}`; 
    document.getElementById("fin-stat-receivable").innerText = `$${tR.toLocaleString()}`; 
    document.getElementById("fin-stat-payable").innerText = `$${tP.toLocaleString()}`; 
    document.getElementById("fin-stat-balance").innerText = `$${(tI - tE).toLocaleString()}`; 
    document.getElementById("fin-stat-balance").style.color = (tI - tE) >= 0 ? "#10b981" : "#ef4444";
    
    if (isExpenseChartVisible) renderChartData();
}

// 類別與固定收支管理
function openRecurringModal() { 
    const listEl = document.getElementById("recurring-list"); 
    listEl.innerHTML = ""; 
    const fragment = document.createDocumentFragment();
    
    (state.recurringFinances || []).forEach(item => { 
        const el = document.createElement("div"); 
        el.className = "recurring-manage-item"; 
        el.innerHTML = `<div>
                            <strong style="color:var(--primary);">每月 ${item.dayOfMonth} 日</strong> - [${item.type === 'income' ? '收入' : '支出'}] ${escapeHtml(item.subCat)} ($${item.amount})<br>
                            <span style="font-size:0.65rem; color:var(--text-muted);">${escapeHtml(item.notes)}</span>
                        </div>
                        <div>
                            <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.68rem;" onclick="openAddRecurringModal('${item.id}')">編輯</button> 
                            <button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteRecurringRecord('${item.id}')">刪除</button>
                        </div>`; 
        fragment.appendChild(el); 
    }); 
    
    listEl.appendChild(fragment);
    document.getElementById("recurring-modal").classList.add("active"); 
}

function openAddRecurringModal(id = null) { 
    document.getElementById("rec-edit-id").value = id || ""; 
    if (id) { 
        const item = state.recurringFinances.find(r => r.id === id); 
        document.getElementById("rec-modal-title").innerText = "編輯固定收支"; 
        ["day","type","amount","notes"].forEach(k => {
            document.getElementById(`rec-${k}`).value = item[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || "";
        }); 
        onRecurringTypeChange(); 
        document.getElementById("rec-parent-cat").value = item.parentCat; 
        onRecurringParentCatChange(); 
        document.getElementById("rec-sub-cat").value = item.subCat; 
    } else { 
        document.getElementById("rec-modal-title").innerText = "新增固定收支"; 
        ["day","amount","notes"].forEach(k => document.getElementById(`rec-${k}`).value = ""); 
        document.getElementById("rec-type").value = "expense"; 
        onRecurringTypeChange(); 
    } 
    document.getElementById("recurring-modal").classList.remove("active"); 
    document.getElementById("recurring-edit-modal").classList.add("active"); 
}

function onRecurringTypeChange() { 
    const pSel = document.getElementById("rec-parent-cat"); 
    pSel.innerHTML = ""; 
    getCategoryKeys(document.getElementById("rec-type").value).forEach(p => pSel.appendChild(new Option(p, p))); 
    onRecurringParentCatChange(); 
}

function onRecurringParentCatChange() { 
    const sSel = document.getElementById("rec-sub-cat"); 
    sSel.innerHTML = ""; 
    (getCategories()[document.getElementById("rec-type").value][document.getElementById("rec-parent-cat").value] || []).forEach(s => sSel.appendChild(new Option(s, s))); 
}

function saveRecurringRecord() { 
    const id = document.getElementById("rec-edit-id").value;
    const dayOfMonth = Number(document.getElementById("rec-day").value);
    const type = document.getElementById("rec-type").value;
    const parentCat = document.getElementById("rec-parent-cat").value;
    const subCat = document.getElementById("rec-sub-cat").value;
    const amount = Math.round(Number(document.getElementById("rec-amount").value));
    const notes = document.getElementById("rec-notes").value.trim(); 
    
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31 || !amount) {
        showToast("請正確填寫日期(1~31)與金額！", "error");
        return;
    }
    
    if (!state.recurringFinances) state.recurringFinances = []; 
    const obj = { 
        id: id || "rec_" + Date.now(), 
        dayOfMonth, type, parentCat, subCat, amount, notes, 
        lastTriggeredMonth: id ? state.recurringFinances.find(r=>r.id===id).lastTriggeredMonth : "" 
    }; 
    
    if (id) { 
        const idx = state.recurringFinances.findIndex(r => r.id === id); 
        state.recurringFinances[idx] = obj; 
    } else {
        state.recurringFinances.push(obj); 
    }
    
    saveToStorage(); 
    checkRecurringFinances(); 
    closeModal("recurring-edit-modal"); 
    openRecurringModal();
    showToast("固定收支已儲存"); 
}

function deleteRecurringRecord(id) { 
    if (confirm("確定刪除此設定？")) { 
        state.recurringFinances = state.recurringFinances.filter(r => r.id !== id); 
        saveToStorage(); 
        openRecurringModal(); 
        showToast("已刪除設定");
    } 
}

function openCategoryManageModal() { 
    document.getElementById("cat-manage-type").value = "expense"; 
    renderCategoryManageList(); 
    document.getElementById("category-manage-modal").classList.add("active"); 
}

function resetCategoriesToDefault() { 
    if (confirm("恢復預設？")) { 
        state.customCategories = structuredClone(DEFAULT_CATEGORIES); 
        state.categoryOrder = null; 
        saveToStorage(); 
        renderCategoryManageList(); 
        renderFinances(); 
        showToast("已恢復預設類別");
    } 
}

function renderCategoryManageList() { 
    const t = document.getElementById("cat-manage-type").value;
    const list = document.getElementById("cat-manage-list");
    const cats = getCategories()[t] || {}; 
    let listHtml = ""; 
    
    getCategoryKeys(t).forEach((p, pi) => { 
        listHtml += `<div style="font-weight:700; font-size:0.80rem; padding:6px; background:var(--table-th-bg); margin-top:4px; display:flex; justify-content:space-between;">
                        <span>${escapeHtml(p)}</span>
                        <div>
                            <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${escapeJS(t)}',${pi},-1)">▲主</button> 
                            <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveMain('${escapeJS(t)}',${pi},1)">▼主</button>
                        </div>
                     </div>`; 
        (cats[p] || []).forEach((s, si) => { 
            listHtml += `<div class="cat-manage-item">
                            <span>└ ${escapeHtml(s)}</span>
                            <div class="cat-manage-actions">
                                <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${escapeJS(t)}','${escapeJS(p)}',${si},-1)">▲</button> 
                                <button class="btn btn-secondary" style="padding:1px 4px; font-size:0.62rem;" onclick="catMoveSub('${escapeJS(t)}','${escapeJS(p)}',${si},1)">▼</button> 
                                <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMoveModal('${escapeJS(t)}','${escapeJS(p)}',${si})">搬移</button> 
                                <button class="btn btn-warning" style="padding:1px 4px; font-size:0.62rem;" onclick="openCatMergeModal('${escapeJS(t)}','${escapeJS(p)}',${si})">合併</button> 
                                <button class="btn btn-danger" style="padding:1px 4px; font-size:0.62rem;" onclick="catDelete('${escapeJS(t)}','${escapeJS(p)}',${si})">刪</button>
                            </div>
                         </div>`; 
        }); 
    }); 
    list.innerHTML = listHtml; 
}

function catMoveMain(t, i, d) { 
    const k = getCategoryKeys(t);
    const ti = i + d; 
    if (ti < 0 || ti >= k.length) return; 
    const m = k[i]; 
    k.splice(i, 1); 
    k.splice(ti, 0, m); 
    state.categoryOrder[t] = k; 
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
}

function catMoveSub(t, p, i, d) { 
    const c = getCategories();
    const l = c[t][p];
    const ti = i + d; 
    if (ti < 0 || ti >= l.length) return; 
    const tmp = l[i]; 
    l[i] = l[ti]; 
    l[ti] = tmp; 
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
}

function openAddMainCategoryModal() { 
    document.getElementById("cat-add-main-name").value = ""; 
    document.getElementById("cat-add-main-modal").classList.add("active"); 
}

function confirmAddMainCategory() { 
    const t = document.getElementById("cat-manage-type").value;
    const n = `${document.getElementById("cat-add-main-icon").value} ${document.getElementById("cat-add-main-name").value.trim()}`;
    const c = getCategories(); 
    
    if (!n.trim() || c[t][n]) return; 
    c[t][n] = ["一般項目"]; 
    
    if (!state.categoryOrder) state.categoryOrder = {}; 
    if (!state.categoryOrder[t]) state.categoryOrder[t] = Object.keys(c[t]); 
    if (!state.categoryOrder[t].includes(n)) state.categoryOrder[t].push(n); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    closeModal("cat-add-main-modal"); 
}

function openAddSubCategoryModal() { 
    const t = document.getElementById("cat-manage-type").value;
    const sel = document.getElementById("cat-add-sub-parent"); 
    sel.innerHTML = ""; 
    getCategoryKeys(t).forEach(p => sel.appendChild(new Option(p,p))); 
    document.getElementById("cat-add-sub-name").value = ""; 
    document.getElementById("cat-add-sub-modal").classList.add("active"); 
}

function confirmAddSubCategory() { 
    const t = document.getElementById("cat-manage-type").value;
    const p = document.getElementById("cat-add-sub-parent").value;
    const n = document.getElementById("cat-add-sub-name").value.trim();
    const c = getCategories(); 
    
    if (!n || !c[t][p] || c[t][p].includes(n)) return; 
    c[t][p].push(n); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    closeModal("cat-add-sub-modal"); 
}

function openCatMoveModal(t, p, i) { 
    activeCatTask = {t, p, i, s: getCategories()[t][p][i]}; 
    const sel = document.getElementById("cat-move-select"); 
    sel.innerHTML = ""; 
    getCategoryKeys(t).filter(x => x !== p).forEach(x => sel.appendChild(new Option(x, x))); 
    document.getElementById("cat-move-modal").classList.add("active"); 
}

function confirmCatMove() { 
    const tp = document.getElementById("cat-move-select").value; 
    const {t, p, i, s} = activeCatTask; 
    const c = getCategories(); 
    
    (state.finances || []).forEach(f => { 
        if (f.type === t && f.parentCat === p && f.subCat === s) f.parentCat = tp; 
    }); 
    (state.recurringFinances || []).forEach(r => { 
        if (r.type === t && r.parentCat === p && r.subCat === s) r.parentCat = tp; 
    }); 
    c[t][p].splice(i, 1); 
    c[t][tp].push(s); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
    closeModal("cat-move-modal"); 
}

function openCatMergeModal(t, p, i) { 
    activeCatTask = {t, p, i, s: getCategories()[t][p][i]}; 
    const sel = document.getElementById("cat-merge-select"); 
    sel.innerHTML = ""; 
    getCategories()[t][p].filter((_, x) => x !== i).forEach(x => sel.appendChild(new Option(x, x))); 
    document.getElementById("cat-merge-modal").classList.add("active"); 
}

function confirmCatMerge() { 
    const ts = document.getElementById("cat-merge-select").value;
    const {t, p, i, s} = activeCatTask;
    const c = getCategories(); 
    
    state.finances.forEach(f => {
        if (f.parentCat === p && f.subCat === s) f.subCat = ts;
    }); 
    (state.recurringFinances || []).forEach(r => {
        if (r.parentCat === p && r.subCat === s) r.subCat = ts;
    }); 
    c[t][p].splice(i, 1); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
    closeModal("cat-merge-modal"); 
}

function catDelete(t, p, i) { 
    if (confirm("刪除此子類別？")) { 
        getCategories()[t][p].splice(i, 1); 
        saveToStorage(); 
        renderCategoryManageList(); 
        renderFinances(); 
    } 
}

// 關閉 Modal
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("active"); 
}

window.addEventListener('click', function(event) { 
    if (event.target.classList.contains('modal')) { 
        closeModal(event.target.id); 
    } 
});

// 程式進入點
init();