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

/* ==================== 主题：读取 html[data-color-mode] ==================== */
// 与 GmeekButton-Top-Foot 保持一致：优先读 html[data-color-mode]，
// 为 auto 或缺失时退化为系统偏好。
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
// 每次全量重算，色相沿用 dataset.hue，避免主题切换时颜色跳变
function colorizeTOC() {
    var mode = getMode();
    var dark = mode === 'dark';
    var lightL = dark ? 64 : 42;
    var hoverL = dark ? 74 : 32;
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        var hue = a.dataset.hue !== undefined
            ? parseInt(a.dataset.hue, 10)
            : Math.floor(Math.random() * 360);
        a.dataset.hue = String(hue);

        var baseColor = 'hsl(' + hue + ', 65%, ' + lightL + '%)';
        var hoverColor = 'hsl(' + hue + ', 75%, ' + hoverL + '%)';

        a.style.color = baseColor;
        a.style.transition = 'color 0.25s, background-color 0.25s';

        if (a._onEnter) a.removeEventListener('mouseenter', a._onEnter);
        if (a._onLeave) a.removeEventListener('mouseleave', a._onLeave);

        a._onEnter = function () { a.style.color = hoverColor; };
        a._onLeave = function () { a.style.color = baseColor; };
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

/* ==================== 增强折叠逻辑 ==================== */
function enhanceTOCBehavior() {
    var toc = document.querySelector('.toc');
    if (!toc || toc.dataset.enhanced === 'true') return;
    toc.dataset.enhanced = 'true';

    toc.querySelectorAll('li[data-level="6"] .toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    toc.addEventListener('click', function (e) {
        var link = e.target.closest('a.toc-link');
        if (!link) return;
        var li = link.closest('li');
        if (!li) return;
        var rawLevel = li.getAttribute('data-level');
        var level = rawLevel ? parseInt(rawLevel, 10) : 1;
        if (isNaN(level)) level = 1;
        if (level >= 6) return;
        var subList = li.querySelector('.toc-list');
        if (subList) {
            setTimeout(function () {
                subList.querySelectorAll('.toc-list-item').forEach(function (item) {
                    item.classList.add('is-open');
                    item.classList.remove('is-collapsed');
                    item.classList.remove('is-collapsible');
                    item.style.maxHeight = 'none';
                    item.style.opacity = '1';
                });
            }, 10);
        }
    });
}

/* ==================== 主题绘制 ==================== */
// 参考 GmeekButton-Top-Foot 的 paint()：
// 只写 data-theme 属性 + CSS 变量，颜色全部由注入 CSS 的变量驱动。
// 暗/亮两套背景、边框、阴影、滚动条颜色均通过 CSS 变量切换。
function paintTOC(mode) {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    toc.setAttribute('data-theme', mode);

    var s = toc.style;
    if (mode === 'dark') {
        s.setProperty('--toc-bg', 'rgba(30, 41, 59, 0.92)');
        s.setProperty('--toc-border', 'rgba(255, 255, 255, 0.08)');
        s.setProperty('--toc-shadow-color', 'rgba(0, 0, 0, 0.5)');
        s.setProperty('--toc-shadow-color-soft', 'rgba(0, 0, 0, 0.35)');
        s.setProperty('--toc-inset', 'rgba(255, 255, 255, 0.06)');
        s.setProperty('--toc-shadow-hover-color', 'rgba(0, 0, 0, 0.6)');
        s.setProperty('--toc-shadow-hover-color-soft', 'rgba(0, 0, 0, 0.45)');
        s.setProperty('--toc-inset-hover', 'rgba(255, 255, 255, 0.08)');
        s.setProperty('--toc-scrollbar', '#475569');
        s.setProperty('--toc-hover-bg', '#334155');
        s.setProperty('--toc-active-bg', '#1e3a8a');
        s.setProperty('--toc-active-color', '#e0e7ff');
    } else {
        s.setProperty('--toc-bg', '#ffffff');
        s.setProperty('--toc-border', '#e5e7eb');
        s.setProperty('--toc-shadow-color', 'rgba(0, 0, 0, 0.12)');
        s.setProperty('--toc-shadow-color-soft', 'rgba(0, 0, 0, 0.08)');
        s.setProperty('--toc-inset', 'rgba(255, 255, 255, 0.6)');
        s.setProperty('--toc-shadow-hover-color', 'rgba(0, 0, 0, 0.16)');
        s.setProperty('--toc-shadow-hover-color-soft', 'rgba(0, 0, 0, 0.1)');
        s.setProperty('--toc-inset-hover', 'rgba(255, 255, 255, 0.8)');
        s.setProperty('--toc-scrollbar', '#cbd5e1');
        s.setProperty('--toc-hover-bg', '#f3f4f6');
        s.setProperty('--toc-active-bg', '#eff6ff');
        s.setProperty('--toc-active-color', '');
    }
}

