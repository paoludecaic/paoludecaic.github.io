/**
 * GmeekTOC-20261106.js
 * GmeekTOC 文章目录工具 强制展开 1-5 级目录，物理移除 6 级目录，隐藏空目录
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

/* ==================== 字体随机彩色（沿用 1104 版实现） ==================== */
function colorizeTOC() {
    var dark = getMode() === 'dark';
    var light = dark ? 64 : 42;
    var lightHover = dark ? 74 : 32;
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        if (a.dataset.colored) return;
        a.dataset.colored = 'true';

        var hue = Math.floor(Math.random() * 360);
        a.style.color = hsl(hue, 65, light);
        a.style.transition = 'color 0.25s, background-color 0.25s';
        a.addEventListener('mouseenter', function () {
            a.style.color = hsl(hue, 75, lightHover);
        });
        a.addEventListener('mouseleave', function () {
            a.style.color = hsl(hue, 65, light);
        });
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

    // 3. 物理移除 6 级目录节点
    var level6Lis = toc.querySelectorAll('li[data-level="6"]');
    level6Lis.forEach(function (li) {
        if (li.parentNode) li.parentNode.removeChild(li);
    });

    // 4. 清理因移除 6 级而变空的子列表（避免留下空隙）
    var level5Lis = toc.querySelectorAll('li[data-level="5"]');
    level5Lis.forEach(function (li) {
        li.querySelectorAll('ol.toc-list').forEach(function (subList) {
            if (subList.querySelectorAll('li').length === 0) subList.remove();
        });
    });

    // 5. 5 级目录本身不再展开（无子列表可展开），但保持可见
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

        /* 多重保险：CSS 层再封杀一遍 6 级 */
        .toc.toc li[data-level="6"] {
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
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: false,
            // 先让 tocbot 全部渲染，1-5 级展开由 processTOCLevels 统一强制展开
            // 6 级随后被物理移除
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
        setTimeout(applyAll, 800); // 网络慢渲染晚的保险层

        // 防止 tocbot 异步渲染后修改 DOM 导致折叠状态或 6 级重新出现
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
                    setTimeout(function () {
                        mo.observe(toc, { attributes: true, subtree: true, attributeFilter: ['class'] });
                    }, 100);
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
 * 2026年11月7日00:57:47
 */