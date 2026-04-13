// ═══════════════════════════════════════════════════════════
// auth.js — 共享认证模块，所有页面引用
// ═══════════════════════════════════════════════════════════

const Auth = (() => {
    const TOKEN_KEY = 'aicolab_token';
    const USER_KEY = 'aicolab_user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        try {
            const data = localStorage.getItem(USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }

    function saveAuth(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function isLoggedIn() {
        return !!getToken();
    }

    function normalizeApiError(data, fallback) {
        if (!data) return fallback;
        const detail = data.detail;
        if (!detail) return fallback;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            const first = detail[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object') {
                if (typeof first.msg === 'string') return first.msg;
                if (Array.isArray(first.loc) && first.loc.length > 0 && typeof first.msg === 'string') {
                    return `${first.loc.join('.')}：${first.msg}`;
                }
                return JSON.stringify(first);
            }
        }
        if (typeof detail === 'object') {
            if (typeof detail.msg === 'string') return detail.msg;
            return JSON.stringify(detail);
        }
        return fallback;
    }

    /**
     * 带认证的 fetch 封装
     * 自动添加 Authorization header，自动处理 401
     */
    async function apiCall(url, options = {}) {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const resp = await fetch(url, { ...options, headers });
        if (resp.status === 401) {
            clearAuth();
            showAuthModal();
            throw new Error('未登录或登录已过期');
        }
        return resp;
    }

    /** 注册 */
    async function register(username, displayName, password) {
        const resp = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, display_name: displayName, password }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(normalizeApiError(data, '注册失败'));
        saveAuth(data.access_token, data.user);
        return data.user;
    }

    /** 登录 */
    async function login(username, password) {
        const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(normalizeApiError(data, '登录失败'));
        saveAuth(data.access_token, data.user);
        return data.user;
    }

    function logout() {
        clearAuth();
        location.reload();
    }

    // ── 登录/注册模态框 ──────────────────────────────────
    function showAuthModal() {
        if (document.getElementById('auth-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[200]';
        modal.style.backdropFilter = 'blur(4px)';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onclick="event.stopPropagation()">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <i class="fa-solid fa-layer-group text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold">AI Co-Lab</h3>
                            <p class="text-xs text-blue-100">登录以开始多AI协作研讨</p>
                        </div>
                    </div>
                    <!-- Tab 切换 -->
                    <div class="flex mt-4 gap-2">
                        <button id="tab-login" onclick="Auth._switchTab('login')" class="flex-1 py-2 rounded-lg text-sm font-semibold bg-white/20">登录</button>
                        <button id="tab-register" onclick="Auth._switchTab('register')" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition">注册</button>
                    </div>
                </div>

                <div class="p-6 space-y-4">
                    <div id="auth-error" class="hidden bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200"></div>

                    <!-- 注册时显示 -->
                    <div id="field-display-name" class="hidden space-y-1">
                        <label class="text-sm font-semibold text-slate-600">昵称</label>
                        <input type="text" id="auth-display-name" placeholder="你的显示名称" class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm">
                    </div>

                    <div class="space-y-1">
                        <label class="text-sm font-semibold text-slate-600">用户名</label>
                        <input type="text" id="auth-username" placeholder="输入用户名" class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" onkeydown="if(event.key==='Enter')Auth._submit()">
                    </div>

                    <div class="space-y-1">
                        <label class="text-sm font-semibold text-slate-600">密码</label>
                        <input type="password" id="auth-password" placeholder="输入密码" class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" onkeydown="if(event.key==='Enter')Auth._submit()">
                    </div>

                    <button id="auth-submit-btn" onclick="Auth._submit()" class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-right-to-bracket"></i> 登录
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('auth-username').focus();
    }

    let _currentTab = 'login';

    function _switchTab(tab) {
        _currentTab = tab;
        const loginBtn = document.getElementById('tab-login');
        const regBtn = document.getElementById('tab-register');
        const displayField = document.getElementById('field-display-name');
        const submitBtn = document.getElementById('auth-submit-btn');
        const errEl = document.getElementById('auth-error');
        errEl.classList.add('hidden');

        if (tab === 'login') {
            loginBtn.className = 'flex-1 py-2 rounded-lg text-sm font-semibold bg-white/20';
            regBtn.className = 'flex-1 py-2 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition';
            displayField.classList.add('hidden');
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> 登录';
        } else {
            regBtn.className = 'flex-1 py-2 rounded-lg text-sm font-semibold bg-white/20';
            loginBtn.className = 'flex-1 py-2 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition';
            displayField.classList.remove('hidden');
            submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 注册';
        }
    }

    async function _submit() {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const displayName = document.getElementById('auth-display-name').value.trim();
        const errEl = document.getElementById('auth-error');
        const btn = document.getElementById('auth-submit-btn');

        if (!username || !password) {
            errEl.textContent = '请填写用户名和密码';
            errEl.classList.remove('hidden');
            return;
        }

        if (_currentTab === 'register') {
            if (username.length < 2) {
                errEl.textContent = '用户名至少 2 个字符';
                errEl.classList.remove('hidden');
                return;
            }
            if ((displayName || username).length < 1) {
                errEl.textContent = '昵称不能为空';
                errEl.classList.remove('hidden');
                return;
            }
            if (password.length < 6) {
                errEl.textContent = '密码至少 6 位';
                errEl.classList.remove('hidden');
                return;
            }
        }

        btn.disabled = true;
        btn.innerHTML = '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> 处理中...';

        try {
            if (_currentTab === 'register') {
                await register(username, displayName || username, password);
            } else {
                await login(username, password);
            }
            // 成功 — 移除模态框，刷新页面
            document.getElementById('auth-modal').remove();
            if (typeof onAuthSuccess === 'function') {
                onAuthSuccess(getUser());
            } else {
                location.reload();
            }
        } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = _currentTab === 'login'
                ? '<i class="fa-solid fa-right-to-bracket"></i> 登录'
                : '<i class="fa-solid fa-user-plus"></i> 注册';
        }
    }

    // ── 页面初始化检查 ───────────────────────────────────
    function requireAuth() {
        if (!isLoggedIn()) {
            showAuthModal();
            return false;
        }
        return true;
    }

    /**
     * 更新侧栏底部的用户信息显示
     * 需要页面中有 id="user-profile-name" 和 id="user-profile-avatar" 元素
     */
    function updateUserUI() {
        const user = getUser();
        if (!user) return;
        const nameEl = document.getElementById('user-profile-name');
        if (nameEl) nameEl.textContent = user.display_name;
        const avatarEl = document.getElementById('user-profile-avatar');
        if (avatarEl) avatarEl.textContent = user.avatar || user.display_name[0];
    }

    return {
        getToken, getUser, saveAuth, clearAuth, isLoggedIn,
        apiCall, register, login, logout,
        showAuthModal, requireAuth, updateUserUI,
        _switchTab, _submit,
    };
})();
