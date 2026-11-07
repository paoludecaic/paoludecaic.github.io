/**
 * GmeekTOC-20261107.js
 * GmeekTOC 文章目录工具 强制展开 1-5 级目录，物理移除 6 级目录，隐藏空目录
 * 20261107 版本号 2026年11月7日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 *
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261107.js
 * 引用方法 "script":"<script src='https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261107.js'></script>"
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

/* ==================== 字体随机彩色（与 GmeekButton 同款彩色 + 字体阴影） ==================== */
function colorizeTOC(force) {
    var dark = getMode() === 'dark';
    // 与按钮 paint() 同款明度：dark 68 / hover 78，light 42 / hover 32
    var light = dark ? 68 : 42;
    var lightHover = dark ? 78 : 32;
    var shadowAlpha = dark ? 0.45 : 0.28;
    var shadowHoverAlpha = dark ? 0.75 : 0.55;

    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        if (a.dataset.colored && !force) return;
        a.dataset.colored = 'true';

        var hue = randomHue();
        a.style.setProperty('--toc-hue', String(hue));
        a.style.color = hsl(hue, 65, light);
        a.style.textShadow = '0 1px 2px ' + hsla(hue, 70, dark ? 8 : 30, shadowAlpha);
        a.style.transition = 'color 0.25s, background-color 0.25s, text-shadow 0.25s';

        a.onmouseenter = function () {
            a.style.color = hsl(hue, 75, lightHover);
            a.style.textShadow = '0 0 10px ' + hsla(hue, 90, dark ? 60 : 50, shadowHoverAlpha);
        };
        a.onmouseleave = function () {
            a.style.color = hsl(hue, 65, light);
            a.style.textShadow = '0 1px 2px ' + hsla(hue, 70, dark ? 8 : 30, shadowAlpha);
        };
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

    // 先收集，再删除，避免边遍历边删导致 NodeList 失效
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

    // 清理因删除而变空的 ol
    toc.querySelectorAll('ol.toc-list').forEach(function (ol) {
        if (ol.querySelectorAll('li').length === 0) ol.remove();
    });
}

/* ==================== 目录展开控制：1-5 级强制展开，6 级物理移除 ==================== */
function processTOCLevels() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    // 1. 强制展开所有目录列表，清除 tocbot 折叠痕迹（1-5 级全部展开）
    var lists = toc.querySelectorAll('ol.toc-list, ul.toc-list');
    lists.forEach(function (list) {
        list.style.setProperty('display', 'block', 'important');
        list.style.setProperty('max-height', 'none', 'important');
        list.style.setProperty('opacity', '1', 'important');
        list.classList.remove('is-collapsible', 'is-collapsed');
    });

    // 2. 隐藏所有折叠按钮
    toc.querySelectorAll('.toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    // 3. 方案 B：按 li 深度删 6 级（兼容 data-level 缺失的情况）
    removeLevel6ByLiDepth();

    // 4. 若 tocbot 生成了 data-level=6（不同版本行为不同），也一并删掉
    toc.querySelectorAll('li[data-level="6"]').forEach(function (li) {
        if (li.parentNode) li.parentNode.removeChild(li);
    });

    // 5. 清理空子列表（二次保险）
    toc.querySelectorAll('li').forEach(function (li) {
        li.querySelectorAll('ol.toc-list').forEach(function (sub) {
            if (sub.querySelectorAll('li').length === 0) sub.remove();
        });
    });

    // 6. 5 级目录保持可见、不可折叠
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
        // 主题切换时强制重刷彩色与阴影，避免暗/亮色残留
        colorizeTOC(true);
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
        .toc.toc li[data-level="6"] {
            display: none !important;
        }

        /* 方案 C 第二道：按 li 嵌套深度隐藏第 6 层（不依赖 data-level） */
        .toc.toc ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li {
            display: none !important;
        }

        .toc.toc a.toc-link {
            display: block;
            padding: 4px 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            text-decoration: none;
            border-radius: 6px;
            border-left: 2px solid transparent;
            word-break: break-word;
            /* 字体阴影兜底：JS 内联样式优先，这里提供默认值 */
            text-shadow: 0 1px 2px rgba(15, 23, 42, 0.28);
        }
        .toc.toc a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.18);
            border-left-color: currentColor;
        }
        .toc.toc[data-theme="dark"] a.toc-link {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
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

        /* 禁止 tocbot 自身的 max-height 过渡动画 */
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
            // 方案 A：从源头不生成 h6，tocbot 不会为 6 级标题创建任何 li
            headingSelector: 'h1, h2, h3, h4, h5',
            scrollSmooth: false,
            collapseDepth: 6
        });

        var applyAll = function () {
            applyTheme();
            hideEmptyTOC();
            processTOCLevels();   // 含方案 B：按 li 深度删 6 级（兜底）
        };

        // 延迟执行以确保 tocbot 渲染完毕
        setTimeout(applyAll, 50);
        setTimeout(applyAll, 300);
        setTimeout(applyAll, 800); // 网络慢渲染晚的保险层

        // 持续守护：tocbot 后续若重建 DOM，再次清理 6 级
        // 注意：observer 内只做轻量删除，不整体重跑 processTOCLevels，避免死循环
        var toc = document.querySelector('.toc');
        if (toc && window.MutationObserver) {
            var mo = new MutationObserver(function (mutations) {
                var hasNew = mutations.some(function (m) {
                    return m.addedNodes && m.addedNodes.length > 0;
                });
                if (!hasNew) return;

                // 轻量清理：data-level=6 + 按 li 深度=6
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

                // 新增链接补色（含字体阴影）
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
 * 2026年11月7日13:45:42
 */