/**
 * GmeekTOC-20261104.js
 * GmeekTOC 文章目录工具 随机展开3/4级目录，点击展开下一级，最深展示6级
 * 20261104 版本号 2026年11月4日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261104.js
 * 引用方法 "script":"<script src='https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261104.js'></script>"
**/

function loadResource(type, attributes, callback) {
    var element;
    if (type === 'script') {
        element = document.createElement('script');
        element.src = attributes.src;
        element.onload = callback;
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

function createTOC() {
    var tocElement = document.createElement('div');
    tocElement.className = 'toc';
    var contentContainer = document.getElementById('content');
    if (contentContainer.firstChild) {
        contentContainer.insertBefore(tocElement, contentContainer.firstChild);
    } else {
        contentContainer.appendChild(tocElement);
    }
}

/* ---- 目录链接随机彩色 ---- */
function colorizeTOC() {
    var dark = getMode() === 'dark';
    var light = dark ? 64 : 42;
    var lightHover = dark ? 74 : 32;
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        if (a.dataset.colored) return;
        a.dataset.colored = 'true';

        var hue = Math.floor(Math.random() * 360);
        a.style.color = 'hsl(' + hue + ', 65%, ' + light + '%)';
        a.style.transition = 'color 0.25s, background-color 0.25s';
        a.addEventListener('mouseenter', function () {
            a.style.color = 'hsl(' + hue + ', 75%, ' + lightHover + '%)';
        });
        a.addEventListener('mouseleave', function () {
            a.style.color = 'hsl(' + hue + ', 65%, ' + light + '%)';
        });
    });
}

/* ---- 隐藏空目录 ---- */
function hideEmptyTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    if (!toc.querySelector('a.toc-link')) {
        toc.style.display = 'none';
    }
}

/* ---- 增强折叠逻辑：点击展开下一级，限制 6 级 ---- */
function enhanceTOCBehavior() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var allLinks = toc.querySelectorAll('a.toc-link');

    allLinks.forEach(function (link) {
        var li = link.closest('li');
        var level = parseInt(li.getAttribute('data-level') || '1', 10);

        // 6 级目录：不再展开，隐藏折叠按钮
        if (level >= 6) {
            var btn = li.querySelector('.toc-collapse-button');
            if (btn) btn.style.display = 'none';
        }

        // 点击事件
        link.addEventListener('click', function () {
            // 6 级目录：无反应
            if (level >= 6) return;

            // 1~5 级目录：展开对应下一级
            var subList = li.querySelector('.toc-list');
            if (subList) {
                var subItems = subList.querySelectorAll('.toc-list-item');
                subItems.forEach(function (item) {
                    item.classList.add('is-open');
                    item.classList.remove('is-collapsed');
                    item.classList.remove('is-collapsible');
                    item.style.maxHeight = 'none';
                    item.style.opacity = '1';
                });
            }
        });
    });
}

/* ==================== 主题：读取 html[data-color-mode] ==================== */
function getMode() {
    var mode = document.documentElement.getAttribute('data-color-mode');
    if (mode === 'dark' || mode === 'light') return mode;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function paintTOC(mode) {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    toc.setAttribute('data-theme', mode);

    if (mode === 'dark') {
        toc.style.background = 'rgba(30, 41, 59, 0.92)';
        toc.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        toc.style.boxShadow =
            '0 10px 25px -5px rgba(0, 0, 0, 0.5),' +
            '0 8px 10px -6px rgba(0, 0, 0, 0.35),' +
            '0 0 0 1px rgba(255, 255, 255, 0.06) inset';
    } else {
        toc.style.background = '#ffffff';
        toc.style.borderColor = '#e5e7eb';
        toc.style.boxShadow =
            '0 10px 25px -5px rgba(0, 0, 0, 0.12),' +
            '0 8px 10px -6px rgba(0, 0, 0, 0.08),' +
            '0 0 0 1px rgba(255, 255, 255, 0.6) inset';
    }
}

var currentMode = null;
var themeTicking = false;

function refreshTheme() {
    if (themeTicking) return;
    themeTicking = true;
    (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(function () {
        themeTicking = false;
        var mode = getMode();
        if (mode === currentMode) return;
        currentMode = mode;
        paintTOC(mode);
        colorizeTOC();
    });
}

document.addEventListener("DOMContentLoaded", function () {
    createTOC();

    var css = `
        /* ===== 目录框美化（背景/边框/阴影由 JS 按主题注入） ===== */
        .toc {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(300px);
            width: 220px;
            padding: 16px 16px 16px 20px;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            max-height: 60vh;
            overflow-y: auto;
            z-index: 100;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            
            /* 滚动条全面适配 */
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

        /* 目录容器悬浮阴影 */
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

        /* ===== 目录列表 ===== */
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

        /* ===== 折叠动画 ===== */
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

        /* ===== 响应式 ===== */
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

    var randomDepth = Math.random() < 0.5 ? 3 : 4;

    loadResource('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js' }, function () {
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
            collapseDepth: randomDepth,
        });

        currentMode = getMode();
        paintTOC(currentMode);
        colorizeTOC();

        setTimeout(function () {
            colorizeTOC();
            hideEmptyTOC();
            enhanceTOCBehavior();
        }, 300);

        /* 监听 html[data-color-mode] 变化（modeSwitch 触发点） */
        if (window.MutationObserver) {
            var observer = new MutationObserver(refreshTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
        }
        /* 系统偏好变化时也刷新（data-color-mode=auto 场景） */
        if (window.matchMedia) {
            var media = window.matchMedia('(prefers-color-scheme: dark)');
            if (media.addEventListener) media.addEventListener('change', refreshTheme);
            else if (media.addListener) media.addListener(refreshTheme);
        }
    });

    loadResource('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css' });

    const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    headings.forEach((heading) => {
        if (!heading.id) {
            heading.id = heading.textContent.trim().replace(/\s+/g, '-');
        }
    });

    var footerPlaceholder = document.createElement('div');
    footerPlaceholder.style.height = window.innerHeight + 'px';
    document.body.appendChild(footerPlaceholder);
    console.log("\n %c GmeekTocBot Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#C333D0;color:#fff");
});