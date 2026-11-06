/**
 * GmeekTOC-20261106.js
 * GmeekTOC 文章目录工具 固定展开5级目录，隐藏6级目录，移除折叠逻辑
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

/* ==================== 主题判定 ==================== */
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

/* ==================== 字体随机彩色 ==================== */
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
function hideEmptyTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    if (!toc.querySelector('a.toc-link')) {
        setTimeout(function () {
            if (!toc.querySelector('a.toc-link')) toc.style.setProperty('display', 'none', 'important');
        }, 600);
    } else {
        toc.style.display = '';
    }
}

/* ==================== 目录展开与隐藏控制 ==================== */
// 强制展开 1-5 级，并隐藏第 6 级及以下的节点
function processTOCLevels() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    // 1. 强制展开所有目录列表，防止 tocbot 的折叠样式生效
    var allLists = toc.querySelectorAll('.toc-list');
    allLists.forEach(function (list) {
        list.style.setProperty('display', 'block', 'important');
        list.style.setProperty('max-height', 'none', 'important');
        list.style.setProperty('opacity', '1', 'important');
        list.classList.remove('is-collapsible', 'is-collapsed');
    });

    // 2. 移除所有折叠按钮（如果有）
    toc.querySelectorAll('.toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    // 3. 隐藏第 6 级目录及以上的节点
    var allLis = toc.querySelectorAll('li.toc-list-item');
    allLis.forEach(function (li) {
        var level = parseInt(li.getAttribute('data-level') || '1', 10);
        if (level >= 6) {
            li.style.setProperty('display', 'none', 'important');
        } else {
            li.style.setProperty('display', 'list-item', 'important');
        }
    });
}

/* ==================== 主题绘制 ==================== */
var currentMode = null;
var themeTicking = false;

function paintTOC(toc, mode) {
    if (!toc) return;
    var hue = 220;
    var s = toc.style;

    if (mode === 'dark') {
        s.setProperty('background', 'linear-gradient(145deg, ' + hsl(hue, 24, 18) + ', ' + hsl(hue, 30, 11) + ')', 'important');
        s.setProperty('border', '1px solid ' + hsla(hue, 60, 70, 0.28), 'important');
        s.setProperty('box-shadow',
            '0 10px 25px -5px hsla(' + hue + ', 70%, 45%, 0.5), ' +
            '0 8px 10px -6px rgba(0, 0, 0, 0.5), ' +
            '0 0 0 1px rgba(255, 255, 255, 0.12) inset', 'important');
        s.setProperty('scrollbar-color', '#475569 transparent', 'important');
    } else {
        s.setProperty('background', 'linear-gradient(145deg, #ffffff, ' + hsl(hue, 45, 97) + ')', 'important');
        s.setProperty('border', '1px solid ' + hsla(hue, 45, 55, 0.22), 'important');
        s.setProperty('box-shadow',
            '0 10px 25px -5px hsla(' + hue + ', 70%, 45%, 0.42), ' +
            '0 8px 10px -6px rgba(15, 23, 42, 0.18), ' +
            '0 0 0 1px rgba(255, 255, 255, 0.9) inset', 'important');
        s.setProperty('scrollbar-color', '#cbd5e1 transparent', 'important');
    }
}

function applyTheme() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var mode = getMode();
    paintTOC(toc, mode);
    if (mode !== currentMode) {
        currentMode = mode;
        toc.setAttribute('data-theme', mode);
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

function wrapModeSwitch() {
    if (typeof window.modeSwitch !== 'function' || window.modeSwitch.__gmeekTocWrapped) return;
    var original = window.modeSwitch;
    window.modeSwitch = function () {
        var ret = original.apply(this, arguments);
        setTimeout(refreshTheme, 10);
        setTimeout(refreshTheme, 100);
        return ret;
    };
    window.modeSwitch.__gmeekTocWrapped = true;
}

function setupThemeListener() {
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
        if (document.body) observer.observe(document.body, { attributes: true });
    }
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }
    wrapModeSwitch();
    var tryWrap = setInterval(wrapModeSwitch, 500);
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
            max-height: 70vh;
            overflow-y: auto;
            z-index: 100;
            scrollbar-width: thin;
            background: transparent !important; 
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
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

        /* 禁止 tocbot 自身的 max-height 过渡动画，防止逻辑冲突 */
        .toc .is-collapsible {
            transition: none !important;
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
    setupThemeListener();

    loadResource('script', {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js'
    }, function () {
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            // 移除平滑滚动，交给浏览器默认锚点跳转
            scrollSmooth: false,
            // collapseDepth 设置为 6（大于或等于 6），代表让 tocbot 初始渲染全部，折叠和隐藏由我们自己的 processTOCLevels 覆盖
            collapseDepth: 6
        });

        var applyAll = function () {
            applyTheme();
            hideEmptyTOC();
            processTOCLevels();
        };

        // 延迟执行以确保 tocbot 渲染完毕
        setTimeout(applyAll, 50);
        setTimeout(applyAll, 300);

        // 用 MutationObserver 监控 tocbot 的修改，防止它异步给 6 级目录加上奇怪的类
        var toc = document.querySelector('.toc');
        if (toc && window.MutationObserver) {
            var mo = new MutationObserver(function (mutations) {
                var needFix = false;
                mutations.forEach(function (m) {
                    if (m.type === 'attributes' && m.attributeName === 'class') {
                        needFix = true;
                    }
                });
                if (needFix) {
                    processTOCLevels();
                    mo.disconnect();
                    setTimeout(function () { mo.observe(toc, { attributes: true, subtree: true, attributeFilter: ['class'] }); }, 100);
                }
            });
            mo.observe(toc, { attributes: true, subtree: true, attributeFilter: ['class'] });
        }
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
});

/**
 * 2026年11月7日00:15:34
 */