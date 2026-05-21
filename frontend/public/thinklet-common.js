// ═══════════════════════════════════════════════════════════
// thinklet-common.js — 所有 ThinkLet 页面共用的基础模块
// 提供: 左侧流程栏注入、右侧成员面板注入(复用 RoomMembers 模块)、
//        标准数据加载/保存。注意：右侧面板不再包含计时器，计时由
//        页面中间的 #timer(由 WorkflowNav 统一控制)负责。
// 依赖: auth.js, storage.js, room-members.js, workflow-nav.js
// ═══════════════════════════════════════════════════════════

const ThinkLetCommon = (() => {

    const _roomId = new URLSearchParams(location.search).get('roomId') || null;

    // 兼容旧代码: 仅保留 id / name / iconClass / iconName / role 字段
    const AI_MODELS = [
        { id: 'deepseek-v3', name: 'DeepSeek V3', iconClass: 'bg-blue-100 text-blue-600', iconName: 'fa-code', role: '逻辑推理专家' },
        { id: 'wenxin', name: '文心一言', iconClass: 'bg-indigo-100 text-indigo-600', iconName: 'fa-brain', role: '知识整合专家' },
        { id: 'qianwen', name: '通义千问', iconClass: 'bg-red-100 text-red-600', iconName: 'fa-cloud', role: '创意发散专家' },
        { id: 'gpt-4', name: 'GPT-4', iconClass: 'bg-green-100 text-green-600', iconName: 'fa-microchip', role: '全能分析专家' },
        { id: 'claude', name: 'Claude', iconClass: 'bg-blue-100 text-blue-600', iconName: 'fa-feather', role: '文字表达专家' },
        { id: 'gemini', name: 'Gemini', iconClass: 'bg-cyan-100 text-cyan-600', iconName: 'fa-star', role: '多模态专家' },
        { id: 'kimi', name: 'Kimi', iconClass: 'bg-violet-100 text-violet-600', iconName: 'fa-moon', role: '长文本专家' },
        { id: 'glm-4', name: 'GLM-4', iconClass: 'bg-rose-100 text-rose-600', iconName: 'fa-bolt', role: '中文理解专家' },
    ];

    // ──────────────── 左侧流程侧栏 ─────────────────

    function injectWorkflowSidebar() {
        if (document.getElementById('workflow-sidebar')) return;

        const aside = document.createElement('aside');
        aside.id = 'workflow-sidebar';
        aside.className = 'w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 hidden md:flex z-20 shadow-xl';
        aside.style.cssText = 'transition: width 0.3s ease, min-width 0.3s ease;';
        aside.innerHTML = `
            <div class="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-900">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-slate-800/30">
                        <i class="fa-solid fa-diagram-project text-white text-sm"></i>
                    </div>
                    <h1 class="font-bold text-lg tracking-wide">AI Co-Lab</h1>
                </div>
                <button onclick="WorkflowNav.toggleDrawer(document.getElementById('workflow-sidebar'), this)" class="text-slate-400 hover:text-white transition p-1 rounded hover:bg-slate-700" title="收起侧栏">
                    <i class="fa-solid fa-angles-left text-sm"></i>
                </button>
            </div>
            <div id="workflow-nav-content" class="flex-1 overflow-y-auto custom-scroll"></div>
            <div class="p-4 border-t border-slate-800 bg-slate-900">
                <div class="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-slate-700">ME</div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate text-white" id="sidebar-username">用户</div>
                        <div class="text-xs text-slate-400">项目负责人</div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertBefore(aside, document.body.firstChild);
    }

    // ──────────────── 右侧成员面板（复用 RoomMembers，与首页/创建页一致） ─────────────────

    function injectMembersPanel() {
        if (document.getElementById('tc-members-panel')) return;

        const aside = document.createElement('aside');
        aside.id = 'tc-members-panel';
        aside.className = 'w-72 bg-white border-l border-slate-200 flex flex-col hidden lg:flex shadow-[0_0_15px_rgba(0,0,0,0.03)] z-10';
        aside.style.cssText = 'transition: width 0.3s ease;';
        aside.innerHTML = `
            <div class="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                <h2 class="font-bold text-slate-800">当前房间成员</h2>
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <span class="w-2 h-2 rounded-full bg-green-500" style="box-shadow:0 0 0 0 rgba(34,197,94,.7);animation:pulse-green 2s infinite"></span>
                        <span>在线</span>
                    </div>
                    <button onclick="ThinkLetCommon.toggleMembersPanel()" class="ml-1 text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-100" title="收起面板">
                        <i id="tc-members-icon" class="fa-solid fa-angles-right text-sm"></i>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
                <div class="mb-4">
                    <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span id="tc-ai-title">AI 队友 (0)</span>
                        <i class="fa-solid fa-robot opacity-50"></i>
                    </div>
                    <div id="tc-ai-list" class="space-y-1"></div>
                    <button type="button" onclick="RoomMembers.openAddAI()" class="w-full mt-2 py-2.5 px-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium group">
                        <div class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-200 flex items-center justify-center transition">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </div>
                        <span>添加 AI 成员</span>
                    </button>
                </div>
                <div class="border-t border-slate-100 my-2 mx-3"></div>
                <div class="mb-4">
                    <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span id="tc-human-title">人类团队 (0)</span>
                        <i class="fa-solid fa-user-group opacity-50"></i>
                    </div>
                    <div id="tc-human-list" class="space-y-1"></div>
                </div>
            </div>
            <div class="p-4 border-t border-slate-100">
                <button type="button" onclick="RoomMembers.openInvite()" class="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-user-plus"></i> 邀请新成员
                </button>
            </div>
        `;
        document.body.appendChild(aside);
    }

    let _membersPanelExpanded = true;

    function toggleMembersPanel() {
        const panel = document.getElementById('tc-members-panel');
        const icon = document.getElementById('tc-members-icon');
        if (!panel) return;
        _membersPanelExpanded = !_membersPanelExpanded;
        if (_membersPanelExpanded) {
            panel.style.width = '18rem';
            panel.style.minWidth = '';
            panel.style.overflow = '';
            icon.className = 'fa-solid fa-angles-right text-sm';
        } else {
            panel.style.width = '0';
            panel.style.minWidth = '0';
            panel.style.overflow = 'hidden';
            icon.className = 'fa-solid fa-angles-left text-sm';
        }
    }

    // ──────────────── 标准数据加载/保存 ─────────────────

    /**
     * 加载种子数据（3 级回退）:
     *   1. tw_step_result_{prevIndex}  — 上一步骤的结果
     *   2. tw_shared_ideas             — 共享观点
     *   3. tw_bs_ideas / tw_bs_chat    — 头脑风暴灵感池/聊天
     * 返回 [{id, text, author, votes}]
     */
    function loadSeedData() {
        if (typeof WorkflowNav !== 'undefined' && WorkflowNav.getCurrentIndex) {
            const idx = WorkflowNav.getCurrentIndex();
            if (idx > 0) {
                const prevResult = ScopedStorage.loadStepResult(idx - 1, _roomId)
                    || ScopedStorage.get('tw_step_result_' + (idx - 1), _roomId);
                if (prevResult && prevResult.length > 0) return prevResult;
            }
        }
        const shared = ScopedStorage.loadSharedIdeas(_roomId);
        if (shared && shared.length > 0) return shared;
        const bsIdeas = ScopedStorage.loadBrainstormIdeas(_roomId);
        if (bsIdeas && bsIdeas.length > 0) {
            return bsIdeas.map((idea, i) => ({ id: i + 1, text: idea.text, author: idea.source || 'AI', votes: 0 }));
        }
        const bsChat = ScopedStorage.loadBrainstormChat(_roomId);
        if (bsChat && bsChat.length > 0) {
            const result = [];
            let idx = 0;
            bsChat.forEach(msg => {
                if (msg.role === 'assistant') {
                    const match = msg.content.match(/^\[(.+?)\]\s*/);
                    const author = match ? match[1] : 'AI';
                    const text = (match ? msg.content.replace(match[0], '') : msg.content).replace(/【灵感提取】\s*.+/g, '').trim();
                    if (text.length > 10) {
                        idx++;
                        result.push({ id: idx, text: text.substring(0, 200), author, votes: 0 });
                    }
                }
            });
            if (result.length > 0) return result;
        }
        return [];
    }

    /**
     * 保存当前步骤结果（同时写入 step_result 和 shared_ideas）
     */
    function saveStepResult(ideas) {
        if (!ideas || ideas.length === 0) return;
        if (_roomId && typeof WorkflowNav !== 'undefined' && WorkflowNav.isHost && !WorkflowNav.isHost()) {
            return;
        }
        if (typeof WorkflowNav !== 'undefined' && WorkflowNav.getCurrentIndex) {
            const idx = WorkflowNav.getCurrentIndex();
            if (idx >= 0) {
                ScopedStorage.saveStepResult(idx, ideas, _roomId);
            }
        }
        ScopedStorage.saveSharedIdeas(ideas, _roomId);
    }

    /**
     * 房间内有 roomId 时监听共享数据（跨标签 storage + 同页 CustomEvent）
     * @param {Object} callbacks — onChatChange, onIdeasChange, onTimelineChange, onWorkflowChange, onAIMembersChange
     */
    function setupRoomSync(callbacks) {
        callbacks = callbacks || {};
        const rid = _roomId;
        if (!rid) return;

        function bind(suffix, reloadFn) {
            if (typeof reloadFn !== 'function') return;
            ScopedStorage.watchRoomShared(suffix, rid, () => reloadFn());
            window.addEventListener('tw-roomshared', (e) => {
                const d = e.detail;
                if (d && String(d.roomId) === String(rid) && d.suffix === suffix) reloadFn();
            });
        }

        bind('bs_chat', callbacks.onChatChange);
        bind('bs_ideas', callbacks.onIdeasChange);
        bind('timeline', callbacks.onTimelineChange);
        bind('workflow', callbacks.onWorkflowChange);
        bind('ai_members', callbacks.onAIMembersChange);
        bind('human_members', callbacks.onHumanMembersChange);
        bind('ideas', callbacks.onSharedIdeasChange);

        // 启动后端共享 KV 轮询（首次拉取会自动派发 tw-roomshared 触发上面的回调）
        try { ScopedStorage.startRoomSharedPoll(rid); } catch {}
        // 注：房间成员（人类/AI）由 RoomMembers.mount 内置 5 秒轮询，无需在此重复
    }

    // ──────────────── 房间号/密码（给 RoomMembers 的邀请弹窗用） ─────────────────

    function _getRoomCode() {
        try {
            const wf = (typeof WorkflowNav !== 'undefined' && WorkflowNav.getWorkflow) ? WorkflowNav.getWorkflow() : null;
            if (wf && wf.roomCode) return wf.roomCode;
            const stored = ScopedStorage.loadRoomWorkflow(_roomId) || ScopedStorage.get('tw_room_workflow', _roomId);
            if (stored && stored.roomCode) return stored.roomCode;
        } catch {}
        return _roomId || '';
    }

    // ──────────────── 页面初始化 ─────────────────

    /**
     * 统一初始化入口
     * @param {Object} opts — { skipLeftSidebar, skipRightPanel }
     */
    function init(opts) {
        opts = opts || {};

        if (!opts.skipLeftSidebar) {
            injectWorkflowSidebar();
        }

        if (typeof WorkflowNav !== 'undefined') {
            if (WorkflowNav.init()) {
                const navContent = document.getElementById('workflow-nav-content');
                if (navContent) WorkflowNav.renderSidebar(navContent);
                try {
                    const user = Auth.getUser();
                    if (user) {
                        const el = document.getElementById('sidebar-username');
                        if (el) el.textContent = user.display_name;
                    }
                } catch {}
            }
        }

        if (!opts.skipRightPanel) {
            injectMembersPanel();
            if (typeof RoomMembers !== 'undefined') {
                RoomMembers.mount({
                    roomId: _roomId,
                    isHost: (typeof WorkflowNav !== 'undefined' && WorkflowNav.isHost) ? !!WorkflowNav.isHost() : true,
                    aiContainerId: 'tc-ai-list',
                    humanContainerId: 'tc-human-list',
                    aiCountId: 'tc-ai-title',
                    humanCountId: 'tc-human-title',
                    // 有 roomId 时人类列表以 API 为准，不再把本地用户假扮成主持人
                    includeSelfAsHost: !_roomId,
                    getRoomCode: _getRoomCode,
                    getRoomPassword: () => '',
                    onChange: () => {
                        try {
                            if (typeof window.onAIMembersChanged === 'function') window.onAIMembersChanged();
                        } catch {}
                        try {
                            if (typeof WorkflowNav !== 'undefined' && WorkflowNav.updateNextButton) {
                                WorkflowNav.updateNextButton(document.getElementById('next-step-btn'));
                            }
                        } catch {}
                    },
                });
            } else {
                console.warn('[ThinkLetCommon] RoomMembers 模块未加载；请确保在 thinklet-common.js 之前引入 room-members.js');
            }
        }
    }

    function getRoomId() { return _roomId; }
    function getAIMembers() {
        try {
            if (typeof RoomMembers !== 'undefined') return RoomMembers.getAIMembers();
        } catch {}
        return ScopedStorage.loadAIMembers(_roomId) || [];
    }

    return {
        init,
        getRoomId,
        getAIMembers,
        AI_MODELS,
        loadSeedData,
        saveStepResult,
        setupRoomSync,
        toggleMembersPanel,
    };
})();
