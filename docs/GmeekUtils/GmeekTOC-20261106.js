/**
 * GmeekTOC-20261106.js
 * GmeekTOC 文章目录工具 随机展开3/4级目录，点击展开下一级，最深展示6级
 * 20261106 版本号 2026年11月6日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 *
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261106.js
 * 引用方法 "script":"<script src='https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261106.js'></script>"
**/


/* ==================== 通用工具 ==================== */
function loadResource(type, attributes, callback) {
    var element;
    if (type === 'script') {
        element = document.createElement('script');
        element.src = attributes.src;
        element.onload = callback;
        element.onerror = function () {
            console.warn('[GmeekTOC] 脚本加载失败: ' + attributes.src);
        };
    } else if (type === 'link') {
        element = document.createElement('link');
        element.rel = attributes.rel;
        element.href = attributes.href;
    } else if (type === 'style') {
        element = document.createElement('style');
        element.rel = 'stylesheet';
        element.appendChild(document.createTextNode(attributes.css));
    }
    document.head.appendChild(element);
}

function nextFrame(fn) {
    (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(fn);
}

/* ==================== 主题判定（与 GmeekButton 对齐） ==================== */
function getMode() {
    var mode = document.documentElement.getAttribute('data-color-mode');
    if (mode === 'dark' || mode === 'light') return mode;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* ==================== 目录容器 ==================== */
function createTOC() {
    var contentContainer = document.getElementById('content');
    if (!contentContainer) return;
    var tocElement = document.createElement('div');
    tocElement.className = 'toc';
    if (contentContainer.firstChild) {
        contentContainer.insertBefore(tocElement, contentContainer.firstChild);
    } else {
        contentContainer.appendChild(tocElement);
    }
}

/* ==================== 目录链接随机彩色 ==================== */
function colorizeTOC() {
    var isDark = (getMode() === 'dark');
    var lightL = isDark ? 64 : 42;
    var hoverL = isDark ? 74 : 32;

    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        var hue = a.dataset.hue !== undefined
            ? parseInt(a.dataset.hue, 10)
            : Math.floor(Math.random() * 360);
        a.dataset.hue = String(hue);

        var baseColor = 'hsl(' + hue + ', 65%, ' + lightL + '%)';
        var hoverColor = 'hsl(' + hue + ', 75%, ' + hoverL + '%)';

        a.style.setProperty('color', baseColor, 'important');
        a.style.transition = 'color 0.25s, background-color 0.25s';

        if (a._onEnter) a.removeEventListener('mouseenter', a._onEnter);
        if (a._onLeave) a.removeEventListener('mouseleave', a._onLeave);

        a._onEnter = function () { a.style.setProperty('color', hoverColor, 'important'); };
        a._onLeave = function () { a.style.setProperty('color', baseColor, 'important'); };
        a.addEventListener('mouseenter', a._onEnter);
        a.addEventListener('mouseleave', a._onLeave);
    });
}

/* ==================== 隐藏空目录 ==================== */
var emptyTOCChecked = false;
function hideEmptyTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    if (!toc.querySelector('a.toc-link')) {
        if (!emptyTOCChecked) {
            emptyTOCChecked = true;
            setTimeout(function () {
                if (!toc.querySelector('a.toc-link')) toc.style.display = 'none';
            }, 600);
        } else {
            toc.style.display = 'none';
        }
    } else {
        toc.style.display = '';
    }
}

/* ==================== 逐级折叠核心 ==================== */
/**
 * tocbot 的 DOM 结构（每个 li）:
 *   <li class="toc-list-item" data-level="N">
 *     <a class="toc-link"></a>
 *     <ol class="toc-list">          <-- 直接子列表 = N+1 级
 *       <li class="toc-list-item" data-level="N+1">...</li>
 *     </ol>
 *   </li>
 * 我们只控制"直接子列表"的显示，实现"点击 N 级 → 展开 N+1 级"。
 */

function getDirectSubList(li) {
    // :scope > .toc-list 只拿直接子列表
    return li.querySelector(':scope > .toc-list');
}

function setSubListOpen(li, open) {
    var sub = getDirectSubList(li);
    if (!sub) return;
    if (open) {
        sub.style.display = '';
        sub.style.maxHeight = 'none';
        sub.style.opacity = '1';
        // 移除 tocbot 的折叠类，避免其过渡干扰
        sub.classList.remove('is-collapsible');
        sub.classList.add('is-open');
        li.dataset.subOpen = '1';
    } else {
        sub.style.display = 'none';
        sub.style.maxHeight = '';
        sub.style.opacity = '';
        li.dataset.subOpen = '0';
    }
}

function getLevel(li) {
    var raw = li.getAttribute('data-level');
    var n = raw ? parseInt(raw, 10) : 1;
    return isNaN(n) ? 1 : n;
}

/**
 * 初始化折叠状态：
 * - 对于 level >= randomDepth 的 li，折叠其直接子列表
 * - 也就是：randomDepth=3 时，3 级 li 的子列表(4级)默认折叠；
 *            randomDepth=4 时，4 级 li 的子列表(5级)默认折叠。
 * - 1/2 级始终展开（否则目录一开始就看不到内容）
 */
