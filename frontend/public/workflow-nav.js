// ═══════════════════════════════════════════════════════════
// workflow-nav.js — ThinkLet 页面共享的流程导航模块
// 提供: 加载workflow、渲染左侧栏、下一步/上一步导航
// ═══════════════════════════════════════════════════════════

const WorkflowNav = (() => {
    let workflow = null;
    let currentStepIndex = -1;
    let isDrawerOpen = true;
    let timerInterval = null;
    let isAutoAdvancing = false;

    // ThinkLet 页面文件名 → type 反查
    const PAGE_TO_TYPE = {
        '自由头脑风暴.html': 'FreeBrainstorm',
        '思维跳跃.html': 'LeafHopper',
        '快速聚焦.html': 'FastFocus',
        '水桶漫步.html': 'BucketWalk',
        '米花拾掇.html': 'PopcornSort',
        '麦秆投票.html': 'StrawPoll',
    };

    const TYPE_META = {
        'FreeBrainstorm': { icon: 'fa-bolt', color: 'green', label: '自由头脑风暴', page: '自由头脑风暴.html' },
        'LeafHopper': { icon: 'fa-leaf', color: 'green', label: '思维跳跃', page: '思维跳跃.html' },
        'FastFocus': { icon: 'fa-bullseye', color: 'blue', label: '快速聚焦', page: '快速聚焦.html' },
        'BucketWalk': { icon: 'fa-bucket', color: 'indigo', label: '水桶漫步', page: '水桶漫步.html' },
        'PopcornSort': { icon: 'fa-arrow-down-short-wide', color: 'teal', label: '米花拾掇', page: '米花拾掇.html' },
        'StrawPoll': { icon: 'fa-check-to-slot', color: 'blue', label: '麦秆投票', page: '麦秆投票.html' },
    };

    function _workflowRoomId() {
        return workflow && workflow.roomId ? workflow.roomId : null;
    }

    /** 流程进度：房间内所有人共享；兼容旧 key tw_timeline_progress_{rid}_uid */
    function readTimelineProgress() {
        const rid = _workflowRoomId();
        if (!rid) return ScopedStorage.get('tw_timeline_progress_default') || null;
        let p = ScopedStorage.getRoomShared('timeline', rid);
        if (p) return p;
        const legacy = ScopedStorage.get('tw_timeline_progress_' + rid);
        if (legacy) {
            ScopedStorage.setRoomShared('timeline', legacy, rid);
            return legacy;
        }
        return null;
    }

    function writeTimelineProgress(merged) {
        const rid = _workflowRoomId();
        if (rid) ScopedStorage.setRoomShared('timeline', merged, rid);
        else ScopedStorage.set('tw_timeline_progress_default', merged);
    }

    /** 获取当前页面文件名 */
    function getCurrentPage() {
        const path = location.pathname;
        const parts = path.split('/');
        return decodeURIComponent(parts[parts.length - 1] || '');
    }

    /** 获取 URL 中的 roomId 参数 */
    function getRoomId() {
        return new URLSearchParams(location.search).get('roomId') || null;
    }

    /** 初始化：加载 workflow，定位当前步骤 */
    function init() {
        const urlRoomId = getRoomId();
        workflow = ScopedStorage.loadRoomWorkflow(urlRoomId) || ScopedStorage.get('tw_room_workflow', urlRoomId);
        if (!workflow || !workflow.steps || workflow.steps.length === 0) return false;

        const currentPage = getCurrentPage();
        const currentType = PAGE_TO_TYPE[currentPage];

        // 加载时间轴进度（房间共享）
        const progress = readTimelineProgress();

        // 找到当前页面对应的步骤
        if (currentType) {
            // 优先匹配 timeline progress 中的 currentStep
            if (progress && progress.currentStep !== undefined) {
                const step = workflow.steps[progress.currentStep];
                if (step && step.type === currentType) {
                    currentStepIndex = progress.currentStep;
                } else {
                    // fallback: 找第一个匹配当前类型的步骤
                    currentStepIndex = workflow.steps.findIndex(s => s.type === currentType);
                }
            } else {
                currentStepIndex = workflow.steps.findIndex(s => s.type === currentType);
            }
        }

        if (currentStepIndex < 0) {
            currentStepIndex = 0;
        }

        // 房主已推进到更早环节：禁止停留在「超前」的环节页
        if (progress && typeof progress.currentStep === 'number' && currentStepIndex > progress.currentStep) {
            const backIdx = Math.max(0, Math.min(progress.currentStep, workflow.steps.length - 1));
            const step = workflow.steps[backIdx];
            const meta = step ? (step.thinklet || TYPE_META[step.type] || {}) : {};
            if (meta.page) {
                const roomId = workflow.roomId || getRoomId();
                const params = new URLSearchParams();
                if (roomId) params.set('roomId', roomId);
                window.location.replace(meta.page + (params.toString() ? '?' + params.toString() : ''));
                return false;
            }
        }

        // 流程锁定：已进入后续环节时，禁止回到历史环节页面
        if (progress && typeof progress.currentStep === 'number' && progress.currentStep > currentStepIndex) {
            const lockedIdx = Math.min(progress.currentStep, workflow.steps.length - 1);
            const step = workflow.steps[lockedIdx];
            const meta = step ? (step.thinklet || TYPE_META[step.type] || {}) : {};
            if (meta.page) {
                const roomId = workflow.roomId || getRoomId();
                const params = new URLSearchParams();
                if (roomId) params.set('roomId', roomId);
                window.location.replace(meta.page + (params.toString() ? '?' + params.toString() : ''));
                return false;
            }
        }

        startStepTimer();

        return true;
    }

    /** 获取 workflow 数据 */
    function getWorkflow() { return workflow; }
    function getCurrentIndex() { return currentStepIndex; }
    function getRoomIdFromWorkflow() { return workflow ? workflow.roomId : null; }

    /** 获取下一步信息 */
    function getNextStep() {
        if (!workflow || currentStepIndex < 0) return null;
        const nextIdx = currentStepIndex + 1;
        if (nextIdx >= workflow.steps.length) return null;
        const step = workflow.steps[nextIdx];
        const meta = step.thinklet || TYPE_META[step.type] || {};
        return { index: nextIdx, step, meta };
    }

    /** 获取上一步信息 */
    function getPrevStep() {
        if (!workflow || currentStepIndex <= 0) return null;
        const prevIdx = currentStepIndex - 1;
        const step = workflow.steps[prevIdx];
        const meta = step.thinklet || TYPE_META[step.type] || {};
        return { index: prevIdx, step, meta };
    }

    /** 导航到指定步骤（同页面替换） */
    function navigateTo(stepIndex) {
        if (!workflow || stepIndex < 0 || stepIndex >= workflow.steps.length) return;
        const roomId = workflow.roomId || getRoomId();
        const progress = readTimelineProgress();
        const lockedCurrent = progress && typeof progress.currentStep === 'number'
            ? progress.currentStep
            : currentStepIndex;

        const maxReachable = (progress && typeof progress.currentStep === 'number')
            ? progress.currentStep
            : currentStepIndex;
        if (stepIndex > maxReachable) {
            _toast('请等待房主推进到该环节');
            return;
        }

        if (typeof lockedCurrent === 'number' && stepIndex < lockedCurrent) {
            return;
        }

        const step = workflow.steps[stepIndex];
        const meta = step.thinklet || TYPE_META[step.type] || {};
        if (!meta.page) return;
        // 允许页面在离开前保存数据
        if (typeof saveBrainstormData === 'function') {
            try { saveBrainstormData(); } catch {}
        }
        const params = new URLSearchParams();
        if (roomId) params.set('roomId', roomId);
        window.location.href = meta.page + (params.toString() ? '?' + params.toString() : '');
    }

    /** 导航到下一步 */
    function goNext() {
        const next = getNextStep();
        if (next) navigateTo(next.index);
    }

    /** 导航到上一步 */
    function goPrev() {
        const prev = getPrevStep();
        if (prev) navigateTo(prev.index);
    }

    /** 渲染左侧导航栏内容 */
    function renderSidebar(containerEl) {
        if (!containerEl || !workflow) return;

        const roomId = workflow.roomId || getRoomId();
        const progress = readTimelineProgress();

        let html = `
            <div class="p-4">
                <button onclick="window.location.href='首页.html'" class="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md">
                    <i class="fa-solid fa-home"></i>
                    <span class="font-medium">返回首页</span>
                </button>
            </div>
            <div class="px-4 py-2">
                <div class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3 px-2">当前研讨流程</div>
                <div class="space-y-1">`;

        workflow.steps.forEach((step, idx) => {
            const meta = step.thinklet || TYPE_META[step.type] || {};
            const isCurrent = idx === currentStepIndex;
            const isDone = progress && progress.completed && progress.completed[idx];
            const icon = meta.icon || 'fa-gear';
            const label = meta.label || step.type || '环节';
            const title = step.title || label;
            const page = meta.page;
            const params = roomId ? '?roomId=' + encodeURIComponent(roomId) : '';

            let classes, textClasses;
            if (isCurrent) {
                classes = 'bg-slate-800 text-white';
                textClasses = 'text-white font-medium';
            } else if (isDone) {
                classes = 'bg-slate-800/50 text-green-400 hover:bg-slate-700';
                textClasses = 'text-green-400';
            } else {
                classes = 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white';
                textClasses = '';
            }

            html += `
                <a href="${page ? page + params : '#'}" class="block w-full text-left py-2 px-3 rounded-lg ${classes} flex items-center gap-3 transition" onclick="event.preventDefault(); ${page ? 'WorkflowNav.navigateTo(' + idx + ')' : ''}">
                    <span class="w-5 text-center">
                        ${isDone ? '<i class="fa-solid fa-check text-green-400 text-xs"></i>' : '<i class="fa-solid ' + icon + '"></i>'}
                    </span>
                    <span class="${textClasses} text-sm truncate flex-1">${title}</span>
                    ${isCurrent ? '<span class="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>' : ''}
                </a>`;
        });

        html += `</div></div>`;

        // 添加进度概览
        const doneCount = progress ? (progress.completed || []).filter(Boolean).length : 0;
        const total = workflow.steps.length;
        const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
        html += `
            <div class="px-4 py-3 mt-2">
                <div class="bg-slate-800 rounded-lg p-3">
                    <div class="flex items-center justify-between text-xs mb-2">
                        <span class="text-slate-400">流程进度</span>
                        <span class="text-white font-bold">${doneCount}/${total}</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5">
                        <div class="bg-green-500 h-1.5 rounded-full transition-all" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>`;

        // 主题信息
        if (workflow.topic) {
            html += `
                <div class="px-4 py-2">
                    <div class="bg-slate-800 rounded-lg p-3">
                        <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">研讨主题</div>
                        <div class="text-xs text-slate-300 leading-relaxed line-clamp-3">${workflow.topic}</div>
                    </div>
                </div>`;
        }

        containerEl.innerHTML = html;
    }

    /** 更新页头的"下一步"按钮 */
    function updateNextButton(buttonEl) {
        if (!buttonEl) {
            buttonEl = document.getElementById('next-step-btn');
        }
        if (!buttonEl) return;
        const next = getNextStep();
        const host = isHost();
        if (!host) {
            buttonEl.innerHTML = `<span class="inline-flex items-center gap-2">等待房主推进 <i class="fa-solid fa-hourglass-half"></i></span>`;
            buttonEl.onclick = () => _toast('仅房主可推进流程，请等待房主操作');
            buttonEl.classList.remove('hidden', 'opacity-60', 'cursor-not-allowed');
            buttonEl.classList.add('opacity-70', 'cursor-default', 'bg-slate-500', 'hover:bg-slate-500');
            buttonEl.title = '仅房主可推进到下一环节';
            return;
        }
        buttonEl.classList.remove('opacity-70', 'cursor-default', 'bg-slate-500', 'hover:bg-slate-500');
        buttonEl.classList.add('bg-slate-800', 'hover:bg-slate-700');
        buttonEl.title = '';
        if (next) {
            const label = next.meta.label || next.step.title || '下一步';
            buttonEl.innerHTML = `下一步: ${label} <i class="fa-solid fa-arrow-right"></i>`;
            buttonEl.onclick = () => completeCurrentStepAndGoNext();
            buttonEl.classList.remove('hidden');
        } else {
            buttonEl.innerHTML = `已是最后一步 <i class="fa-solid fa-check"></i>`;
            buttonEl.onclick = () => completeCurrentStepAndGoNext();
        }
    }

    /** 更新页头的步骤进度指示器 */
    function updateProgressBar(containerEl) {
        if (!containerEl || !workflow) return;
        containerEl.innerHTML = '';
        workflow.steps.forEach((step, idx) => {
            const bar = document.createElement('div');
            bar.className = 'h-1.5 w-12 rounded-full ' + (idx < currentStepIndex ? 'bg-green-500' : idx === currentStepIndex ? 'bg-green-500' : 'bg-slate-200');
            containerEl.appendChild(bar);
        });
    }

    /** 更新页头的环节信息 */
    function updateStepInfo(subtitleEl) {
        if (!subtitleEl || !workflow) return;
        const total = workflow.steps.length;
        const remaining = total - currentStepIndex - 1;
        const current = currentStepIndex + 1;
        subtitleEl.textContent = `环节 ${current}/${total} · 剩余 ${remaining} 个环节`;
    }

    /** 切换抽屉 */
    function toggleDrawer(sidebarEl, toggleBtnEl) {
        isDrawerOpen = !isDrawerOpen;
        if (sidebarEl) {
            if (isDrawerOpen) {
                sidebarEl.style.width = '';
                sidebarEl.style.minWidth = '';
                sidebarEl.style.overflow = '';
                sidebarEl.classList.remove('hidden');
            } else {
                sidebarEl.style.width = '0';
                sidebarEl.style.minWidth = '0';
                sidebarEl.style.overflow = 'hidden';
            }
        }
        if (toggleBtnEl) {
            toggleBtnEl.innerHTML = isDrawerOpen
                ? '<i class="fa-solid fa-angles-left text-sm"></i>'
                : '<i class="fa-solid fa-angles-right text-sm"></i>';
        }
    }

    function getStepDurationSeconds(step) {
        const mins = Number(step && step.durationMinutes);
        if (Number.isFinite(mins) && mins > 0) return Math.floor(mins * 60);
        return 5 * 60;
    }

    function formatTime(seconds) {
        const safe = Math.max(0, Math.floor(seconds));
        const m = Math.floor(safe / 60);
        const s = safe % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function getStepTimerKey() {
        return 'tw_step_timer_' + (workflow && workflow.roomId ? workflow.roomId : 'default');
    }

    function updateTimerUi(remaining, paused) {
        const timerEl = document.getElementById('timer');
        if (!timerEl) return;
        timerEl.textContent = formatTime(remaining);
        if (!paused && remaining <= 60) {
            timerEl.classList.add('timer-urgent');
        } else {
            timerEl.classList.remove('timer-urgent');
        }
        // 让房主直观看到可点击
        if (!timerEl._tc_bound) {
            timerEl._tc_bound = true;
            timerEl.style.cursor = 'pointer';
            timerEl.title = '点击管理计时器（仅房主可控）';
            timerEl.addEventListener('click', openTimerControls);
        }
        const statusEl = document.getElementById('tc-timer-status');
        if (statusEl) statusEl.textContent = paused ? '已暂停' : '进行中';
    }

    function readTimerState() {
        const rid = _workflowRoomId();
        if (!rid) return ScopedStorage.get(getStepTimerKey()) || null;
        let v = ScopedStorage.getRoomShared('step_timer', rid);
        if (v) return v;
        const legacy = ScopedStorage.get(getStepTimerKey());
        if (legacy) {
            ScopedStorage.setRoomShared('step_timer', legacy, rid);
            return legacy;
        }
        return null;
    }

    function writeTimerState(state) {
        const rid = _workflowRoomId();
        if (rid) ScopedStorage.setRoomShared('step_timer', state, rid);
        else ScopedStorage.set(getStepTimerKey(), state);
    }

    /** 计算当前剩余秒数（统一入口：支持 running 和 paused 两种 state） */
    function computeRemainingSeconds(state) {
        if (!state) return 0;
        if (state.paused) {
            return Math.max(0, Math.floor(state.remainingSeconds || 0));
        }
        if (state.endsAt) {
            return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
        }
        return 0;
    }

    function startStepTimer() {
        if (!workflow || currentStepIndex < 0) return;
        const step = workflow.steps[currentStepIndex];
        if (!step) return;
        const durationSeconds = getStepDurationSeconds(step);
        const now = Date.now();
        let timerState = readTimerState();

        // 新步骤或过期状态：重置为完整 duration 的 running 状态
        const needReset = !timerState
            || timerState.stepIndex !== currentStepIndex
            || (!timerState.paused && (!timerState.endsAt || timerState.endsAt <= now));
        if (needReset) {
            timerState = { stepIndex: currentStepIndex, endsAt: now + durationSeconds * 1000, paused: false };
            writeTimerState(timerState);
        }

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const tick = () => {
            const state = readTimerState();
            if (!state || state.stepIndex !== currentStepIndex) return;
            const remaining = computeRemainingSeconds(state);
            updateTimerUi(remaining, !!state.paused);
            if (!state.paused && remaining <= 0 && !isAutoAdvancing) {
                isAutoAdvancing = true;
                if (isHost()) {
                    completeCurrentStepAndGoNext({ reason: 'timeout' });
                } else {
                    isAutoAdvancing = false;
                }
            }
        };

        tick();
        timerInterval = setInterval(tick, 1000);
    }

    // ─────────────── 房主计时器控制 ───────────────

    /** 是否房主：与房间 created_by 一致才可控制计时器 / 敏感操作 */
    function isHost() {
        if (!workflow) return false;
        try {
            const u = Auth.getUser();
            if (!u) return false;
            if (workflow.createdBy !== undefined && workflow.createdBy !== null && String(workflow.createdBy) !== '') {
                return String(workflow.createdBy) === String(u.id);
            }
            return true;
        } catch { return false; }
    }

    function _hostGuard() {
        if (!isHost()) {
            _toast('仅房主可控制计时器');
            return false;
        }
        return true;
    }

    function pauseStepTimer() {
        if (!_hostGuard()) return;
        const state = readTimerState();
        if (!state || state.paused) return;
        const remaining = computeRemainingSeconds(state);
        writeTimerState({ stepIndex: state.stepIndex, paused: true, remainingSeconds: remaining });
        _refreshTimerUi();
        _syncTimerControlUi();
    }

    function resumeStepTimer() {
        if (!_hostGuard()) return;
        const state = readTimerState();
        if (!state || !state.paused) return;
        const remaining = Math.max(0, state.remainingSeconds || 0);
        writeTimerState({ stepIndex: state.stepIndex, paused: false, endsAt: Date.now() + remaining * 1000 });
        _refreshTimerUi();
        _syncTimerControlUi();
    }

    function resetStepTimer(minutes) {
        if (!_hostGuard()) return;
        if (!workflow || currentStepIndex < 0) return;
        const step = workflow.steps[currentStepIndex];
        const seconds = Number.isFinite(minutes) && minutes > 0
            ? Math.floor(minutes * 60)
            : getStepDurationSeconds(step);
        writeTimerState({ stepIndex: currentStepIndex, paused: false, endsAt: Date.now() + seconds * 1000 });
        isAutoAdvancing = false;
        _refreshTimerUi();
        _syncTimerControlUi();
    }

    function setTimerMinutes(minutes) {
        if (!_hostGuard()) return;
        if (!(Number.isFinite(minutes) && minutes > 0)) return;
        writeTimerState({ stepIndex: currentStepIndex, paused: false, endsAt: Date.now() + Math.floor(minutes * 60) * 1000 });
        isAutoAdvancing = false;
        _refreshTimerUi();
        _syncTimerControlUi();
    }

    function _refreshTimerUi() {
        const state = readTimerState();
        if (!state) return;
        updateTimerUi(computeRemainingSeconds(state), !!state.paused);
    }

    function _syncTimerControlUi() {
        const state = readTimerState();
        const paused = !!(state && state.paused);
        const pauseBtn = document.getElementById('tc-timer-pause');
        const resumeBtn = document.getElementById('tc-timer-resume');
        if (pauseBtn && resumeBtn) {
            pauseBtn.classList.toggle('hidden', paused);
            resumeBtn.classList.toggle('hidden', !paused);
        }
    }

    function openTimerControls(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!_hostGuard()) return;
        _ensureTimerControlUi();
        const popover = document.getElementById('tc-timer-popover');
        const rect = document.getElementById('timer').getBoundingClientRect();
        popover.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        popover.style.left = Math.max(16, rect.left + window.scrollX - 110) + 'px';
        popover.classList.remove('hidden');
        _syncTimerControlUi();
    }

    function closeTimerControls() {
        const popover = document.getElementById('tc-timer-popover');
        if (popover) popover.classList.add('hidden');
    }

    function _ensureTimerControlUi() {
        if (document.getElementById('tc-timer-popover')) return;
        const pop = document.createElement('div');
        pop.id = 'tc-timer-popover';
        pop.className = 'fixed z-[9500] hidden bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 p-4';
        pop.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-clock text-blue-500"></i>
                    <span class="font-bold text-slate-700">研讨计时器</span>
                </div>
                <button type="button" onclick="WorkflowNav.closeTimerControls()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="text-xs text-slate-500 mb-3">当前状态: <span id="tc-timer-status" class="font-medium text-slate-700">—</span></div>
            <div class="grid grid-cols-3 gap-2 mb-3">
                <button type="button" id="tc-timer-pause" onclick="WorkflowNav.pauseStepTimer()" class="py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"><i class="fa-solid fa-pause"></i>暂停</button>
                <button type="button" id="tc-timer-resume" onclick="WorkflowNav.resumeStepTimer()" class="py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hidden"><i class="fa-solid fa-play"></i>继续</button>
                <button type="button" onclick="WorkflowNav.resetStepTimer()" class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"><i class="fa-solid fa-rotate-left"></i>重置</button>
                <button type="button" onclick="document.getElementById('tc-timer-custom').focus()" class="py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1"><i class="fa-solid fa-pen"></i>自定义</button>
            </div>
            <div class="grid grid-cols-4 gap-2 mb-3">
                <button type="button" onclick="WorkflowNav.setTimerMinutes(5)" class="py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300">5 min</button>
                <button type="button" onclick="WorkflowNav.setTimerMinutes(10)" class="py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300">10 min</button>
                <button type="button" onclick="WorkflowNav.setTimerMinutes(15)" class="py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300">15 min</button>
                <button type="button" onclick="WorkflowNav.setTimerMinutes(30)" class="py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300">30 min</button>
            </div>
            <div class="flex items-center gap-2">
                <input id="tc-timer-custom" type="number" min="1" max="180" placeholder="分钟" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
                <button type="button" onclick="(()=>{const v=parseFloat(document.getElementById('tc-timer-custom').value);if(v>0){WorkflowNav.setTimerMinutes(v);document.getElementById('tc-timer-custom').value='';}})()" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">应用</button>
            </div>
            <div class="text-[11px] text-slate-400 mt-3 leading-relaxed"><i class="fa-solid fa-circle-info mr-1"></i>仅房主可控制；倒计时归零后将自动进入下一步。</div>
        `;
        document.body.appendChild(pop);

        // 点击空白关闭
        document.addEventListener('click', (ev) => {
            const popover = document.getElementById('tc-timer-popover');
            if (!popover || popover.classList.contains('hidden')) return;
            if (popover.contains(ev.target)) return;
            if (ev.target && ev.target.closest && ev.target.closest('#timer')) return;
            popover.classList.add('hidden');
        });
    }

    function _toast(msg) {
        const el = document.createElement('div');
        el.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-2xl z-[9999]';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    }

    function completeCurrentStep(options = {}) {
        if (!workflow || currentStepIndex < 0) return;
        const roomKey = workflow.roomId || 'default';
        const prev = readTimelineProgress() || {};
        const completed = Array.isArray(prev.completed) ? prev.completed.slice() : [];
        completed[currentStepIndex] = true;
        const nextIndex = Math.min(currentStepIndex + 1, workflow.steps.length - 1);
        const merged = {
            ...prev,
            roomId: roomKey,
            completed,
            currentStep: nextIndex,
            updatedAt: Date.now(),
            lastCompleteReason: options.reason || 'manual',
        };
        writeTimelineProgress(merged);

        const doneState = { stepIndex: nextIndex, endsAt: Date.now() + getStepDurationSeconds(workflow.steps[nextIndex]) * 1000 };
        writeTimerState(doneState);
    }

    function completeCurrentStepAndGoNext(options = {}) {
        if (!isHost()) {
            _toast('仅房主可推进流程，请等待房主操作');
            return;
        }
        const hook = options.beforeComplete || window.onBeforeStepComplete;
        if (typeof hook === 'function') {
            try { hook(); } catch {}
        }
        completeCurrentStep(options);
        const next = getNextStep();
        if (next) {
            navigateTo(next.index);
        } else {
            window.location.href = '首页.html';
        }
    }

    return {
        init,
        getWorkflow,
        getCurrentIndex,
        getRoomId,
        getRoomIdFromWorkflow,
        getNextStep,
        getPrevStep,
        navigateTo,
        goNext,
        goPrev,
        renderSidebar,
        updateNextButton,
        updateProgressBar,
        updateStepInfo,
        toggleDrawer,
        completeCurrentStep,
        completeCurrentStepAndGoNext,
        startStepTimer,
        isHost,
        openTimerControls,
        closeTimerControls,
        pauseStepTimer,
        resumeStepTimer,
        resetStepTimer,
        setTimerMinutes,
    };
})();
