// ═══════════════════════════════════════════════════════════
// thinklet-common.js — 所有 ThinkLet 页面共用的基础模块
// 提供: 左侧流程栏注入、右侧成员面板注入、标准数据加载/保存
// ═══════════════════════════════════════════════════════════

const ThinkLetCommon = (() => {

    const _roomId = new URLSearchParams(location.search).get('roomId') || null;

    // AI 模型配置（与首页一致）
    const AI_MODELS = [
        { id: 'deepseek-v3', name: 'DeepSeek V3', iconClass: 'bg-blue-100 text-blue-600', iconName: 'fa-code', role: '逻辑推理专家' },
        { id: 'wenxin', name: '文心一言', iconClass: 'bg-indigo-100 text-indigo-600', iconName: 'fa-brain', role: '知识整合专家' },
        { id: 'qianwen', name: '通义千问', iconClass: 'bg-blue-100 text-blue-600', iconName: 'fa-cloud', role: '创意发散 (休眠)' },
        { id: 'gpt-4', name: 'GPT-4', iconClass: 'bg-green-100 text-green-600', iconName: 'fa-microchip', role: '全能分析专家' },
        { id: 'claude', name: 'Claude', iconClass: 'bg-blue-100 text-blue-600', iconName: 'fa-feather', role: '文字表达专家' },
        { id: 'gemini', name: 'Gemini', iconClass: 'bg-cyan-100 text-cyan-600', iconName: 'fa-star', role: '多模态专家' },
        { id: 'kimi', name: 'Kimi', iconClass: 'bg-violet-100 text-violet-600', iconName: 'fa-moon', role: '长文本专家' },
        { id: 'glm-4', name: 'GLM-4', iconClass: 'bg-rose-100 text-rose-600', iconName: 'fa-bolt', role: '中文理解专家' },
    ];

    let aiMembers = [];
    let humanMembers = [];

    // ──────────────── 左侧流程侧栏 ─────────────────

    /** 生成左侧 workflow 侧栏 HTML（插入到 body 最前面） */
    function injectWorkflowSidebar() {
        // 如果页面已有 workflow-sidebar 就不再注入
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

        // 插入到 body 的第一个子元素之前
        document.body.insertBefore(aside, document.body.firstChild);
    }

    // ──────────────── 右侧成员面板 ─────────────────

    /** 生成右侧成员面板 HTML（插入到 body 末尾） */
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
                        <button onclick="ThinkLetCommon.openAddAIModal()" class="text-blue-400 hover:text-blue-600 transition" title="添加 AI 队友"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div id="tc-ai-list" class="space-y-1"></div>
                </div>
                <div class="border-t border-slate-100 my-2 mx-3"></div>
                <div class="mb-4">
                    <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span id="tc-human-title">人类团队 (0)</span>
                        <button onclick="ThinkLetCommon.addHumanSeat()" class="text-blue-400 hover:text-blue-600 transition" title="添加"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div id="tc-human-list" class="space-y-1"></div>
                </div>
            </div>
            <div class="p-4 border-t border-slate-100">
                <button onclick="ThinkLetCommon.openInviteInfo()" class="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-user-plus"></i> 邀请新成员
                </button>
            </div>
        `;
        document.body.appendChild(aside);

        // 添加 AI 弹窗
        if (!document.getElementById('tc-add-ai-modal')) {
            const modal = document.createElement('div');
            modal.id = 'tc-add-ai-modal';
            modal.className = 'fixed inset-0 bg-black/50 z-50 hidden items-center justify-center';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-lg text-slate-800">添加 AI 队友</h3>
                        <button onclick="ThinkLetCommon.closeAddAIModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div id="tc-ai-options" class="space-y-2 max-h-64 overflow-y-auto"></div>
                    <button onclick="ThinkLetCommon.confirmAddAI()" class="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition">确认添加</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
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

    function loadMembers() {
        const saved = ScopedStorage.loadAIMembers(_roomId);
        if (saved && saved.length > 0) {
            aiMembers = saved;
        } else {
            // 默认 DeepSeek V3
            const d = AI_MODELS[0];
            aiMembers = [{ id: d.id, name: d.name, iconClass: d.iconClass, iconName: d.iconName }];
        }
        try {
            const user = Auth.getUser();
            humanMembers = [{ name: user ? user.display_name : '我', role: '主持人', isHost: true }];
        } catch {
            humanMembers = [{ name: '我', role: '主持人', isHost: true }];
        }
        renderMembers();
    }

    function renderMembers() {
        const aiList = document.getElementById('tc-ai-list');
        const aiTitle = document.getElementById('tc-ai-title');
        if (aiTitle) aiTitle.textContent = `AI 队友 (${aiMembers.length})`;
        if (aiList) {
            aiList.innerHTML = aiMembers.map(m => {
                const bgClass = m.iconClass.split(' ')[0] || 'bg-blue-100';
                const textClass = m.iconClass.split(' ')[1] || 'text-blue-600';
                const role = (AI_MODELS.find(a => a.id === m.id) || {}).role || 'AI 智能体';
                return `
                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer group">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${textClass}"><i class="fa-solid ${m.iconName}"></i></div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-slate-700 truncate">${m.name}</div>
                        <div class="text-xs text-slate-400">${role}</div>
                    </div>
                    <button onclick="ThinkLetCommon.removeAI('${m.id}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1" title="移除"><i class="fa-solid fa-xmark text-xs"></i></button>
                </div>`;
            }).join('');
        }
        const humanList = document.getElementById('tc-human-list');
        const humanTitle = document.getElementById('tc-human-title');
        if (humanTitle) humanTitle.textContent = `人类团队 (${humanMembers.length})`;
        if (humanList) {
            humanList.innerHTML = humanMembers.map(m => `
                <div class="flex items-center gap-3 p-2 rounded-lg ${m.isHost ? 'bg-blue-50/50 border border-blue-100/50' : 'hover:bg-slate-50'} transition group">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full ${m.isHost ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-xs font-bold shadow-sm">${m.isHost ? '主持人' : (m.name||'?')[0]}</div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 ${m.isHost ? 'bg-green-500' : 'bg-slate-300'} border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-slate-800 truncate">${m.name}${m.isHost ? ' (我)' : ''}</div>
                        ${m.isHost ? '<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">主持人</span>' : '<div class="text-xs text-slate-400">团队成员</div>'}
                    </div>
                    ${!m.isHost ? `<button onclick="ThinkLetCommon.removeHuman('${m.name}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
                </div>
            `).join('');
        }
    }

    function openAddAIModal() {
        const modal = document.getElementById('tc-add-ai-modal');
        const container = document.getElementById('tc-ai-options');
        const existingIds = aiMembers.map(m => m.id);
        const available = AI_MODELS.filter(m => !existingIds.includes(m.id));
        if (available.length === 0) { alert('所有 AI 模型已添加'); return; }
        container.innerHTML = available.map(m => `
            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                <input type="checkbox" class="tc-add-cb accent-blue-600" value="${m.id}">
                <div class="w-8 h-8 rounded-full ${m.iconClass} flex items-center justify-center"><i class="fa-solid ${m.iconName} text-sm"></i></div>
                <span class="text-sm font-medium text-slate-700">${m.name}</span>
            </label>
        `).join('');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeAddAIModal() {
        const modal = document.getElementById('tc-add-ai-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function confirmAddAI() {
        document.querySelectorAll('.tc-add-cb:checked').forEach(cb => {
            const m = AI_MODELS.find(a => a.id === cb.value);
            if (m && !aiMembers.find(a => a.id === m.id)) {
                aiMembers.push({ id: m.id, name: m.name, iconClass: m.iconClass, iconName: m.iconName });
            }
        });
        ScopedStorage.saveAIMembers(aiMembers, _roomId);
        renderMembers();
        closeAddAIModal();
    }

    function removeAI(modelId) {
        aiMembers = aiMembers.filter(m => m.id !== modelId);
        ScopedStorage.saveAIMembers(aiMembers, _roomId);
        renderMembers();
    }

    function addHumanSeat() {
        const name = prompt('输入人类队友名称:');
        if (name && name.trim()) {
            humanMembers.push({ name: name.trim(), role: '团队成员', isHost: false });
            renderMembers();
        }
    }

    function removeHuman(name) {
        humanMembers = humanMembers.filter(m => m.name !== name);
        renderMembers();
    }

    function openInviteInfo() {
        const wf = WorkflowNav.getWorkflow ? WorkflowNav.getWorkflow() : null;
        const roomId = _roomId || (wf && wf.roomId) || '';
        alert('房间 ID: ' + roomId + '\n\n请将此 ID 分享给队友，在首页「输入 ID 加入」即可。');
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
        // 1. 尝试加载上一步结果
        if (typeof WorkflowNav !== 'undefined' && WorkflowNav.getCurrentIndex) {
            const idx = WorkflowNav.getCurrentIndex();
            if (idx > 0) {
                const prevResult = ScopedStorage.get('tw_step_result_' + (idx - 1), _roomId);
                if (prevResult && prevResult.length > 0) return prevResult;
            }
        }
        // 2. 共享观点
        const shared = ScopedStorage.loadSharedIdeas(_roomId);
        if (shared && shared.length > 0) return shared;
        // 3. 头脑风暴灵感池
        const bsIdeas = ScopedStorage.get('tw_bs_ideas', _roomId);
        if (bsIdeas && bsIdeas.length > 0) {
            return bsIdeas.map((idea, i) => ({ id: i + 1, text: idea.text, author: idea.source || 'AI', votes: 0 }));
        }
        // 4. 头脑风暴聊天提取
        const bsChat = ScopedStorage.get('tw_bs_chat', _roomId);
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
     * @param {Array} ideas — [{id, text, author, votes, ...}]
     */
    function saveStepResult(ideas) {
        if (!ideas || ideas.length === 0) return;
        // 保存到 step_result_{index}
        if (typeof WorkflowNav !== 'undefined' && WorkflowNav.getCurrentIndex) {
            const idx = WorkflowNav.getCurrentIndex();
            if (idx >= 0) {
                ScopedStorage.set('tw_step_result_' + idx, ideas, _roomId);
            }
        }
        // 同时更新 shared_ideas 以兼容旧页面
        ScopedStorage.saveSharedIdeas(ideas, _roomId);
    }

    // ──────────────── 页面初始化 ─────────────────

    /**
     * 统一初始化入口
     * @param {Object} opts — { skipLeftSidebar, skipRightPanel }
     */
    function init(opts) {
        opts = opts || {};

        // 注入左侧流程侧栏
        if (!opts.skipLeftSidebar) {
            injectWorkflowSidebar();
        }

        // 初始化 WorkflowNav
        if (typeof WorkflowNav !== 'undefined') {
            if (WorkflowNav.init()) {
                const navContent = document.getElementById('workflow-nav-content');
                if (navContent) WorkflowNav.renderSidebar(navContent);
                // 更新用户名
                try {
                    const user = Auth.getUser();
                    if (user) {
                        const el = document.getElementById('sidebar-username');
                        if (el) el.textContent = user.display_name;
                    }
                } catch {}
            }
        }

        // 注入右侧成员面板
        if (!opts.skipRightPanel) {
            injectMembersPanel();
            loadMembers();
        }
    }

    function getRoomId() { return _roomId; }
    function getAIMembers() { return aiMembers; }

    return {
        init,
        getRoomId,
        getAIMembers,
        AI_MODELS,
        loadSeedData,
        saveStepResult,
        toggleMembersPanel,
        openAddAIModal,
        closeAddAIModal,
        confirmAddAI,
        removeAI,
        addHumanSeat,
        removeHuman,
        openInviteInfo,
    };
})();
