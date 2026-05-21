// ═══════════════════════════════════════════════════════════
// storage.js — 作用域隔离的 localStorage 存储工具
// 所有 key 按 userId + roomId 隔离，避免跨用户数据泄漏
// 房间共享数据不带 userId，同一房间所有成员读写同一份
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

    /** 房间共享 key: tw_roomshared_{suffix}_{roomId}（不含 userId） */
    function _sharedKey(suffix, roomId) {
        if (!roomId) return null;
        return `tw_roomshared_${suffix}_${roomId}`;
    }

    /** 同标签页内通知（storage 事件仅在其它文档触发）。
     *  改为异步派发：避免本页 _writeShared 写入后立刻同步触发本页监听器，
     *  与之后的 window.location.href 跳转发生竞争（典型场景：
     *  WorkflowNav.completeCurrentStepAndGoNext 写 timeline → 同步监听器
     *  调用 location.reload() → 紧接着 navigateTo 设 location.href，Chrome 会
     *  优先执行先调用的 reload，把页面刷回当前环节，导致"确认后不进入下一房间"）。
     *  异步派发后，若本次同步段内发生跳转，浏览器会在派发执行前开始卸载页面，
     *  事件被自然丢弃；若未跳转，事件在当前任务结束后立即派发，本页面 UI 仍能正常同步。 */
    function _notifyRoomShared(suffix, roomId) {
        if (!roomId) return;
        setTimeout(() => {
            try {
                window.dispatchEvent(new CustomEvent('tw-roomshared', { detail: { suffix, roomId } }));
            } catch { /* ignore */ }
        }, 0);
    }

    // ──────────────────────────────────────────────────────────
    // 后端共享状态（跨用户、跨设备真正共享）
    // 内存缓存 + 定时轮询：localStorage 仅作为同浏览器的快缓
    //
    // _remoteCache[roomId][suffix] = { value, version }
    // 轮询周期（ms）；写入时立即 POST，并把响应 version 写回缓存
    // ──────────────────────────────────────────────────────────
    const _remoteCache = {};
    const _pollState = {}; // roomId -> { timer, started }
    const _POLL_INTERVAL_MS = 2500;

    function _hasAuth() {
        try { return typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn(); }
        catch { return false; }
    }

    function _cacheGet(roomId, suffix) {
        if (!roomId) return undefined;
        const room = _remoteCache[roomId];
        if (!room) return undefined;
        return room[suffix];
    }

    function _cacheSet(roomId, suffix, value, version) {
        if (!roomId) return;
        if (!_remoteCache[roomId]) _remoteCache[roomId] = {};
        _remoteCache[roomId][suffix] = { value, version: version || 0 };
    }

    /** 从后端 PUT 一个共享键。返回 Promise<{value, version}>。失败时 reject。 */
    function _putRemote(roomId, suffix, value) {
        if (!roomId || !_hasAuth()) return Promise.reject(new Error('no auth'));
        return Auth.apiCall(`/api/rooms/${roomId}/state/${encodeURIComponent(suffix)}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
        }).then(r => {
            if (!r.ok) throw new Error('put state failed: ' + r.status);
            return r.json();
        }).then(data => {
            _cacheSet(roomId, data.key || suffix, data.value, data.version);
            return data;
        });
    }

    /** 从后端 GET 一个共享键。返回 Promise<value | null>。 */
    function _getRemote(roomId, suffix) {
        if (!roomId || !_hasAuth()) return Promise.resolve(null);
        return Auth.apiCall(`/api/rooms/${roomId}/state/${encodeURIComponent(suffix)}`)
            .then(r => {
                if (r.status === 404) return null;
                if (!r.ok) throw new Error('get state failed: ' + r.status);
                return r.json();
            })
            .then(data => {
                if (!data) return null;
                _cacheSet(roomId, suffix, data.value, data.version);
                return data.value;
            })
            .catch(() => null);
    }

    /** 列出后端所有键（含 version）。返回 Promise<Array<{key, value, version}>>。 */
    function _listRemote(roomId) {
        if (!roomId || !_hasAuth()) return Promise.resolve([]);
        return Auth.apiCall(`/api/rooms/${roomId}/state`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);
    }

    /**
     * 启动房间共享数据的轮询。同一 roomId 只启动一次。
     * 拉取后会更新缓存，并对版本变化的 key 派发 'tw-roomshared'。
     */
    function startRoomSharedPoll(roomId) {
        if (!roomId || !_hasAuth()) return;
        if (_pollState[roomId] && _pollState[roomId].started) return;
        _pollState[roomId] = { started: true, timer: null };

        // 首轮立即拉一次完整数据，填充缓存并触发渲染
        _refreshAll(roomId);

        const tick = async () => {
            try {
                await _refreshAll(roomId);
            } catch { /* ignore */ }
            _pollState[roomId].timer = setTimeout(tick, _POLL_INTERVAL_MS);
        };
        _pollState[roomId].timer = setTimeout(tick, _POLL_INTERVAL_MS);
    }

    function stopRoomSharedPoll(roomId) {
        const st = _pollState[roomId];
        if (st && st.timer) {
            clearTimeout(st.timer);
            st.timer = null;
            st.started = false;
        }
    }

    /** 拉取房间所有共享键，对比缓存版本，仅对值真正变化的 key 派发事件。
     *  注意：版本号不同不代表值不同（首轮拉取 prev=undefined 时尤其明显），
     *  因此必须用 JSON 字符串与 localStorage 中已有快缓做比对，否则会触发
     *  「首轮假事件 → onTimelineChange → reload → 又是首轮」死循环。 */
    async function _refreshAll(roomId) {
        const list = await _listRemote(roomId);
        const room = _remoteCache[roomId] || (_remoteCache[roomId] = {});
        for (const item of list) {
            const prev = room[item.key];
            const prevVer = prev ? prev.version : -1;
            if (item.version === prevVer) continue;

            const newJson = JSON.stringify(item.value);
            let oldJson = null;
            try {
                const k = _sharedKey(item.key, roomId);
                if (k) oldJson = localStorage.getItem(k);
            } catch {}

            room[item.key] = { value: item.value, version: item.version };
            try {
                const k = _sharedKey(item.key, roomId);
                if (k) localStorage.setItem(k, newJson);
            } catch {}

            if (oldJson !== newJson) _notifyRoomShared(item.key, roomId);
        }
    }

    // ── 聊天历史（用户私有）─────────────────────────────────────
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

    // ── 通用：先读缓存，再回退 localStorage（同步） ──────────────
    function _readShared(suffix, roomId, fallbackKey, defaultVal) {
        if (roomId) {
            const cached = _cacheGet(roomId, suffix);
            if (cached !== undefined) return cached.value !== undefined ? cached.value : defaultVal;
            try {
                const shared = localStorage.getItem(_sharedKey(suffix, roomId));
                if (shared !== null) return JSON.parse(shared);
            } catch {}
        }
        try {
            const data = localStorage.getItem(fallbackKey);
            if (data !== null) return JSON.parse(data);
        } catch {}
        return defaultVal;
    }

    /** 通用：写本地快缓 + 同步派发 + 异步 PUT 到后端。
     *  与缓存值完全相同时跳过 PUT，避免 syncRoomFromApi 触发的回写造成跨标签事件循环。
     */
    function _writeShared(suffix, value, roomId, fallbackKey) {
        let newJson = '';
        try { newJson = JSON.stringify(value); } catch { newJson = ''; }
        if (roomId) {
            const prev = _cacheGet(roomId, suffix);
            let prevJson = '';
            if (prev) { try { prevJson = JSON.stringify(prev.value); } catch {} }
            try { localStorage.setItem(_sharedKey(suffix, roomId), newJson); } catch {}
            if (prev && prevJson === newJson) {
                try { localStorage.setItem(fallbackKey, newJson); } catch {}
                return;
            }
            _cacheSet(roomId, suffix, value, prev ? prev.version : 0);
            _notifyRoomShared(suffix, roomId);
            _putRemote(roomId, suffix, value).catch(() => {});
        }
        try { localStorage.setItem(fallbackKey, newJson); } catch {}
    }

    // ── AI 队友配置（房间共享）─────────────────────────────────────
    function loadAIMembers(roomId) {
        const fallbackKey = roomId ? _key('tw_ai_members', roomId) : _key('tw_ai_members');
        return _readShared('ai_members', roomId, fallbackKey, null);
    }

    function saveAIMembers(members, roomId) {
        const fallbackKey = roomId ? _key('tw_ai_members', roomId) : _key('tw_ai_members');
        _writeShared('ai_members', members, roomId, fallbackKey);
    }

    // ── ThinkLet 共享数据（房间共享）──────────────────────────────────
    function loadSharedIdeas(roomId) {
        const fallbackKey = roomId ? _key('tw_shared_ideas', roomId) : _key('tw_shared_ideas');
        return _readShared('ideas', roomId, fallbackKey, []);
    }

    function saveSharedIdeas(ideas, roomId) {
        const fallbackKey = roomId ? _key('tw_shared_ideas', roomId) : _key('tw_shared_ideas');
        _writeShared('ideas', ideas, roomId, fallbackKey);
    }

    // ── 头脑风暴聊天记录（房间共享）──────────────────────────────────
    function loadBrainstormChat(roomId) {
        const fallbackKey = roomId ? _key('tw_bs_chat', roomId) : _key('tw_bs_chat');
        return _readShared('bs_chat', roomId, fallbackKey, []);
    }

    function saveBrainstormChat(chat, roomId) {
        const fallbackKey = roomId ? _key('tw_bs_chat', roomId) : _key('tw_bs_chat');
        _writeShared('bs_chat', chat, roomId, fallbackKey);
    }

    // ── 头脑风暴灵感池（房间共享）──────────────────────────────────
    function loadBrainstormIdeas(roomId) {
        const fallbackKey = roomId ? _key('tw_bs_ideas', roomId) : _key('tw_bs_ideas');
        return _readShared('bs_ideas', roomId, fallbackKey, []);
    }

    function saveBrainstormIdeas(ideas, roomId) {
        const fallbackKey = roomId ? _key('tw_bs_ideas', roomId) : _key('tw_bs_ideas');
        _writeShared('bs_ideas', ideas, roomId, fallbackKey);
    }

    // ── 步骤结果（房间共享）──────────────────────────────────
    function loadStepResult(stepIndex, roomId) {
        const fallbackKey = _key('tw_step_result_' + stepIndex, roomId);
        return _readShared(`step_${stepIndex}`, roomId, fallbackKey, null);
    }

    function saveStepResult(stepIndex, result, roomId) {
        const fallbackKey = _key('tw_step_result_' + stepIndex, roomId);
        _writeShared(`step_${stepIndex}`, result, roomId, fallbackKey);
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

    // ── 房间内协作共享（不含 userId，同一房间所有成员读写同一份）────────
    /** @param {string} suffix 短标识，如 timeline、step_timer、bs_chat、bs_ideas */
    function getRoomShared(suffix, roomId) {
        if (!roomId) return null;
        const cached = _cacheGet(roomId, suffix);
        if (cached !== undefined) return cached.value;
        try {
            const k = _sharedKey(suffix, roomId);
            if (!k) return null;
            const data = localStorage.getItem(k);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }

    function setRoomShared(suffix, value, roomId) {
        if (!roomId) return;
        const fallbackKey = _key('tw_roomshared_local_' + suffix, roomId);
        _writeShared(suffix, value, roomId, fallbackKey);
    }

    // ── 监听跨标签页数据变化 ────────────────────────────────────
    /**
     * 监听房间共享数据变化（跨标签页同步）
     * @param {string} suffix 数据标识（如 bs_chat、bs_ideas、timeline）
     * @param {string} roomId 房间 ID
     * @param {function} callback 变化时的回调函数 (newValue) => void
     */
    function watchRoomShared(suffix, roomId, callback) {
        if (!roomId || typeof callback !== 'function') return;
        const expectedKey = _sharedKey(suffix, roomId);
        if (!expectedKey) return;

        window.addEventListener('storage', (e) => {
            if (e.key === expectedKey && e.newValue !== null) {
                try {
                    const data = JSON.parse(e.newValue);
                    callback(data);
                } catch {
                    callback(e.newValue);
                }
            }
        });
    }

    /**
     * 移除监听（可选实现，用于清理）
     * 注意：由于 storage event 无法精确移除特定监听器，此函数仅为占位
     */
    function unwatchRoomShared(suffix, roomId) {
        // storage event listener 无法精确移除，此函数作为占位
        // 若需清理，建议使用一次性 wrapper 或在外部管理监听器引用
    }

    // ── 房间 workflow 配置（共享）───────────────────────────────────
    function loadRoomWorkflow(roomId) {
        return _readShared('workflow', roomId, _key('tw_room_workflow', roomId), null);
    }

    function saveRoomWorkflow(workflow, roomId) {
        _writeShared('workflow', workflow, roomId, _key('tw_room_workflow', roomId));
    }

    // ── 人类成员列表（房间共享）───────────────────────────────────
    function loadHumanMembers(roomId) {
        return _readShared('human_members', roomId, _key('tw_human_members', roomId), []);
    }

    function saveHumanMembers(members, roomId) {
        _writeShared('human_members', members, roomId, _key('tw_human_members', roomId));
    }

    return {
        // 用户私有
        loadHistory, saveHistory,
        loadAdopted, saveAdopted,
        get, set,

        // 房间共享
        loadAIMembers, saveAIMembers,
        loadSharedIdeas, saveSharedIdeas,
        loadBrainstormChat, saveBrainstormChat,
        loadBrainstormIdeas, saveBrainstormIdeas,
        loadStepResult, saveStepResult,
        loadRoomWorkflow, saveRoomWorkflow,
        loadHumanMembers, saveHumanMembers,

        // 房间共享 API
        getRoomShared, setRoomShared,
        watchRoomShared, unwatchRoomShared,
        startRoomSharedPoll, stopRoomSharedPoll,
        _sharedKey,
    };
})();