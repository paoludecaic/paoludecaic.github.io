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

        // 强制覆盖内联颜色
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

/* ==================== 主题绘制与监听 ==================== */
var currentMode = null;
var themeTicking = false;

function paintTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var mode = getMode();
    
    // 强制同步 data-theme
    if (toc.getAttribute('data-theme') !== mode) {
        toc.setAttribute('data-theme', mode);
    }
    
    // 如果模式变化，重绘文字颜色
    if (currentMode !== mode) {
        currentMode = mode;
        colorizeTOC();
    }
}

function refreshTheme() {
    if (themeTicking) return;
    themeTicking = true;
    nextFrame(function () {
        themeTicking = false;
        paintTOC();
    });
}

function setupThemeListener() {
    // 1. 监听 html 的属性变化
    if (window.MutationObserver) {
        var observer = new MutationObserver(refreshTheme);
        observer.observe(document.documentElement, { attributes: true });
        if (document.body) {
            observer.observe(document.body, { attributes: true });
        }
    }
    
    // 2. 系统偏好监听
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        if (media.addEventListener) media.addEventListener('change', refreshTheme);
        else if (media.addListener) media.addListener(refreshTheme);
    }

    // 3. 【杀手锏】劫持全局的 modeSwitch 函数 (Gmeek官方的主题切换按钮)
    // 等它执行完原本的切换逻辑后，我们紧接着刷新 TOC
    var originalModeSwitch = window.modeSwitch;
    if (typeof originalModeSwitch === 'function') {
        window.modeSwitch = function () {
            originalModeSwitch.apply(this, arguments);
            setTimeout(refreshTheme, 10);
            setTimeout(refreshTheme, 100);
        };
    }

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
            
            /* 亮色主题 (增加 !important 防覆盖) */
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

        /* 暗色主题 (增加 !important 防覆盖) */
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

        currentMode = null;
        paintTOC();
        
        setTimeout(function () {
            paintTOC();
            hideEmptyTOC();
            enhanceTOCBehavior();
        }, 300);

        setupThemeListener();

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
 * 2026年11月6日22:40:15
 * 
 */
