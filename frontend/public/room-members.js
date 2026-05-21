// ═══════════════════════════════════════════════════════════
// room-members.js — 房间成员面板（AI 列表 + 人类列表 + 邀请）
// 复用首页右栏的完整交互：每个 AI 可配置角色模板 / 系统提示词 /
// 温度 / Max Tokens / 知识库；邀请弹窗显示房间号和链接。
// 供 创建高级房间.html 与 ThinkLetCommon(各 ThinkLet 页)共同使用。
// 依赖：auth.js、storage.js
// ═══════════════════════════════════════════════════════════

const RoomMembers = (() => {

    const AI_CATALOG = [
        { id: 'deepseek-v3', name: 'DeepSeek V3', role: '逻辑推理专家',   icon: 'fa-code',     iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   desc: '强大推理能力' },
        { id: 'wenxin',      name: '文心一言',     role: '知识整合专家',   icon: 'fa-brain',    iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: '中文语义理解' },
        { id: 'qianwen',     name: '通义千问',     role: '创意发散专家',   icon: 'fa-cloud',    iconBg: 'bg-red-100',    iconColor: 'text-red-600',    desc: '创意生成' },
        { id: 'gpt-4',       name: 'GPT-4',        role: '全能分析专家',   icon: 'fa-microchip',iconBg: 'bg-green-100',  iconColor: 'text-green-600',  desc: '通用能力' },
        { id: 'claude',      name: 'Claude',       role: '文字表达专家',   icon: 'fa-feather',  iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   desc: '长文本分析' },
        { id: 'gemini',      name: 'Gemini',       role: '多模态专家',     icon: 'fa-star',     iconBg: 'bg-cyan-100',   iconColor: 'text-cyan-600',   desc: '多模态推理' },
        { id: 'kimi',        name: 'Kimi',         role: '长文本专家',     icon: 'fa-moon',     iconBg: 'bg-violet-100', iconColor: 'text-violet-600', desc: '超长上下文' },
        { id: 'glm-4',       name: 'GLM-4',        role: '中文理解专家',   icon: 'fa-bolt',     iconBg: 'bg-rose-100',   iconColor: 'text-rose-600',   desc: '中文对话' },
    ];

    const ROLE_TEMPLATES = [
        { id: 'default',  name: '默认模板',   desc: '平衡的通用助手,适合大多数场景', prompt: '' },
        { id: 'analyst',  name: '分析专家',   desc: '深度分析、数据洞察、逻辑推理',   prompt: '你是一位数据分析专家,擅长深度剖析问题,从数据和逻辑角度给出深刻见解。回答时请提供多维度分析和数据支撑。' },
        { id: 'creative', name: '创意顾问',   desc: '头脑风暴、创新思维、多角度思考', prompt: '你是一位创意策划专家,擅长发散思维、头脑风暴和创新方案设计。回答时请跳出常规思维,提供多种新颖且有创意的角度。' },
        { id: 'expert',   name: '领域专家',   desc: '专业知识、实践经验、深度见解',   prompt: '你是一位资深的领域专家,擅长基于专业知识和实践经验给出深度见解。回答时请展现专业度和实用性。' },
        { id: 'custom',   name: '自定义角色', desc: '完全自定义系统提示词和行为模式', prompt: '' },
    ];

    // ---------- 内部状态 ----------
    let _ctx = {
        roomId: null,
        getRoomCode: () => '',
        getRoomPassword: () => '',
        isHost: true,            // 是否为房主（可管理成员）
        aiContainerId: '',
        humanContainerId: '',
        aiCountId: '',
        humanCountId: '',
        onChange: () => {},
        includeSelfAsHost: true, // 是否把当前登录用户作为主持人置顶
    };
    let aiMembers = [];          // [{ id, name, role, icon, iconBg, iconColor, roleTemplate, systemPrompt, temperature, maxTokens, knowledgeFiles:[{name,text,size,charCount}] }]
    let humanMembers = [];       // [{ name, role, isHost }]

    // ---------- 公开方法 ----------

    /**
     * 挂载成员面板。
     * opts: {
     *   roomId, getRoomCode(), getRoomPassword(), isHost,
     *   aiContainerId, humanContainerId, aiCountId, humanCountId,
     *   onChange, includeSelfAsHost
     * }
     */
    function mount(opts) {
        _ctx = Object.assign({}, _ctx, opts || {});
        loadState();
        ensureModals();
        render();
        if (_ctx.roomId && typeof Auth !== 'undefined' && Auth.apiCall) {
            syncRoomFromApi().catch(() => {});
            // 启动后端共享 KV 轮询：AI 配置 / 人类成员变化能实时反映
            try {
                if (typeof ScopedStorage !== 'undefined' && ScopedStorage.startRoomSharedPoll) {
                    ScopedStorage.startRoomSharedPoll(_ctx.roomId);
                }
            } catch {}
            // 监听共享数据变化时重新渲染
            window.addEventListener('tw-roomshared', (e) => {
                const d = e.detail || {};
                if (String(d.roomId) !== String(_ctx.roomId)) return;
                if (d.suffix === 'ai_members' || d.suffix === 'human_members') {
                    loadState();
                    render();
                    if (typeof _ctx.onChange === 'function') _ctx.onChange();
                }
            });
            // 定时拉取后端房间成员（含人类）：5 秒一次
            if (!mount._memberPollTimer) {
                mount._memberPollTimer = setInterval(() => {
                    syncRoomFromApi().catch(() => {});
                }, 5000);
            }
        }
    }

    /** 用 GET /api/rooms/:id 同步人类成员、房主权限与（若本地无配置）AI 列表 */
    async function syncRoomFromApi() {
        if (!_ctx.roomId || !Auth.apiCall) return;
        try {
            const resp = await Auth.apiCall('/api/rooms/' + _ctx.roomId);
            if (!resp.ok) return;
            applyRoomOut(await resp.json());
        } catch {}
    }

    /**
     * @param {object} room — RoomOut JSON（members / agent_configs / created_by）
     */
    function applyRoomOut(room) {
        if (!room) return;
        const me = tryGetUser();
        _ctx.isHost = !!(me && room.created_by != null && String(me.id) === String(room.created_by));

        if (Array.isArray(room.members) && room.members.length) {
            humanMembers = room.members.map(m => ({
                name: m.display_name || '成员',
                role: m.role === 'host' ? '主持人' : '团队成员',
                isHost: m.role === 'host',
                userId: m.user_id,
            })).sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
        }

        if (Array.isArray(room.agent_configs) && room.agent_configs.length) {
            const fromServer = room.agent_configs
                .filter(a => a.is_active !== false)
                .map(a => normalizeAI({
                    id: a.model_id,
                    roleTemplate: a.role_template,
                    systemPrompt: a.system_prompt || '',
                    temperature: a.temperature,
                    maxTokens: a.max_tokens,
                }))
                .filter(Boolean);
            if (fromServer.length) aiMembers = fromServer;
        }

        saveState();
        render();
    }

    function getAIMembers() { return aiMembers.slice(); }

    /** 转为后端 agents payload */
    function toAgentsPayload() {
        return aiMembers.map(m => {
            const temp = Math.max(0, Math.min(2, typeof m.temperature === 'number' ? m.temperature : 0.7));
            const maxT = Math.max(500, Math.min(4000, typeof m.maxTokens === 'number' ? m.maxTokens : 2000));
            const tplId = m.roleTemplate || m.template || 'default';
            return {
                model_id: m.id,
                role_template: tplId,
                system_prompt: (tplId === 'custom' ? (m.systemPrompt || '') :
                                (ROLE_TEMPLATES.find(r => r.id === tplId) || ROLE_TEMPLATES[0]).prompt || ''),
                temperature: temp,
                max_tokens: maxT,
                is_active: true,
            };
        });
    }

    function setHost(isHost) { _ctx.isHost = !!isHost; render(); }
    function refresh() { loadState(); render(); }

    // ---------- 状态 ----------

    function loadState() {
        try {
            const saved = ScopedStorage.loadAIMembers(_ctx.roomId);
            if (saved && saved.length > 0) {
                aiMembers = saved.map(normalizeAI).filter(Boolean);
                // 首页草稿里存的是 modelId + 随机 id（ai_xxx），normalize 会全部失败 → 须回退默认
                if (aiMembers.length === 0) {
                    aiMembers = [
                        normalizeAI({ id: 'deepseek-v3' }),
                        normalizeAI({ id: 'wenxin' }),
                    ].filter(Boolean);
                }
            } else {
                aiMembers = [
                    normalizeAI({ id: 'deepseek-v3' }),
                    normalizeAI({ id: 'wenxin' }),
                ].filter(Boolean);
            }
        } catch { aiMembers = []; }

        try {
            humanMembers = ScopedStorage.loadHumanMembers(_ctx.roomId);
            if (!Array.isArray(humanMembers)) humanMembers = [];
        } catch { humanMembers = []; }
    }

    function saveState() {
        try { ScopedStorage.saveAIMembers(aiMembers, _ctx.roomId); } catch {}
        try { ScopedStorage.saveHumanMembers(humanMembers, _ctx.roomId); } catch {}
        if (typeof _ctx.onChange === 'function') _ctx.onChange();
    }

    function normalizeAI(m) {
        if (!m) return null;
        // 首页 / 旧数据：modelId + template；本模块：id 为目录里的 model_id
        const legacyInstanceId = typeof m.id === 'string' && m.id.startsWith('ai_');
        const modelKey = m.model_id || m.modelId || (!legacyInstanceId ? m.id : null);
        const catalog = AI_CATALOG.find(a => a.id === modelKey || a.id === m.id);
        if (!catalog) return null;
        const tpl = m.roleTemplate || m.template || 'default';
        return {
            id: catalog.id,
            name: m.name || catalog.name,
            role: catalog.role,
            icon: catalog.icon,
            iconBg: catalog.iconBg,
            iconColor: catalog.iconColor,
            roleTemplate: tpl,
            systemPrompt: m.systemPrompt || m.customPrompt || '',
            temperature: typeof m.temperature === 'number' ? m.temperature : 0.7,
            maxTokens: typeof m.maxTokens === 'number' ? m.maxTokens : 2000,
            knowledgeFiles: Array.isArray(m.knowledgeFiles) ? m.knowledgeFiles : [],
        };
    }

    // ---------- 渲染 ----------

    function render() {
        renderAI();
        renderHuman();
    }

    function renderAI() {
        const list = document.getElementById(_ctx.aiContainerId);
        const countEl = document.getElementById(_ctx.aiCountId);
        if (countEl) countEl.textContent = `AI 队友 (${aiMembers.length})`;
        if (!list) return;

        if (aiMembers.length === 0) {
            list.innerHTML = '<div class="text-xs text-slate-400 px-2 py-2">请添加至少一个 AI 成员</div>';
            return;
        }

        list.innerHTML = aiMembers.map((m, idx) => {
            const kbCount = (m.knowledgeFiles || []).length;
            const tplName = (ROLE_TEMPLATES.find(r => r.id === m.roleTemplate) || ROLE_TEMPLATES[0]).name;
            return `
                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition group">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full ${m.iconBg} flex items-center justify-center ${m.iconColor}">
                            <i class="fa-solid ${m.icon}"></i>
                        </div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-slate-700 truncate">${escapeHtml(m.name)}</div>
                        <div class="text-xs text-slate-400 truncate">${escapeHtml(tplName)}${kbCount ? ' · 知识库 ' + kbCount : ''}</div>
                    </div>
                    <button type="button" onclick="RoomMembers._openCustomize(${idx})" class="text-slate-300 hover:text-blue-600 transition p-1" title="配置角色/参数/知识库">
                        <i class="fa-solid fa-sliders text-sm"></i>
                    </button>
                    ${_ctx.isHost ? `<button type="button" onclick="RoomMembers._removeAI(${idx})" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1" title="移除"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
                </div>`;
        }).join('');
    }

    function renderHuman() {
        const list = document.getElementById(_ctx.humanContainerId);
        const countEl = document.getElementById(_ctx.humanCountId);
        const me = tryGetUser();

        /** 展示用行：含 isMe（与后端 user_id 比对），不再错误地把「当前用户」一律当主持人 */
        let list2 = [];
        if (humanMembers.length > 0) {
            list2 = humanMembers.map(h => {
                const name = h.name || String(h);
                const uid = h.userId;
                const isMe = !!(me && uid != null && String(uid) === String(me.id));
                const isHost = !!h.isHost || h.role === '主持人';
                const roleLabel = h.role || (isHost ? '主持人' : '团队成员');
                return { name, roleLabel, isHost, isMe, userId: uid };
            });
        } else if (_ctx.includeSelfAsHost !== false) {
            list2 = [{
                name: me ? (me.display_name || '我') : '我',
                roleLabel: '主持人',
                isHost: true,
                isMe: true,
                userId: me ? me.id : null,
            }];
        }

        if (countEl) countEl.textContent = `人类团队 (${list2.length})`;
        if (!list) return;

        if (list2.length === 0 && _ctx.roomId) {
            list.innerHTML = '<div class="text-xs text-slate-400 px-2 py-2">正在加载成员…</div>';
            return;
        }

        list.innerHTML = list2.map((m, idx) => {
            const avatarLabel = m.isHost ? '主持' : escapeHtml((m.name || '?')[0]);
            const badgeHtml = m.isHost
                ? '<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">主持人</span>'
                : `<div class="text-xs text-slate-400">${escapeHtml(m.roleLabel)}</div>`;
            const canRemoveLocal = _ctx.isHost && !m.userId && !m.isHost;
            return `
                <div class="flex items-center gap-3 p-2 rounded-lg ${m.isHost ? 'bg-blue-50/50 border border-blue-100/50' : 'hover:bg-slate-50'} transition group">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full ${m.isHost ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-xs font-bold">${avatarLabel}</div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 ${m.isHost ? 'bg-green-500' : 'bg-slate-300'} border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-slate-700 truncate">${escapeHtml(m.name)}${m.isMe ? ' (我)' : ''}</div>
                        <div class="flex items-center gap-1 flex-wrap mt-0.5">${badgeHtml}</div>
                    </div>
                    ${canRemoveLocal ? `<button type="button" onclick="RoomMembers._removeHuman(${idx})" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1" title="移除此占位成员"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
                </div>`;
        }).join('');
    }

    // ---------- 交互：添加 / 移除 / 配置 ----------

    function openAddAI() {
        if (!_ctx.isHost) { alert('仅房主可添加 AI 成员'); return; }
        const modal = document.getElementById('rm-add-ai-modal');
        const container = document.getElementById('rm-add-ai-options');
        const existingIds = aiMembers.map(m => m.id);
        const available = AI_CATALOG.filter(m => !existingIds.includes(m.id));
        if (available.length === 0) { alert('所有 AI 模型都已添加'); return; }
        container.innerHTML = available.map(m => `
            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                <input type="checkbox" class="rm-add-cb accent-blue-600" value="${m.id}">
                <div class="w-8 h-8 rounded-full ${m.iconBg} flex items-center justify-center ${m.iconColor}"><i class="fa-solid ${m.icon} text-sm"></i></div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-700 truncate">${m.name}</div>
                    <div class="text-xs text-slate-400 truncate">${m.role}</div>
                </div>
            </label>`).join('');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function confirmAddAI() {
        document.querySelectorAll('.rm-add-cb:checked').forEach(cb => {
            if (!aiMembers.find(a => a.id === cb.value)) {
                aiMembers.push(normalizeAI({ id: cb.value }));
            }
        });
        closeAddAI();
        saveState();
        render();
    }

    function closeAddAI() {
        const modal = document.getElementById('rm-add-ai-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function removeAI(idx) {
        if (!_ctx.isHost) { alert('仅房主可移除成员'); return; }
        aiMembers.splice(idx, 1);
        saveState();
        render();
    }

    function addHuman() {
        if (!_ctx.isHost) { alert('仅房主可添加成员'); return; }
        const name = prompt('输入要邀请的人类队友名称（或直接让对方通过房间号加入）:');
        if (name && name.trim()) {
            humanMembers.push({ name: name.trim(), role: '团队成员', isHost: false });
            saveState();
            render();
        }
    }

    function removeHuman(idx) {
        if (!_ctx.isHost) { alert('仅房主可移除成员'); return; }
        humanMembers.splice(idx, 1);
        saveState();
        render();
    }

    function openInvite() {
        ensureModals();
        const modal = document.getElementById('rm-invite-modal');
        const codeEl = document.getElementById('rm-invite-code');
        const linkEl = document.getElementById('rm-invite-link');
        const pwdEl = document.getElementById('rm-invite-password');
        const pwdWrap = document.getElementById('rm-invite-password-wrap');

        const code = (typeof _ctx.getRoomCode === 'function' ? _ctx.getRoomCode() : '') || '';
        const pwd = (typeof _ctx.getRoomPassword === 'function' ? _ctx.getRoomPassword() : '') || '';
        const prettyCode = code && code.length >= 9 ? `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}` : (code || '房间创建后可见');
        codeEl.textContent = prettyCode;
        linkEl.textContent = code ? `${location.origin}/join?room=${code}` : '（房间创建后可用）';

        if (pwd) { pwdWrap.classList.remove('hidden'); pwdEl.value = pwd; }
        else     { pwdWrap.classList.add('hidden'); pwdEl.value = ''; }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeInvite() {
        const modal = document.getElementById('rm-invite-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function copyInvite() {
        const code = (typeof _ctx.getRoomCode === 'function' ? _ctx.getRoomCode() : '') || '';
        if (!code) { toast('房间还未创建，暂无房间号'); return; }
        navigator.clipboard.writeText(code).then(() => toast('已复制房间号'));
    }

    // ---------- AI 自定义弹窗 ----------

    let _customizingIdx = -1;

    function openCustomize(idx) {
        const m = aiMembers[idx];
        if (!m) return;
        _customizingIdx = idx;
        ensureModals();
        const modal = document.getElementById('rm-ai-modal');
        document.getElementById('rm-ai-modal-title').textContent = `配置 ${m.name}`;

        // 角色模板
        document.querySelectorAll('.rm-ai-tpl').forEach(r => { r.checked = (r.value === (m.roleTemplate || 'default')); });
        const customWrap = document.getElementById('rm-ai-custom-wrap');
        customWrap.classList.toggle('hidden', m.roleTemplate !== 'custom');
        document.getElementById('rm-ai-custom-prompt').value = m.systemPrompt || '';

        // 温度 / MaxTokens
        const temp = typeof m.temperature === 'number' ? m.temperature : 0.7;
        const maxT = typeof m.maxTokens === 'number' ? m.maxTokens : 2000;
        document.getElementById('rm-ai-temp').value = temp;
        document.getElementById('rm-ai-temp-val').textContent = temp.toFixed(1);
        document.getElementById('rm-ai-maxt').value = maxT;
        document.getElementById('rm-ai-maxt-val').textContent = maxT;

        // 知识库
        renderKnowledgeList(m);

        // 只读态
        const readOnly = !_ctx.isHost;
        modal.querySelectorAll('input, textarea, button.rm-ai-save').forEach(el => {
            if (el.classList.contains('rm-ai-close')) return;
            el.disabled = readOnly;
        });

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeCustomize() {
        const modal = document.getElementById('rm-ai-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        _customizingIdx = -1;
    }

    function saveCustomize() {
        if (_customizingIdx < 0) return;
        const m = aiMembers[_customizingIdx];
        if (!m) return;
        const tpl = document.querySelector('.rm-ai-tpl:checked');
        m.roleTemplate = tpl ? tpl.value : 'default';
        m.systemPrompt = document.getElementById('rm-ai-custom-prompt').value || '';
        m.temperature = parseFloat(document.getElementById('rm-ai-temp').value) || 0.7;
        m.maxTokens = parseInt(document.getElementById('rm-ai-maxt').value) || 2000;
        saveState();
        render();
        closeCustomize();
        toast('已保存');
    }

    function renderKnowledgeList(m) {
        const box = document.getElementById('rm-ai-kb-list');
        if (!m.knowledgeFiles || m.knowledgeFiles.length === 0) {
            box.innerHTML = '<div class="text-xs text-slate-400">尚未上传知识库文件</div>';
            return;
        }
        box.innerHTML = m.knowledgeFiles.map((f, i) => `
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <i class="fa-solid fa-file-lines text-emerald-500"></i>
                <span class="flex-1 truncate text-slate-700">${escapeHtml(f.name)}</span>
                <span class="text-xs text-slate-400">${Math.round((f.size || 0) / 1024)}KB · ${f.charCount || (f.text || '').length}字</span>
                ${_ctx.isHost ? `<button type="button" onclick="RoomMembers._removeKnowledge(${i})" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>`).join('');
    }

    async function handleKnowledgeFiles(files) {
        if (_customizingIdx < 0 || !files || files.length === 0) return;
        const m = aiMembers[_customizingIdx];
        if (!m) return;
        if (!m.knowledgeFiles) m.knowledgeFiles = [];
        for (const f of files) {
            try {
                const text = await readFileText(f);
                m.knowledgeFiles.push({ name: f.name, size: f.size, text, charCount: text.length });
            } catch (e) {
                alert('读取失败: ' + f.name + '（' + e.message + '）');
            }
        }
        saveState();
        renderKnowledgeList(m);
        render();
    }

    function removeKnowledge(i) {
        if (_customizingIdx < 0) return;
        const m = aiMembers[_customizingIdx];
        if (!m || !m.knowledgeFiles) return;
        m.knowledgeFiles.splice(i, 1);
        saveState();
        renderKnowledgeList(m);
        render();
    }

    function readFileText(f) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('读取错误'));
            reader.readAsText(f, 'utf-8');
        });
    }

    // ---------- 工具 ----------

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function tryGetUser() {
        try { return Auth.getUser && Auth.getUser(); } catch { return null; }
    }

    function toast(msg) {
        const el = document.createElement('div');
        el.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-2xl z-[9999]';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    }

    // ---------- 模态框一次性注入 ----------

    let _modalsMounted = false;
    function ensureModals() {
        if (_modalsMounted) return;
        _modalsMounted = true;

        // 添加 AI 弹窗
        const addModal = document.createElement('div');
        addModal.id = 'rm-add-ai-modal';
        addModal.className = 'fixed inset-0 bg-black/50 z-[9000] hidden items-center justify-center';
        addModal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg text-slate-800">添加 AI 队友</h3>
                    <button type="button" onclick="RoomMembers._closeAddAI()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="rm-add-ai-options" class="space-y-2 max-h-64 overflow-y-auto"></div>
                <button type="button" onclick="RoomMembers._confirmAddAI()" class="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition">确认添加</button>
            </div>`;
        document.body.appendChild(addModal);

        // 邀请弹窗
        const inviteModal = document.createElement('div');
        inviteModal.id = 'rm-invite-modal';
        inviteModal.className = 'fixed inset-0 bg-black/50 z-[9000] hidden items-center justify-center';
        inviteModal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                <div class="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
                    <h3 class="text-lg font-bold">邀请成员加入</h3>
                    <button type="button" onclick="RoomMembers._closeInvite()" class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-6 space-y-5">
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-slate-600 flex items-center gap-2"><i class="fa-solid fa-hashtag text-blue-500"></i>房间号</label>
                        <div class="flex items-center gap-2">
                            <div class="flex-1 bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-slate-800 tracking-wider text-center" id="rm-invite-code">—</div>
                            <button type="button" onclick="RoomMembers._copyInvite()" class="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-2"><i class="fa-solid fa-copy"></i><span class="hidden sm:inline">复制</span></button>
                        </div>
                        <p class="text-xs text-slate-500">新成员可在"输入 ID 加入"中使用此房间号进入</p>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-slate-600 flex items-center gap-2"><i class="fa-solid fa-link text-red-500"></i>邀请链接</label>
                        <div class="flex-1 bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 truncate" id="rm-invite-link">—</div>
                    </div>
                    <div class="space-y-2 hidden" id="rm-invite-password-wrap">
                        <label class="text-sm font-semibold text-slate-600 flex items-center gap-2"><i class="fa-solid fa-lock text-slate-500"></i>房间密码</label>
                        <input readonly id="rm-invite-password" class="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-2.5 font-mono text-lg font-bold text-slate-800 tracking-wider text-center">
                    </div>
                </div>
            </div>`;
        document.body.appendChild(inviteModal);

        // AI 自定义配置弹窗
        const aiModal = document.createElement('div');
        aiModal.id = 'rm-ai-modal';
        aiModal.className = 'fixed inset-0 bg-black/40 z-[9000] hidden items-center justify-center';
        const tplHtml = ROLE_TEMPLATES.map(t => `
            <label class="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <input type="radio" name="rm-ai-tpl" class="rm-ai-tpl w-4 h-4 text-blue-600" value="${t.id}" onchange="RoomMembers._toggleCustomWrap()">
                <div class="flex-1">
                    <div class="font-semibold text-slate-700">${t.name}</div>
                    <div class="text-xs text-slate-500">${t.desc}</div>
                </div>
                ${t.id === 'default' ? '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">推荐</span>' : ''}
            </label>`).join('');
        aiModal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto mx-4">
                <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white"><i class="fa-solid fa-sliders"></i></div>
                        <div>
                            <h3 id="rm-ai-modal-title" class="text-lg font-bold text-slate-800">配置 AI</h3>
                            <p class="text-xs text-slate-500">角色模板 / 高级参数 / 知识库</p>
                        </div>
                    </div>
                    <button type="button" onclick="RoomMembers._closeCustomize()" class="rm-ai-close w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-6 space-y-6">
                    <div class="space-y-3">
                        <label class="block text-sm font-bold text-slate-700"><i class="fa-solid fa-user-gear mr-2 text-red-500"></i>角色模板</label>
                        <div class="space-y-2">${tplHtml}</div>
                    </div>
                    <div id="rm-ai-custom-wrap" class="space-y-2 hidden">
                        <label class="block text-sm font-bold text-slate-700"><i class="fa-solid fa-message mr-2 text-blue-500"></i>自定义系统提示词</label>
                        <textarea id="rm-ai-custom-prompt" rows="4" placeholder="例：你是一位专业的市场营销顾问..." class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none text-sm"></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-slate-700 flex items-center justify-between">温度 (Temperature) <span id="rm-ai-temp-val" class="text-blue-600 font-mono">0.7</span></label>
                            <input id="rm-ai-temp" type="range" min="0" max="2" step="0.1" value="0.7" class="w-full accent-blue-600" oninput="document.getElementById('rm-ai-temp-val').textContent=parseFloat(this.value).toFixed(1)">
                            <div class="text-xs text-slate-400">越低越稳定，越高越发散。</div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-slate-700 flex items-center justify-between">最大输出 (Max Tokens) <span id="rm-ai-maxt-val" class="text-blue-600 font-mono">2000</span></label>
                            <input id="rm-ai-maxt" type="range" min="500" max="4000" step="100" value="2000" class="w-full accent-blue-600" oninput="document.getElementById('rm-ai-maxt-val').textContent=this.value">
                            <div class="text-xs text-slate-400">限制单次回答的长度。</div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <label class="block text-sm font-bold text-slate-700"><i class="fa-solid fa-database mr-2 text-emerald-500"></i>知识库文件</label>
                        <div onclick="document.getElementById('rm-ai-kb-input').click()" class="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                            <input type="file" id="rm-ai-kb-input" class="hidden" multiple accept=".pdf,.txt,.doc,.docx,.md,.json" onchange="RoomMembers._handleKnowledge(this.files); this.value=''">
                            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><i class="fa-solid fa-cloud-arrow-up text-xl"></i></div>
                            <div class="text-sm font-medium text-slate-700">点击上传（TXT / MD / JSON 可读为文本）</div>
                            <div class="text-xs text-slate-400 mt-1">PDF/Word 请上传为文本版</div>
                        </div>
                        <div id="rm-ai-kb-list" class="space-y-2"></div>
                    </div>
                </div>
                <div class="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end gap-2">
                    <button type="button" onclick="RoomMembers._closeCustomize()" class="rm-ai-close px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">关闭</button>
                    <button type="button" onclick="RoomMembers._saveCustomize()" class="rm-ai-save px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium">保存</button>
                </div>
            </div>`;
        document.body.appendChild(aiModal);
    }

    // ---------- 对外暴露 ----------
    return {
        mount,
        refresh,
        setHost,
        applyRoomOut,
        syncRoomFromApi,
        openAddAI,
        openInvite,
        addHuman,
        getAIMembers,
        toAgentsPayload,
        AI_CATALOG,
        ROLE_TEMPLATES,

        // 给内部 onclick 使用
        _confirmAddAI: confirmAddAI,
        _closeAddAI: closeAddAI,
        _removeAI: removeAI,
        _removeHuman: removeHuman,
        _openCustomize: openCustomize,
        _closeCustomize: closeCustomize,
        _saveCustomize: saveCustomize,
        _toggleCustomWrap: () => {
            const v = document.querySelector('.rm-ai-tpl:checked');
            document.getElementById('rm-ai-custom-wrap').classList.toggle('hidden', !v || v.value !== 'custom');
        },
        _handleKnowledge: handleKnowledgeFiles,
        _removeKnowledge: removeKnowledge,
        _closeInvite: closeInvite,
        _copyInvite: copyInvite,
    };
})();
