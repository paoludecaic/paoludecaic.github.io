/**
 * GmeekTOC-20261106.js
 * GmeekTOC 文章目录工具 固定展开4级目录，点击4级展开5级，点击5级展开6级，点击6级无反馈
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

function hsl(h, s, l) {
    return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

function hsla(h, s, l, a) {
    return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
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
    var lightL = isDark ? 68 : 42;
    var hoverL = isDark ? 78 : 32;

    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        var hue = a.dataset.hue !== undefined
            ? parseInt(a.dataset.hue, 10)
            : Math.floor(Math.random() * 360);
        a.dataset.hue = String(hue);

        var baseColor = hsl(hue, 65, lightL);
        var hoverColor = hsl(hue, 75, hoverL);

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
 * 只控制"直接子列表"的显示，实现"点击 N 级 → 展开 N+1 级"。
 */

function getDirectSubList(li) {
    return li.querySelector(':scope > .toc-list');
}

function setSubListOpen(li, open) {
    var sub = getDirectSubList(li);
    if (!sub) return;
    if (open) {
        sub.style.display = '';
        sub.style.maxHeight = 'none';
        sub.style.opacity = '1';
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
 * 初始化折叠状态（固定展开 4 级）：
 * - level >= 4 的 li，折叠其直接子列表（4级默认折叠5级）
 * - level < 4 的 li 全部展开（1/2/3级可见，4级本身可见）
 * - 叶子节点（无直接子列表）跳过 → 目录不足4级时全部展开
 */
function initCollapseState(openDepth) {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var allLis = toc.querySelectorAll('li.toc-list-item');
    allLis.forEach(function (li) {
        var level = getLevel(li);
        var sub = getDirectSubList(li);
        if (!sub) return; // 叶子节点，无下一级
        if (level >= openDepth) {
            setSubListOpen(li, false);
        } else {
            setSubListOpen(li, true);
        }
    });
}

/**
 * 点击处理：
 * - 点击 level L 的链接（L < 6）→ 切换其直接子列表（L+1 级）显隐
 * - 展开时，子列表中每个 li 的"更下一级"若 childLevel >= openDepth 则保持折叠
 * - 点击 level 6 → 无反馈
 */
function onTocClick(e) {
    var link = e.target.closest('a.toc-link');
    if (!link) return;
    var li = link.closest('li.toc-list-item');
    if (!li) return;

    var level = getLevel(li);
    if (level >= 6) return; // 6 级无反馈

    var sub = getDirectSubList(li);
    if (!sub) return; // 没有下一级

    var wasOpen = li.dataset.subOpen === '1';
    if (wasOpen) {
        setSubListOpen(li, false);
        return;
    }

    setSubListOpen(li, true);

    var openDepth = window.__gmeekTocOpenDepth || 4;
    var childItems = sub.querySelectorAll(':scope > li.toc-list-item');
    childItems.forEach(function (childLi) {
        var childLevel = getLevel(childLi);
        var childSub = getDirectSubList(childLi);
        if (!childSub) return;
        if (childLevel >= openDepth) {
            setSubListOpen(childLi, false);
        } else {
            setSubListOpen(childLi, true);
        }
    });
}

function enhanceTOCBehavior(openDepth) {
    var toc = document.querySelector('.toc');
    if (!toc || toc.dataset.enhanced === 'true') return;
    toc.dataset.enhanced = 'true';

    window.__gmeekTocOpenDepth = openDepth;

    toc.querySelectorAll('li[data-level="6"] .toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    toc.addEventListener('click', onTocClick);
}

/* ==================== 主题绘制与监听（与 GmeekButton 对齐） ==================== */
var currentMode = null;
var themeTicking = false;

/**
 * 用 GmeekButton-Top-Foot 的 paint() 同款逻辑给 .toc 上色：
 * - light: 白底渐变 + 深色描边 + 浅阴影
 * - dark : 深色渐变 + 亮色描边 + 深阴影
 * 阴影公式与按钮一致（多层 + 内高光），保留目录区域阴影效果。
 */
function paintTOC(toc, mode) {
    if (!toc) return;
    var hue = 220; // 与按钮默认色相同，保持中性蓝灰
    var s = toc.style;

    s.setProperty('--toc-hue', String(hue));

    if (mode === 'dark') {
        s.setProperty('--toc-bg', 'linear-gradient(145deg, ' + hsl(hue, 24, 18) + ', ' + hsl(hue, 30, 11) + ')');
        s.setProperty('--toc-border', hsla(hue, 60, 70, 0.28));
        s.setProperty('--toc-glow', '0.5');
        s.setProperty('--toc-glow-hover', '0.62');
        s.setProperty('--toc-shadow-color', 'rgba(0, 0, 0, 0.5)');
        s.setProperty('--toc-inset', 'rgba(255, 255, 255, 0.12)');
        s.setProperty('--toc-scrollbar', '#475569');
    } else {
        s.setProperty('--toc-bg', 'linear-gradient(145deg, #ffffff, ' + hsl(hue, 45, 97) + ')');
        s.setProperty('--toc-border', hsla(hue, 45, 55, 0.22));
        s.setProperty('--toc-glow', '0.42');
        s.setProperty('--toc-glow-hover', '0.55');
        s.setProperty('--toc-shadow-color', 'rgba(15, 23, 42, 0.18)');
        s.setProperty('--toc-inset', 'rgba(255, 255, 255, 0.9)');
        s.setProperty('--toc-scrollbar', '#cbd5e1');
    }
}

/**
 * 统一主题应用：
 * - 同步 data-theme 到 .toc（CSS 选择器依赖）
 * - mode 变化时重绘背景/边框/阴影 + 重新给链接上随机彩色
 */
function applyTheme() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var mode = getMode();
    var changed = (mode !== currentMode);
    currentMode = mode;

    if (toc.getAttribute('data-theme') !== mode) {
        toc.setAttribute('data-theme', mode);
    }

    // 每次都重绘背景变量，保证背景色始终跟随主题（即使 CSS 被外部覆盖也能兜底）
    paintTOC(toc, mode);

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
 * 幂等包裹 modeSwitch：避免时序问题或重复包裹。
 */
function wrapModeSwitch() {
    if (typeof window.modeSwitch !== 'function') return;
    if (window.modeSwitch.__gmeekTocWrapped) return;

    var original = window.modeSwitch;
    var wrapped = function () {
        var ret = original.apply(this, arguments);
        setTimeout(refreshTheme, 10);
        setTimeout(refreshTheme, 100);
        return ret;
    };
    wrapped.__gmeekTocWrapped = true;
    window.modeSwitch = wrapped;
}

function setupThemeListener() {
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-mode']
        });
        if (document.body) {
            observer.observe(document.body, { attributes: true });
        }
    }

    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }

    wrapModeSwitch();
    var tryWrap = setInterval(function () {
        if (window.modeSwitch && !window.modeSwitch.__gmeekTocWrapped) {
            wrapModeSwitch();
        }
    }, 500);
    setTimeout(function () { clearInterval(tryWrap); }, 10000);

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
            scrollbar-width: thin;

            /* 背景/边框/阴影全部走变量，由 paintTOC() 按主题写入（与 GmeekButton 一致） */
            background: var(--toc-bg, #ffffff) !important;
            border: 1px solid var(--toc-border, #e5e7eb) !important;
            box-shadow:
                0 10px 25px -5px hsla(var(--toc-hue, 220), 70%, 45%, var(--toc-glow, 0.42)),
                0 8px 10px -6px var(--toc-shadow-color, rgba(15,23,42,0.18)),
                0 0 0 1px var(--toc-inset, rgba(255,255,255,0.6)) inset;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            scrollbar-color: var(--toc-scrollbar, #cbd5e1) transparent;
        }
        .toc.toc:hover {
            box-shadow:
                0 14px 30px -6px hsla(var(--toc-hue, 220), 75%, 45%, var(--toc-glow-hover, 0.55)),
                0 10px 14px -8px var(--toc-shadow-color, rgba(15,23,42,0.18)),
                0 0 0 1px var(--toc-inset, rgba(255,255,255,0.8)) inset;
        }

        .toc.toc::-webkit-scrollbar { width: 6px; background-color: transparent; }
        .toc.toc::-webkit-scrollbar-track { background-color: transparent; }
        .toc.toc::-webkit-scrollbar-thumb {
            background-color: var(--toc-scrollbar, #cbd5e1);
            border-radius: 10px;
        }

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
            background-color: rgba(148, 163, 184, 0.18);
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.16);
        }
        .toc.toc .is-active-link {
            font-weight: 600;
            background-color: rgba(59, 130, 246, 0.12);
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] .is-active-link {
            background-color: rgba(96, 165, 250, 0.18);
        }

        /* 折叠过渡辅助（display 由 JS 控制，这里仅做辅助） */
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

    // 固定展开 4 级（原随机 3/4 改为固定 4）
    var openDepth = 4;

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
            // 初始交给 tocbot 展开到 4 级；随后由 initCollapseState 接管精确控制
            collapseDepth: openDepth
        });

        setTimeout(function () {
            currentMode = null;
            applyTheme();

            hideEmptyTOC();

            initCollapseState(openDepth);
            enhanceTOCBehavior(openDepth);

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
 * 2026年11月6日23:25:30
 * 
 */
