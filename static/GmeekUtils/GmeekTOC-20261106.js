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
function getMode() {
    var mode = document.documentElement.getAttribute('data-color-mode');
    if (mode === 'dark' || mode === 'light') return mode;
    // [FIX-3] 兼容 class="dark" 的切换方式
    if (document.documentElement.classList.contains('dark')) return 'dark';
    if (document.documentElement.classList.contains('light')) return 'light';
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
    var mode = getMode();
    var dark = mode === 'dark';
    var light = dark ? 64 : 42;
    var lightHover = dark ? 74 : 32;
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        // [FIX-1] 主题变化时必须重算，不再被 data-colored 早退
        var alreadyColored = a.dataset.colored === 'true';
        var sameTheme = a.dataset.coloredTheme === mode;
        if (alreadyColored && sameTheme) return;

        // [FIX-5] 色相只在首次随机，之后沿用，避免切换主题时颜色跳变
        var hue = a.dataset.hue !== undefined
            ? parseInt(a.dataset.hue, 10)
            : Math.floor(Math.random() * 360);
        a.dataset.hue = String(hue);
        a.dataset.colored = 'true';
        a.dataset.coloredTheme = mode;

        a.style.color = 'hsl(' + hue + ', 65%, ' + light + '%)';
        a.style.transition = 'color 0.25s, background-color 0.25s';

        // [FIX-4] 先移除旧监听再绑定，防止累积
        if (a._onEnter) a.removeEventListener('mouseenter', a._onEnter);
        if (a._onLeave) a.removeEventListener('mouseleave', a._onLeave);

        a._onEnter = function () {
            a.style.color = 'hsl(' + hue + ', 75%, ' + lightHover + '%)';
        };
        a._onLeave = function () {
            a.style.color = 'hsl(' + hue + ', 65%, ' + light + '%)';
        };
        a.addEventListener('mouseenter', a._onEnter);
        a.addEventListener('mouseleave', a._onLeave);
    });
}

/* ==================== 隐藏空目录 ==================== */
var emptyTOCChecked = false;
function hideEmptyTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    // [FIX-6] 二次校验：tocbot 可能延迟渲染，避免误隐藏
    if (!toc.querySelector('a.toc-link')) {
        if (!emptyTOCChecked) {
            emptyTOCChecked = true;
            setTimeout(function () {
                if (!toc.querySelector('a.toc-link')) {
                    toc.style.display = 'none';
                }
            }, 600);
        } else {
            toc.style.display = 'none';
        }
    } else {
        toc.style.display = '';
    }
}

