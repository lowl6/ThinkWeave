// ═══════════════════════════════════════════════════════════
// storage.js — 作用域隔离的 localStorage 存储工具
// 所有 key 按 userId + roomId 隔离，避免跨用户数据泄漏
// ═══════════════════════════════════════════════════════════

const ScopedStorage = (() => {
    /** 获取当前用户 ID，未登录返回 'guest' */
    function _uid() {
        try {
            const u = Auth.getUser();
            return u ? u.id : 'guest';
        } catch { return 'guest'; }
    }

    /** 拼接存储 key: prefix_userId_roomId */
    function _key(prefix, roomId) {
        const uid = _uid();
        return roomId ? `${prefix}_${uid}_${roomId}` : `${prefix}_${uid}`;
    }

    // ── 聊天历史 ─────────────────────────────────────────
    function loadHistory() {
        try {
            const data = localStorage.getItem(_key('tw_history'));
            return data ? JSON.parse(data) : {};
        } catch { return {}; }
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(_key('tw_history'), JSON.stringify(history));
        } catch { /* storage full */ }
    }

    // ── 已采纳意见 ──────────────────────────────────────
    function loadAdopted(roomId) {
        try {
            const k = roomId ? _key('tw_adopted', roomId) : _key('tw_adopted');
            const data = localStorage.getItem(k);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    function saveAdopted(opinions, roomId) {
        try {
            const k = roomId ? _key('tw_adopted', roomId) : _key('tw_adopted');
            localStorage.setItem(k, JSON.stringify(opinions));
        } catch {}
    }

    // ── AI 队友配置 ──────────────────────────────────────
    function loadAIMembers(roomId) {
        try {
            const k = roomId ? _key('tw_ai_members', roomId) : _key('tw_ai_members');
            const data = localStorage.getItem(k);
            return data ? JSON.parse(data) : null; // null = 使用默认
        } catch { return null; }
    }

    function saveAIMembers(members, roomId) {
        try {
            const k = roomId ? _key('tw_ai_members', roomId) : _key('tw_ai_members');
            localStorage.setItem(k, JSON.stringify(members));
        } catch {}
    }

    // ── ThinkLet 共享数据（采纳意见传递给 ThinkLet 页面）──
    function loadSharedIdeas(roomId) {
        try {
            const k = roomId ? _key('tw_shared_ideas', roomId) : _key('tw_shared_ideas');
            const data = localStorage.getItem(k);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    function saveSharedIdeas(ideas, roomId) {
        try {
            const k = roomId ? _key('tw_shared_ideas', roomId) : _key('tw_shared_ideas');
            localStorage.setItem(k, JSON.stringify(ideas));
        } catch {}
    }

    // ── 通用 get/set ────────────────────────────────────
    function get(prefix, roomId) {
        try {
            const data = localStorage.getItem(_key(prefix, roomId));
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }

    function set(prefix, value, roomId) {
        try {
            localStorage.setItem(_key(prefix, roomId), JSON.stringify(value));
        } catch {}
    }

    return {
        loadHistory, saveHistory,
        loadAdopted, saveAdopted,
        loadAIMembers, saveAIMembers,
        loadSharedIdeas, saveSharedIdeas,
        get, set,
    };
})();