function initCollapseState(randomDepth) {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var allLis = toc.querySelectorAll('li.toc-list-item');
    allLis.forEach(function (li) {
        var level = getLevel(li);
        var sub = getDirectSubList(li);
        if (!sub) return; // 叶子节点

        // 默认：level < randomDepth 的展开，>= randomDepth 的折叠
        if (level >= randomDepth) {
            setSubListOpen(li, false);
        } else {
            setSubListOpen(li, true);
        }
    });
}

/**
 * 点击处理：
 * - 点击 level L 的链接（L < 6）→ 展开其直接子列表（L+1 级）
 *   同时把子列表里每个 li 的"更下一级"恢复为折叠（如果 > randomDepth），
 *   保证"点击4级展开5级，但5级的6级子目录仍是折叠的"。
 * - 点击 level 6 → 无反应
 */
function onTocClick(e) {
    var link = e.target.closest('a.toc-link');
    if (!link) return;
    var li = link.closest('li.toc-list-item');
    if (!li) return;

    var level = getLevel(li);
    if (level >= 6) return; // 6 级无反应

    var sub = getDirectSubList(li);
    if (!sub) return; // 没有下一级

    var wasOpen = li.dataset.subOpen === '1';
    if (wasOpen) {
        // 再次点击已展开的，收起（可选：若你只想展开不想收起，删除这段）
        setSubListOpen(li, false);
        return;
    }

    // 展开下一级
    setSubListOpen(li, true);

    // 子列表里每个直接子 li：若 level+1 >= randomDepth，则其下一级仍折叠
    // 这样"点击4级展开5级"后，5级的6级子目录仍是折叠的（除非 5 < randomDepth）
    var childItems = sub.querySelectorAll(':scope > li.toc-list-item');
    childItems.forEach(function (childLi) {
        var childLevel = getLevel(childLi);
        var childSub = getDirectSubList(childLi);
        if (!childSub) return;
        // 只有当 childLevel+1 大于初始展开阈值时才折叠
        // 简化：只要 childLevel >= randomDepth 就折叠（保持逐级）
        if (childLevel >= window.__gmeekTocRandomDepth) {
            setSubListOpen(childLi, false);
        } else {
            setSubListOpen(childLi, true);
        }
    });
}

function enhanceTOCBehavior(randomDepth) {
    var toc = document.querySelector('.toc');
    if (!toc || toc.dataset.enhanced === 'true') return;
    toc.dataset.enhanced = 'true';

    window.__gmeekTocRandomDepth = randomDepth;

    // 隐藏 6 级的 tocbot 折叠按钮（如果有）
    toc.querySelectorAll('li[data-level="6"] .toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    toc.addEventListener('click', onTocClick);
}

/* ==================== 主题绘制与监听（关键修复） ==================== */
var currentMode = null;
var themeTicking = false;

/**
 * 统一主题应用（参考 GmeekButton-Top-Foot 的 applyTheme）
 * - 每次都强制把 data-theme 同步到 .toc
 * - 只要 mode 变化就重绘颜色
 */
function applyTheme() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var mode = getMode();
    var changed = (mode !== currentMode);
    currentMode = mode;

    // 强制同步 data-theme（CSS 选择器 [data-theme="dark"] 依赖此属性）
    if (toc.getAttribute('data-theme') !== mode) {
        toc.setAttribute('data-theme', mode);
    }

    // 只要 mode 变了就重绘链接颜色（背景色由 CSS 自动跟随 data-theme）
    if (changed) {
        colorizeTOC();
    }
}

function refreshTheme() {
    if (themeTicking) return;
    themeTicking = true;
    nextFrame(function () {
        themeTicking = false;
        applyTheme();
    });
}

/**
 * 幂等包裹 modeSwitch：每次 refreshTheme 前检查，
 * 避免"脚本加载时序导致劫持不到"或"被重复包裹"。
 */
function wrapModeSwitch() {
    if (typeof window.modeSwitch !== 'function') return;
    if (window.modeSwitch.__gmeekTocWrapped) return;

    var original = window.modeSwitch;
    var wrapped = function () {
        var ret = original.apply(this, arguments);
        // 双保险：立即刷新 + 延迟刷新
        setTimeout(refreshTheme, 10);
        setTimeout(refreshTheme, 100);
        return ret;
    };
    wrapped.__gmeekTocWrapped = true;
    window.modeSwitch = wrapped;
}

