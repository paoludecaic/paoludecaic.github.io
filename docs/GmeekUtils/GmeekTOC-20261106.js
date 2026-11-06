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

/* ==================== 主题判定：直接读实际背景亮度 ==================== */
// 不依赖 data-color-mode / class，因为 Gmeek 切换主题时这些属性可能不变。
// 逐级向上找第一个有非透明背景色的元素，用亮度判断明暗。
function parseColor(str) {
    if (!str) return null;
    var m = str.match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return {
        r: +m[0],
        g: +m[1],
        b: +m[2],
        a: m.length >= 4 ? parseFloat(m[3]) : 1
    };
}

function isDarkColor(colorStr) {
    var c = parseColor(colorStr);
    if (!c || c.a < 0.1) return null; // 透明，无法判断
    var lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    return lum < 128;
}

function detectDark() {
    // 从正文容器开始，逐级向上找第一个不透明背景
    var probe = document.querySelector('.markdown-body')
             || document.querySelector('#content')
             || document.querySelector('article')
             || document.body;
    var el = probe;
    while (el && el !== document.documentElement) {
        var bg = getComputedStyle(el).backgroundColor;
        var dark = isDarkColor(bg);
        if (dark !== null) return dark;
        el = el.parentElement;
    }
    // 再试 html 本身
    var htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    var htmlDark = isDarkColor(htmlBg);
    if (htmlDark !== null) return htmlDark;

    // 最后退化为系统偏好
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
    var dark = detectDark();
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
// 只写 data-theme 属性，颜色由注入 CSS 的 [data-theme="dark"] 选择器驱动。
// 去掉"相同就跳过"的守卫，保证 tocbot 改写 style 后 data-theme 被清掉时能补回。
var lastPaintedMode = null;
function paintTOC(dark) {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var mode = dark ? 'dark' : 'light';
    // 即使相同也重写一次，防止 tocbot 把属性冲掉
    toc.setAttribute('data-theme', mode);
    if (lastPaintedMode !== mode) {
        lastPaintedMode = mode;
    }
}

/* ==================== 背景色变化检测与刷新 ==================== */
var lastBodyBg = null;
var themeTicking = false;

function readBodyBg() {
    var body = document.body;
    if (!body) return '';
    var bg = getComputedStyle(body).backgroundColor;
    // body 透明时读 html
    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        bg = getComputedStyle(document.documentElement).backgroundColor;
    }
    return bg;
}

function refreshTheme() {
    if (themeTicking) return;
    themeTicking = true;
    nextFrame(function () {
        themeTicking = false;
        var bg = readBodyBg();
        var dark = detectDark();

        // 背景色变化 或 主题明暗变化 或 .toc 的 data-theme 丢失 → 重绘
        var toc = document.querySelector('.toc');
        var attrMissing = toc && toc.getAttribute('data-theme') !== (dark ? 'dark' : 'light');

        if (bg !== lastBodyBg || attrMissing) {
            lastBodyBg = bg;
            paintTOC(dark);
            colorizeTOC();
        }
    });
}

/* ==================== 主题自动触发 ==================== */
function setupThemeAutoTrigger() {
    // ① MutationObserver：监听 html 与 body 的所有属性变化
    //    不限定 attributeFilter，因为 Gmeek 可能改 style / class / data-* 任意属性
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, { attributes: true });
        if (document.body) {
            observer.observe(document.body, { attributes: true });
        }
    }

    // ② 系统偏好变化
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }

    // ③ 自定义事件
    ['gmeek:themechange', 'themechange', 'color-mode-change', 'darkmode:toggle']
        .forEach(function (name) {
            document.addEventListener(name, refreshTheme);
            window.addEventListener(name, refreshTheme);
        });

    // ④ 点击兜底
    document.addEventListener('click', function (e) {
        var t = e.target;
        var hint = '';
        while (t && t !== document) {
            hint = (t.id || '') + ' ' + (t.className || '') + ' ' +
                   (t.getAttribute && (t.getAttribute('aria-label') || '') || '');
            if (/theme|dark|mode|color-scheme|switch/i.test(hint)) {
                setTimeout(refreshTheme, 120);
                setTimeout(refreshTheme, 400);
                break;
            }
            t = t.parentNode;
        }
    }, true);

    // ⑤ 低频轮询兜底（1s）
    var pollTimer = setInterval(refreshTheme, 1000);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) clearInterval(pollTimer);
        else pollTimer = setInterval(refreshTheme, 1000);
    });

    // ⑥ 给 .toc 单独加 MutationObserver，tocbot 改写 .toc.style 时补回 data-theme
    setTimeout(function () {
        var toc = document.querySelector('.toc');
        if (toc && window.MutationObserver) {
            var tocObserver = new MutationObserver(function () {
                var dark = detectDark();
                var want = dark ? 'dark' : 'light';
                if (toc.getAttribute('data-theme') !== want) {
                    toc.setAttribute('data-theme', want);
                }
            });
            tocObserver.observe(toc, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
        }
    }, 500);
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
        paintTOC(detectDark());
        colorizeTOC();
        lastBodyBg = readBodyBg();

        setTimeout(function () {
            paintTOC(detectDark());
            colorizeTOC();
            lastBodyBg = readBodyBg();
            hideEmptyTOC();
            enhanceTOCBehavior();
        }, 300);

        setupThemeAutoTrigger();

        // 兜底刷新
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
 * 2026年11月6日22:03:55
 * 
 */
