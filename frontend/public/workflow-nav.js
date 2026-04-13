// ═══════════════════════════════════════════════════════════
// workflow-nav.js — ThinkLet 页面共享的流程导航模块
// 提供: 加载workflow、渲染左侧栏、下一步/上一步导航
// ═══════════════════════════════════════════════════════════

const WorkflowNav = (() => {
    let workflow = null;
    let currentStepIndex = -1;
    let isDrawerOpen = true;

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
        workflow = ScopedStorage.get('tw_room_workflow');
        if (!workflow || !workflow.steps || workflow.steps.length === 0) return false;

        const currentPage = getCurrentPage();
        const currentType = PAGE_TO_TYPE[currentPage];

        // 加载时间轴进度
        const progress = ScopedStorage.get('tw_timeline_progress_' + (workflow.roomId || 'default'));

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
        const step = workflow.steps[stepIndex];
        const meta = step.thinklet || TYPE_META[step.type] || {};
        if (!meta.page) return;
        const roomId = workflow.roomId || getRoomId();
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
        const progress = ScopedStorage.get('tw_timeline_progress_' + (workflow.roomId || 'default'));

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
        if (!buttonEl) return;
        const next = getNextStep();
        if (next) {
            const label = next.meta.label || next.step.title || '下一步';
            buttonEl.innerHTML = `下一步: ${label} <i class="fa-solid fa-arrow-right"></i>`;
            buttonEl.onclick = goNext;
            buttonEl.classList.remove('hidden');
        } else {
            buttonEl.innerHTML = `已是最后一步 <i class="fa-solid fa-check"></i>`;
            buttonEl.onclick = () => window.location.href = '首页.html';
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
    };
})();