function setupThemeListener() {
    // 1. 监听 html[data-color-mode] 变化（与按钮脚本一致，用 attributeFilter）
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-mode']
        });
        // 兜底：有些主题切换改 body class
        if (document.body) {
            observer.observe(document.body, { attributes: true });
        }
    }

    // 2. 系统偏好监听（data-color-mode=auto 场景）
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }

    // 3. 劫持全局 modeSwitch（Gmeek 官方主题切换按钮）
    //    用轮询+幂等包裹，解决时序问题
    wrapModeSwitch();
    var tryWrap = setInterval(function () {
        if (window.modeSwitch && !window.modeSwitch.__gmeekTocWrapped) {
            wrapModeSwitch();
        }
    }, 500);
    // 10 秒后停止轮询（脚本早该加载完了）
    setTimeout(function () { clearInterval(tryWrap); }, 10000);

    // 4. 自定义事件兜底
    document.addEventListener('themechange', refreshTheme);
}

/* ==================== 样式注入 ==================== */
function injectTOCStyle() {
    var css = `
        .toc.toc {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(300px);
            width: 220px;
            padding: 16px 16px 16px 20px;
            border-radius: 14px;
            max-height: 60vh;
            overflow-y: auto;
            z-index: 100;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            scrollbar-width: thin;

            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12),
                        0 8px 10px -6px rgba(0,0,0,0.08),
                        0 0 0 1px rgba(255,255,255,0.6) inset;
            scrollbar-color: #cbd5e1 transparent;
        }
        .toc.toc:hover {
            box-shadow: 0 14px 30px -6px rgba(0,0,0,0.16),
                        0 10px 14px -8px rgba(0,0,0,0.1),
                        0 0 0 1px rgba(255,255,255,0.8) inset;
        }

        .toc.toc[data-theme="dark"] {
            background: rgba(30, 41, 59, 0.92) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5),
                        0 8px 10px -6px rgba(0,0,0,0.35),
                        0 0 0 1px rgba(255,255,255,0.06) inset;
            scrollbar-color: #475569 transparent;
        }
        .toc.toc[data-theme="dark"]:hover {
            box-shadow: 0 14px 30px -6px rgba(0,0,0,0.6),
                        0 10px 14px -8px rgba(0,0,0,0.45),
                        0 0 0 1px rgba(255,255,255,0.08) inset;
        }

        .toc.toc::-webkit-scrollbar { width: 6px; background-color: transparent; }
        .toc.toc::-webkit-scrollbar-track { background-color: transparent; }
        .toc.toc::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .toc.toc[data-theme="dark"]::-webkit-scrollbar-thumb { background-color: #475569; }

        .toc.toc .toc-list { padding-left: 0; margin: 0; list-style: none; }
        .toc.toc .toc-list-item { margin: 2px 0; list-style: none; }
        .toc.toc .toc-list .toc-list { padding-left: 12px; }

        .toc.toc a.toc-link {
            display: block;
            padding: 4px 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            text-decoration: none;
            border-radius: 6px;
            border-left: 2px solid transparent;
            word-break: break-word;
        }
        .toc.toc a.toc-link:hover {
            background-color: #f3f4f6;
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] a.toc-link:hover {
            background-color: #334155;
        }
        .toc.toc .is-active-link {
            font-weight: 600;
            background-color: #eff6ff;
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] .is-active-link {
            background-color: #1e3a8a;
            color: #e0e7ff !important;
        }

        /* 折叠过渡（由我们的 setSubListOpen 控制 display，这里仅做辅助） */
        .toc.toc .is-collapsible {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .toc.toc .is-collapsible.is-open {
            max-height: 1000px;
            opacity: 1;
        }

        @media (max-width: 1249px) {
            .toc.toc {
                position: static;
                transform: none;
                width: 100%;
                max-height: none;
                margin-bottom: 20px;
                padding: 14px;
            }
        }
    `;
    loadResource('style', { css: css });
}

/* ==================== 初始化 ==================== */
document.addEventListener('DOMContentLoaded', function () {
    createTOC();
    injectTOCStyle();

    var randomDepth = Math.random() < 0.5 ? 3 : 4;

    // 尽早开始监听主题（不依赖 tocbot 加载）
    setupThemeListener();

    loadResource('script', {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js'
    }, function () {
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
            collapseDepth: randomDepth
        });

        // 等 tocbot 渲染完 DOM
        setTimeout(function () {
            // 主题：先强制应用一次
            currentMode = null;
            applyTheme();

            hideEmptyTOC();

            // 逐级折叠：初始化 + 绑定点击
            initCollapseState(randomDepth);
            enhanceTOCBehavior(randomDepth);

            // 再刷新几次兜底（tocbot 可能异步补类）
            setTimeout(refreshTheme, 200);
            setTimeout(refreshTheme, 600);
        }, 100);
    });

    loadResource('link', {
        rel: 'stylesheet',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css'
    });

    var headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    headings.forEach(function (heading) {
        if (!heading.id) heading.id = heading.textContent.trim().replace(/\s+/g, '-');
    });

    var footerPlaceholder = document.createElement('div');
    footerPlaceholder.style.height = window.innerHeight + 'px';
    document.body.appendChild(footerPlaceholder);

    console.log("\n %c GmeekTocBot Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#C333D0;color:#fff");
});

/**
 * TODO 随机展开3/4级目录，点击展开下一级，最深展示6级 目前未完成
 * 2026年11月6日23:04:50
 * 
 */