/* ==================== 增强折叠逻辑（事件代理，防拦截） ==================== */
function enhanceTOCBehavior() {
    var toc = document.querySelector('.toc');
    if (!toc || toc.dataset.enhanced === 'true') return;
    toc.dataset.enhanced = 'true';

    // 隐藏 6 级目录的折叠按钮
    toc.querySelectorAll('li[data-level="6"] .toc-collapse-button').forEach(function (btn) {
        btn.style.display = 'none';
    });

    // 事件代理
    toc.addEventListener('click', function (e) {
        var link = e.target.closest('a.toc-link');
        if (!link) return;

        var li = link.closest('li');
        if (!li) return;

        // [OPT-4] level 缺失时容错为 1，避免 NaN
        var rawLevel = li.getAttribute('data-level');
        var level = rawLevel ? parseInt(rawLevel, 10) : 1;
        if (isNaN(level)) level = 1;

        if (level >= 6) return;

        var subList = li.querySelector('.toc-list');
        if (subList) {
            // 让 tocbot 内部跳转逻辑先执行，再强制展开
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
// [OPT-1] 主题色全部由 CSS 变量驱动，JS 只切 data-theme + 更新变量
function paintTOC(mode) {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    toc.setAttribute('data-theme', mode);

    if (mode === 'dark') {
        toc.style.setProperty('--toc-bg', 'rgba(30, 41, 59, 0.92)');
        toc.style.setProperty('--toc-border', 'rgba(255, 255, 255, 0.08)');
        toc.style.setProperty('--toc-shadow',
            '0 10px 25px -5px rgba(0, 0, 0, 0.5),' +
            '0 8px 10px -6px rgba(0, 0, 0, 0.35),' +
            '0 0 0 1px rgba(255, 255, 255, 0.06) inset');
    } else {
        toc.style.setProperty('--toc-bg', '#ffffff');
        toc.style.setProperty('--toc-border', '#e5e7eb');
        toc.style.setProperty('--toc-shadow',
            '0 10px 25px -5px rgba(0, 0, 0, 0.12),' +
            '0 8px 10px -6px rgba(0, 0, 0, 0.08),' +
            '0 0 0 1px rgba(255, 255, 255, 0.6) inset');
    }
}

/* ==================== 主题刷新 ==================== */
var currentMode = null;
var themeTicking = false;

function refreshTheme(force) {
    if (themeTicking) return;
    themeTicking = true;
    nextFrame(function () {
        themeTicking = false;
        var mode = getMode();
        // [FIX-2] force 或模式真正变化时才重绘；首次必执行
        if (!force && mode === currentMode) return;
        currentMode = mode;
        paintTOC(mode);
        colorizeTOC();
    });
}

/* ==================== 主题自动触发（五层监听 + 去抖） ==================== */
function setupThemeAutoTrigger() {
    var lastMode = getMode();
    var debounceTimer = null;

    // 统一入口：去抖后比对，模式变了才刷新
    function trigger(reason) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            var mode = getMode();
            if (mode !== lastMode) {
                lastMode = mode;
                refreshTheme(true);
            }
        }, 30);
    }

    // ---------- ① 属性/class 变化（MutationObserver）----------
    if (window.MutationObserver) {
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === 'attributes') {
                    trigger('MutationObserver:' + m.attributeName);
                    return;
                }
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-mode', 'class', 'style']
        });
        // 同时监听 body，部分主题把 class 挂在 body 上
        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'data-color-mode']
            });
        }
    }

    // ---------- ② 系统偏好变化（matchMedia）----------
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        var mediaHandler = function () { trigger('matchMedia'); };
        if (media.addEventListener) media.addEventListener('change', mediaHandler);
        else if (media.addListener) media.addListener(mediaHandler);
    }

    // ---------- ③ 自定义事件（主题框架 dispatch）----------
    ['gmeek:themechange', 'themechange', 'color-mode-change', 'darkmode:toggle']
        .forEach(function (name) {
            document.addEventListener(name, function () { trigger('event:' + name); });
            window.addEventListener(name, function () { trigger('event:' + name); });
        });

    // ---------- ④ 点击拦截（兜底：切换按钮点击后延时检测）----------
    document.addEventListener('click', function (e) {
        var t = e.target;
        var hint = '';
        while (t && t !== document) {
            hint = (t.id || '') + ' ' + (t.className || '') + ' ' +
                   (t.getAttribute && (t.getAttribute('aria-label') || '') || '');
            if (/theme|dark|mode|color-scheme|switch/i.test(hint)) {
                setTimeout(function () { trigger('click-hint'); }, 120);
                setTimeout(function () { trigger('click-hint-late'); }, 400);
                break;
            }
            t = t.parentNode;
        }
    }, true);

    // ---------- ⑤ 最后兜底：低频轮询（1s 一次，模式变了才刷新）----------
    var pollTimer = setInterval(function () {
        var mode = getMode();
        if (mode !== lastMode) {
            lastMode = mode;
            refreshTheme(true);
        }
    }, 1000);
    // 页面隐藏时停止轮询，节省资源
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            clearInterval(pollTimer);
        } else {
            pollTimer = setInterval(function () {
                var mode = getMode();
                if (mode !== lastMode) { lastMode = mode; refreshTheme(true); }
            }, 1000);
        }
    });
}

