/**
 * GmeekTOC-20261107.js
 * GmeekTOC 文章目录工具 强制展开 1-5 级目录，物理移除 6 级目录，隐藏空目录
 * 20261107 版本号 2026年11月7日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261107.js
**/


(function () {
    'use strict';

    var STACK_ID = 'GmeekTOC';
    var TOCBOT_JS = 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js';
    var TOCBOT_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css';

    var state = {
        mounted: false,
        tocbotReady: false,
        modeWrapTimer: null,
        modeWrapDeadline: 0,
        mo: null,
        themeTicking: false,
        currentMode: null
    };

    function loadResource(type, attributes, callback) {
        var element;
        if (type === 'script') {
            element = document.createElement('script');
            element.src = attributes.src;
            element.onload = callback;
            element.onerror = function () {
                console.warn('[GmeekTOC] 脚本加载失败: ' + attributes.src);
                if (typeof attributes.onerror === 'function') attributes.onerror();
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
        return element;
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

    function getMode() {
        var mode = document.documentElement.getAttribute('data-color-mode');
        if (mode === 'dark' || mode === 'light') return mode;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function isMounted() {
        return state.mounted || !!document.getElementById(STACK_ID);
    }

    function createTOC() {
        var contentContainer = document.getElementById('content');
        if (!contentContainer) return null;
        var tocElement = document.createElement('div');
        tocElement.id = STACK_ID;
        tocElement.className = 'toc';
        if (contentContainer.firstChild) {
            contentContainer.insertBefore(tocElement, contentContainer.firstChild);
        } else {
            contentContainer.appendChild(tocElement);
        }
        state.mounted = true;
        return tocElement;
    }

    function getTOC() {
        return document.getElementById(STACK_ID) || document.querySelector('.toc');
    }

    function colorizeTOC() {
        var toc = getTOC();
        if (!toc) return;
        toc.querySelectorAll('a.toc-link').forEach(function (a) {
            if (!a.style.getPropertyValue('--toc-hue')) {
                a.style.setProperty('--toc-hue', String(randomHue()));
            }
        });
    }

    function hideEmptyTOC() {
        var toc = getTOC();
        if (!toc) return;
        if (!toc.querySelector('a.toc-link')) {
            setTimeout(function () {
                var t = getTOC();
                if (t && !t.querySelector('a.toc-link')) t.setAttribute('data-empty', 'true');
            }, 600);
        } else {
            toc.removeAttribute('data-empty');
        }
    }

    function removeLevel6ByLiDepth() {
        var toc = getTOC();
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

    function processTOCLevels() {
        var toc = getTOC();
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

    function applyTheme() {
        var toc = getTOC();
        if (!toc) return;
        var mode = getMode();
        toc.setAttribute('data-theme', mode);
        state.currentMode = mode;
    }

    function refreshTheme() {
        if (state.themeTicking) return;
        state.themeTicking = true;
        nextFrame(function () {
            state.themeTicking = false;
            applyTheme();
        });
    }

    function wrapModeSwitch() {
        if (typeof window.modeSwitch !== 'function' || window.modeSwitch.__gmeekTocWrapped) return false;
        var original = window.modeSwitch;
        window.modeSwitch = function () {
            var ret = original.apply(this, arguments);
            refreshTheme();
            return ret;
        };
        window.modeSwitch.__gmeekTocWrapped = true;
        return true;
    }

    function pollWrapModeSwitch() {
        if (wrapModeSwitch()) {
            if (state.modeWrapTimer) {
                clearInterval(state.modeWrapTimer);
                state.modeWrapTimer = null;
            }
            return;
        }
        if (Date.now() > state.modeWrapDeadline) {
            if (state.modeWrapTimer) {
                clearInterval(state.modeWrapTimer);
                state.modeWrapTimer = null;
            }
        }
    }

    function setupThemeListener() {
        if (window.MutationObserver) {
            var observer = new MutationObserver(refreshTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
            if (document.body) observer.observe(document.body, { attributes: true });
            state.mo = observer;
        }
        if (window.matchMedia) {
            var media = window.matchMedia('(prefers-color-scheme: dark)');
            if (media.addEventListener) media.addEventListener('change', refreshTheme);
            else if (media.addListener) media.addListener(refreshTheme);
        }
        document.addEventListener('themechange', refreshTheme);

        if (!wrapModeSwitch()) {
            state.modeWrapDeadline = Date.now() + 10000;
            state.modeWrapTimer = setInterval(pollWrapModeSwitch, 500);
        }
    }

    function setupDOMGuard(toc) {
        if (!toc || !window.MutationObserver) return;
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

            colorizeTOC();
        });
        mo.observe(toc, { childList: true, subtree: true });
    }

    function renderError(msg) {
        var existing = document.getElementById(STACK_ID + '-error');
        if (existing) existing.remove();

        var box = document.createElement('div');
        box.id = STACK_ID + '-error';
        box.className = 'toc toc-error';
        box.setAttribute('data-theme', getMode());
        box.innerHTML =
            '<div class="toc-error-title">目录加载失败</div>' +
            '<div class="toc-error-msg"></div>';
        box.querySelector('.toc-error-msg').textContent = msg || '未知错误';
        var content = document.getElementById('content');
        if (content && content.firstChild) {
            content.insertBefore(box, content.firstChild);
        } else {
            document.body.insertBefore(box, document.body.firstChild);
        }
    }

    function injectTOCStyle() {
        var css = `
        #${STACK_ID} {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(360px);
            width: 220px;
            padding: 16px 16px 16px 20px;
            border-radius: 14px;
            max-height: 60vh;
            overflow-y: auto;
            z-index: 100;
            scrollbar-width: thin;
            background: transparent;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        #${STACK_ID}::-webkit-scrollbar { width: 6px; background-color: transparent; }
        #${STACK_ID}::-webkit-scrollbar-track { background-color: transparent; }
        #${STACK_ID}::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        #${STACK_ID}[data-theme="dark"]::-webkit-scrollbar-thumb { background-color: #475569; }

        #${STACK_ID}[data-theme="light"] {
            background: linear-gradient(145deg, #ffffff, ${hsl(220, 45, 97)});
            border: 1px solid ${hsla(220, 45, 55, 0.22)};
            box-shadow:
                0 10px 25px -5px rgba(0, 0, 0, 0.18),
                0 8px 10px -6px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.9) inset;
            scrollbar-color: #cbd5e1 transparent;
        }
        #${STACK_ID}[data-theme="dark"] {
            background: linear-gradient(145deg, ${hsl(220, 24, 18)}, ${hsl(220, 30, 11)});
            border: 1px solid ${hsla(220, 60, 70, 0.28)};
            box-shadow:
                0 10px 25px -5px rgba(0, 0, 0, 0.6),
                0 8px 10px -6px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.12) inset;
            scrollbar-color: #475569 transparent;
        }

        #${STACK_ID}[data-empty="true"] { display: none; }

        #${STACK_ID} .toc-list { padding-left: 0; margin: 0; list-style: none; }
        #${STACK_ID} .toc-list-item { margin: 2px 0; list-style: none; }
        #${STACK_ID} .toc-list .toc-list { padding-left: 12px; }

        #${STACK_ID} li[data-level="6"] { display: none; }
        #${STACK_ID} ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li > ol.toc-list > li {
            display: none;
        }

        #${STACK_ID} a.toc-link {
            display: block;
            padding: 4px 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            text-decoration: none;
            border-radius: 6px;
            border-left: 2px solid transparent;
            word-break: break-word;
            --toc-hue: 220;
            color: hsl(var(--toc-hue), 65%, 42%);
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 30%, 0.28);
            transition: color 0.25s, background-color 0.25s, text-shadow 0.25s;
        }
        #${STACK_ID} a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.18);
            border-left-color: currentColor;
            color: hsl(var(--toc-hue), 75%, 32%);
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 50%, 0.55);
        }
        #${STACK_ID}[data-theme="dark"] a.toc-link {
            color: hsl(var(--toc-hue), 65%, 68%);
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 8%, 0.45);
        }
        #${STACK_ID}[data-theme="dark"] a.toc-link:hover {
            background-color: rgba(148, 163, 184, 0.16);
            color: hsl(var(--toc-hue), 75%, 78%);
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 60%, 0.75);
        }

        #${STACK_ID} .is-active-link {
            font-weight: 600;
            background-color: rgba(59, 130, 246, 0.12);
            border-left-color: currentColor;
        }
        #${STACK_ID}[data-theme="dark"] .is-active-link {
            background-color: rgba(96, 165, 250, 0.18);
        }

        #${STACK_ID} .is-collapsible { transition: none; }

        #${STACK_ID}-error {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(360px);
            width: 220px;
            padding: 14px 16px;
            border-radius: 14px;
            z-index: 100;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.85rem;
        }
        #${STACK_ID}-error[data-theme="light"] {
            background: #fff;
            border: 1px solid ${hsla(220, 45, 55, 0.22)};
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18);
            color: #b91c1c;
        }
        #${STACK_ID}-error[data-theme="dark"] {
            background: ${hsl(220, 24, 18)};
            border: 1px solid ${hsla(220, 60, 70, 0.28)};
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
            color: #fca5a5;
        }
        #${STACK_ID}-error .toc-error-title { font-weight: 700; margin-bottom: 6px; }
        #${STACK_ID}-error .toc-error-msg { font-size: 0.75rem; opacity: 0.85; word-break: break-word; }

        @media (max-width: 1249px) {
            #${STACK_ID},
            #${STACK_ID}-error {
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

    function initTocbot(toc) {
        loadResource('link', { rel: 'stylesheet', href: TOCBOT_CSS });
        loadResource('script', {
            src: TOCBOT_JS,
            onerror: function () {
                renderError('tocbot 脚本加载失败，请检查网络或 CDN。');
            }
        }, function () {
            if (typeof window.tocbot === 'undefined' || !window.tocbot.init) {
                renderError('tocbot 未正确加载。');
                return;
            }
            try {
                window.tocbot.init({
                    tocSelector: '#' + STACK_ID,
                    contentSelector: '.markdown-body',
                    headingSelector: 'h1, h2, h3, h4, h5',
                    scrollSmooth: false,
                    collapseDepth: 6
                });
                state.tocbotReady = true;
            } catch (e) {
                console.warn('[GmeekTOC] tocbot 初始化失败:', e);
                renderError('目录初始化失败：' + (e && e.message ? e.message : '未知错误'));
                return;
            }

            var applyAll = function () {
                if (!getTOC()) return;
                applyTheme();
                hideEmptyTOC();
                processTOCLevels();
                colorizeTOC();
            };

            setTimeout(applyAll, 50);
            setTimeout(applyAll, 300);
            setTimeout(applyAll, 800);

            setupDOMGuard(toc);
        });
    }

    function fillHeadingIds() {
        var headings = document.querySelectorAll(
            '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6'
        );
        headings.forEach(function (heading) {
            if (!heading.id) heading.id = heading.textContent.trim().replace(/\s+/g, '-');
        });
    }

    function boot() {
        if (isMounted()) return;

        var toc = createTOC();
        if (!toc) {
            console.warn('[GmeekTOC] 未找到 #content 容器，跳过。');
            return;
        }

        injectTOCStyle();
        setupThemeListener();
        fillHeadingIds();

        if (!document.getElementById(STACK_ID + '-footer')) {
            var footerPlaceholder = document.createElement('div');
            footerPlaceholder.id = STACK_ID + '-footer';
            footerPlaceholder.style.height = window.innerHeight + 'px';
            document.body.appendChild(footerPlaceholder);
        }

        initTocbot(toc);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();