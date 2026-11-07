/**
 * GmeekTOC-20261107.js
 * GmeekTOC 文章目录工具 强制展开 1-5 级目录，物理移除 6 级目录，隐藏空目录
 * 20261107 版本号 2026年11月7日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 修复目录字色问题，采用纯 CSS 变量渲染（参考 GmeekButton 逻辑），加入字体阴影。
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

function randomHue() {
    return Math.floor(Math.random() * 360);
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

/* ==================== 字体随机彩色注入（只赋色相变量，渲染交给 CSS） ==================== */
function colorizeTOC() {
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        // 如果没有色相变量，则随机分配一个
        if (!a.style.getPropertyValue('--toc-hue')) {
            a.style.setProperty('--toc-hue', String(randomHue()));
        }
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

/* ==================== 方案 B：按 li 嵌套深度物理移除第 6 级 ==================== */
function removeLevel6ByLiDepth() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var toRemove = [];
    toc.querySelectorAll('li').forEach(function (li) {
        var depth = 0, p = li;
        while (p && p !== toc) {
            if (p.tagName === 'LI') depth++;
            p = p.parentElement;
        }
        if (depth >= 6) toRemove.push(li);
    });

    toRemove.forEach(function (li) {
        if (li.parentNode) li.parentNode.removeChild(li);
    });

    toc.querySelectorAll('ol.toc-list').forEach(function (ol) {
        if (ol.querySelectorAll('li').length === 0) ol.remove();
    });
}

/* ==================== 目录展开控制 ==================== */
function processTOCLevels() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var lists = toc.querySelectorAll('ol.toc-list, ul.toc-list');
    lists.forEach(function (list) {
        list.style.setProperty('display', 'block', 'important');
        list.style.setProperty('max-height', 'none', 'important');
        list.style.setProperty('opacity', '1', 'important');
        list.classList.remove('is-collapsible', 'is-collapsed');
    });

    toc.querySelectorAll('.toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    removeLevel6ByLiDepth();

    toc.querySelectorAll('li[data-level="6"]').forEach(function (li) {
        if (li.parentNode) li.parentNode.removeChild(li);
    });

    toc.querySelectorAll('li').forEach(function (li) {
        li.querySelectorAll('ol.toc-list').forEach(function (sub) {
            if (sub.querySelectorAll('li').length === 0) sub.remove();
        });
    });

    toc.querySelectorAll('li[data-level="5"]').forEach(function (li) {
        li.classList.remove('is-collapsible', 'is-collapsed');
        li.style.setProperty('max-height', 'none', 'important');
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

/* ==================== 样式注入（核心逻辑改为 CSS 渲染） ==================== */
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

        /* 方案 C 第一道：data-level=6 兜底 */
        .toc.toc li[data-level="6"] { display: none !important; }

        /* 方案 C 第二道：按 li 嵌套深度隐藏第 6 层 */
        .toc.toc ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li {
            display: none !important;
        }

        /* ====== 彩色与字体阴影（参考 GmeekButton 同款效果） ====== */
        .toc.toc a.toc-link {
            display: block;
            padding: 4px 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            text-decoration: none;
            border-radius: 6px;
            border-left: 2px solid transparent;
            word-break: break-word;
            
            /* 基于 JS 注入的色相变量计算颜色 */
            --toc-hue: 220;
            color: hsl(var(--toc-hue), 65%, 42%) !important;
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 30%, 0.28) !important;
            transition: color 0.25s, background-color 0.25s, text-shadow 0.25s !important;
        }

        .toc.toc a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.18);
            border-left-color: currentColor;
            color: hsl(var(--toc-hue), 75%, 32%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 50%, 0.55) !important;
        }

        /* 暗色主题适配 */
        .toc.toc[data-theme="dark"] a.toc-link {
            color: hsl(var(--toc-hue), 65%, 68%) !important;
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 8%, 0.45) !important;
        }
        .toc.toc[data-theme="dark"] a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.16);
            color: hsl(var(--toc-hue), 75%, 78%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 60%, 0.75) !important;
        }

        /* 覆盖 tocbot 自带的 is-active-link */
        .toc.toc .is-active-link {
            font-weight: 600;
            background-color: rgba(59, 130, 246, 0.12);
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] .is-active-link {
            background-color: rgba(96, 165, 250, 0.18);
        }

        /* 禁止 tocbot 自身的 max-height 过渡动画 */
        .toc .is-collapsible { transition: none !important; }

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
            headingSelector: 'h1, h2, h3, h4, h5',
            scrollSmooth: false,
            collapseDepth: 6
        });

        var applyAll = function () {
            applyTheme();
            hideEmptyTOC();
            processTOCLevels();
            colorizeTOC(); // 注入颜色变量
        };

        // 延迟执行以确保 tocbot 渲染完毕
        setTimeout(applyAll, 50);
        setTimeout(applyAll, 300);
        setTimeout(applyAll, 800);

        // 持续守护：tocbot 后续若重建 DOM
        var toc = document.querySelector('.toc');
        if (toc && window.MutationObserver) {
            var mo = new MutationObserver(function (mutations) {
                var hasNew = mutations.some(function (m) {
                    return m.addedNodes && m.addedNodes.length > 0;
                });
                if (!hasNew) return;

                toc.querySelectorAll('li[data-level="6"]').forEach(function (li) {
                    if (li.parentNode) li.parentNode.removeChild(li);
                });
                var toRemove = [];
                toc.querySelectorAll('li').forEach(function (li) {
                    var depth = 0, p = li;
                    while (p && p !== toc) {
                        if (p.tagName === 'LI') depth++;
                        p = p.parentElement;
                    }
                    if (depth >= 6) toRemove.push(li);
                });
                toRemove.forEach(function (li) {
                    if (li.parentNode) li.parentNode.removeChild(li);
                });

                // 给新增链接补上色相变量
                colorizeTOC();
            });
            mo.observe(toc, { childList: true, subtree: true });
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
 * 2026-11-7 14:33:53
 */