/* ==================== 样式注入 ==================== */
function injectTOCStyle() {
    var css = `
        .toc {
            --toc-bg: #ffffff;
            --toc-border: #e5e7eb;
            --toc-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12),
                          0 8px 10px -6px rgba(0, 0, 0, 0.08),
                          0 0 0 1px rgba(255, 255, 255, 0.6) inset;
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(300px);
            width: 220px;
            padding: 16px 16px 16px 20px;
            border-radius: 14px;
            border: 1px solid var(--toc-border);
            background: var(--toc-bg);
            box-shadow: var(--toc-shadow);
            max-height: 60vh;
            overflow-y: auto;
            z-index: 100;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .toc[data-theme="dark"] {
            scrollbar-color: #475569 transparent;
        }
        .toc::-webkit-scrollbar { width: 6px; background-color: transparent; }
        .toc::-webkit-scrollbar-track { background-color: transparent; }
        .toc::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .toc[data-theme="dark"]::-webkit-scrollbar-thumb { background-color: #475569; }

        .toc:hover {
            box-shadow:
                0 14px 30px -6px rgba(0, 0, 0, 0.16),
                0 10px 14px -8px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        .toc[data-theme="dark"]:hover {
            box-shadow:
                0 14px 30px -6px rgba(0, 0, 0, 0.6),
                0 10px 14px -8px rgba(0, 0, 0, 0.45),
                0 0 0 1px rgba(255, 255, 255, 0.08) inset;
        }

        .toc .toc-list { padding-left: 0; margin: 0; list-style: none; }
        .toc .toc-list-item { margin: 2px 0; list-style: none; }
        .toc .toc-list .toc-list { padding-left: 12px; }

        .toc a.toc-link {
            display: block;
            padding: 4px 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            text-decoration: none;
            border-radius: 6px;
            border-left: 2px solid transparent;
            word-break: break-word;
        }
        .toc a.toc-link:hover {
            background-color: #f3f4f6;
            border-left-color: currentColor;
        }
        .toc[data-theme="dark"] a.toc-link:hover {
            background-color: #334155;
        }
        .toc .is-active-link {
            font-weight: 600;
            background-color: #eff6ff;
            border-left-color: currentColor;
        }
        .toc[data-theme="dark"] .is-active-link {
            background-color: #1e3a8a;
            color: #e0e7ff !important;
        }

        .toc .is-collapsible {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .toc .is-collapsible.is-open {
            max-height: 1000px;
            opacity: 1;
        }

        @media (max-width: 1249px) {
            .toc {
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

    // 默认深度：随机 3 或 4
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

        currentMode = getMode();
        paintTOC(currentMode);
        colorizeTOC();

        setTimeout(function () {
            colorizeTOC();
            hideEmptyTOC();
            enhanceTOCBehavior();
        }, 300);

        // ✅ [AUTO-1] 主题切换自动触发（五层监听 + 去抖）
        setupThemeAutoTrigger();

        // [OPT-3] 兜底刷新，覆盖 tocbot 异步渲染
        setTimeout(function () { refreshTheme(true); }, 500);
        setTimeout(function () { refreshTheme(true); }, 1200);
    });

    loadResource('link', {
        rel: 'stylesheet',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css'
    });

    // 补全 heading id
    var headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    headings.forEach(function (heading) {
        if (!heading.id) {
            heading.id = heading.textContent.trim().replace(/\s+/g, '-');
        }
    });

    // 底部占位，保证能滚动到末尾
    var footerPlaceholder = document.createElement('div');
    footerPlaceholder.style.height = window.innerHeight + 'px';
    document.body.appendChild(footerPlaceholder);

    console.log("\n %c GmeekTocBot Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#C333D0;color:#fff");
});

/* ==================== 对外 API（可选手动调用） ==================== */
window.GmeekTOC = {
    refresh: function () { refreshTheme(true); },
    getMode: getMode,
    colorize: colorizeTOC
};