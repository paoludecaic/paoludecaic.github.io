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

        // 强制覆盖字体颜色
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
            if (!toc.querySelector('a.toc-link')) toc.style.display = 'none';
        }, 600);
    } else {
        toc.style.display = '';
    }
}

/* ==================== 逐级折叠核心 ==================== */
// 获取当前 li 的直接子 ul/ol (兼容不支持 :scope 的旧环境)
function getDirectSubList(li) {
    var children = li.children;
    for (var i = 0; i < children.length; i++) {
        if (children[i].classList.contains('toc-list')) {
            return children[i];
        }
    }
    return null;
}

function setSubListOpen(li, open) {
    var sub = getDirectSubList(li);
    if (!sub) return;
    if (open) {
        sub.style.setProperty('display', 'block', 'important');
        sub.style.setProperty('max-height', 'none', 'important');
        sub.style.setProperty('opacity', '1', 'important');
        sub.classList.remove('is-collapsible', 'is-collapsed');
        sub.classList.add('is-open');
        li.dataset.subOpen = '1';
    } else {
        sub.style.setProperty('display', 'none', 'important');
        li.dataset.subOpen = '0';
    }
}

function getLevel(li) {
    var raw = li.getAttribute('data-level');
    var n = raw ? parseInt(raw, 10) : 1;
    return isNaN(n) ? 1 : n;
}

// 初始化折叠：固定展开 4 级
function initCollapseState() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var allLis = toc.querySelectorAll('li.toc-list-item');
    allLis.forEach(function (li) {
        var level = getLevel(li);
        var sub = getDirectSubList(li);
        if (!sub) return; // 没有子列表跳过

        // 1/2/3 级展开，4级及以下折叠（4级折叠5级）
        if (level >= 4) {
            setSubListOpen(li, false);
        } else {
            setSubListOpen(li, true);
        }
    });
}

// 点击事件
function onTocClick(e) {
    var link = e.target.closest('a.toc-link');
    if (!link) return;
    
    // 阻止默认锚点跳转带来的页面抖动，稍后手动平滑滚动
    e.preventDefault(); 
    
    var li = link.closest('li.toc-list-item');
    if (!li) return;

    var level = getLevel(li);
    var sub = getDirectSubList(li);

    // 跳转逻辑（无论有没有子级都要能跳转）
    var targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
        var targetEl = document.getElementById(targetId.substring(1));
        if (targetEl) {
            var y = targetEl.getBoundingClientRect().top + window.pageYOffset - 20;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }

    // 6 级无反馈（不展开不折叠）
    if (level >= 6) return; 
    if (!sub) return; 

    // 切换子级展开状态
    var wasOpen = li.dataset.subOpen === '1';
    if (wasOpen) {
        setSubListOpen(li, false);
    } else {
        setSubListOpen(li, true);
        // 展开时，确保子级中4级及以下保持折叠
        var childItems = sub.children;
        for (var i = 0; i < childItems.length; i++) {
            if (childItems[i].classList.contains('toc-list-item')) {
                var childLevel = getLevel(childItems[i]);
                if (childLevel >= 4) {
                    setSubListOpen(childItems[i], false);
                }
            }
        }
    }
}

function enhanceTOCBehavior() {
    var toc = document.querySelector('.toc');
    if (!toc || toc.dataset.enhanced === 'true') return;
    toc.dataset.enhanced = 'true';
    toc.addEventListener('click', onTocClick);
}

/* ==================== 主题绘制（强制内联覆盖背景） ==================== */
var currentMode = null;
var themeTicking = false;

// 直接给 .toc 元素写 style，无视一切 CSS 优先级
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
    
    // 无论变没变，都重新上色
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
            max-height: 60vh;
            overflow-y: auto;
            z-index: 100;
            scrollbar-width: thin;
            /* 去除 tocbot 自带的白色背景干扰 */
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
            scrollSmooth: false, // 滚动逻辑由我们自己接管
            collapseDepth: 0      // 故意设为0，全部渲染出来，由我们的 initCollapseState 接管
        });

        // 使用双重延时确保 tocbot 将 DOM 彻底挂载完毕
        setTimeout(function () {
            applyTheme();
            hideEmptyTOC();
            initCollapseState();
            enhanceTOCBehavior();
            
            // 再次兜底应用
            setTimeout(refreshTheme, 300);
        }, 150);
    });

    loadResource('link', {
        rel: 'stylesheet',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css'
    });

    // 补全 ID 供锚点跳转使用
    var headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    headings.forEach(function (heading) {
        if (!heading.id) heading.id = heading.textContent.trim().replace(/\s+/g, '-');
    });

    var footerPlaceholder = document.createElement('div');
    footerPlaceholder.style.height = window.innerHeight + 'px';
    document.body.appendChild(footerPlaceholder);
});

/**
 * 2026年11月6日23:54:23
 */