/* ==================== 主题刷新 ==================== */
// 参考 GmeekButton-Top-Foot：rAF 节流，避免 MutationObserver 高频回调。
var themeTicking = false;
function refreshTheme() {
    if (themeTicking) return;
    themeTicking = true;
    nextFrame(function () {
        themeTicking = false;
        paintTOC(getMode());
        colorizeTOC();
    });
}

/* ==================== 主题自动触发 ==================== */
function setupThemeAutoTrigger() {
    // ① MutationObserver：监听 html[data-color-mode]（与按钮脚本一致）
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-mode']
        });
    }

    // ② 系统偏好变化（data-color-mode=auto 场景）
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }
}

/* ==================== 样式注入 ==================== */
// 参考 GmeekButton-Top-Foot：颜色全部由 CSS 变量驱动，
// 背景/边框/阴影/滚动条在亮暗之间通过变量值切换。
function injectTOCStyle() {
    var css = `
        .toc.toc {
            --toc-bg: #ffffff;
            --toc-border: #e5e7eb;
            --toc-shadow-color: rgba(0, 0, 0, 0.12);
            --toc-shadow-color-soft: rgba(0, 0, 0, 0.08);
            --toc-inset: rgba(255, 255, 255, 0.6);
            --toc-shadow-hover-color: rgba(0, 0, 0, 0.16);
            --toc-shadow-hover-color-soft: rgba(0, 0, 0, 0.1);
            --toc-inset-hover: rgba(255, 255, 255, 0.8);
            --toc-scrollbar: #cbd5e1;
            --toc-hover-bg: #f3f4f6;
            --toc-active-bg: #eff6ff;
            --toc-active-color: inherit;

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
            scrollbar-color: var(--toc-scrollbar) transparent;
            background: var(--toc-bg) !important;
            border: 1px solid var(--toc-border) !important;
            box-shadow: 0 10px 25px -5px var(--toc-shadow-color),
                        0 8px 10px -6px var(--toc-shadow-color-soft),
                        0 0 0 1px var(--toc-inset) inset;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .toc.toc:hover {
            box-shadow: 0 14px 30px -6px var(--toc-shadow-hover-color),
                        0 10px 14px -8px var(--toc-shadow-hover-color-soft),
                        0 0 0 1px var(--toc-inset-hover) inset;
        }

        .toc.toc::-webkit-scrollbar { width: 6px; background-color: transparent; }
        .toc.toc::-webkit-scrollbar-track { background-color: transparent; }
        .toc.toc::-webkit-scrollbar-thumb { background-color: var(--toc-scrollbar); border-radius: 10px; }

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
            background-color: var(--toc-hover-bg);
            border-left-color: currentColor;
        }
        .toc.toc .is-active-link {
            font-weight: 600;
            background-color: var(--toc-active-bg);
            color: var(--toc-active-color);
            border-left-color: currentColor;
        }

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

        // 首次绘制
        paintTOC(getMode());
        colorizeTOC();

        setTimeout(function () {
            paintTOC(getMode());
            colorizeTOC();
            hideEmptyTOC();
            enhanceTOCBehavior();
        }, 300);

        setupThemeAutoTrigger();

        // 兜底刷新（tocbot 异步渲染后）
        setTimeout(refreshTheme, 500);
        setTimeout(refreshTheme, 1200);
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
 * 2026年11月6日20:56:10
 * 
 */