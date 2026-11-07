/**
 * GmeekButton-Top-Foot.20261107-row.js
 * GmeekButton-Top-Foot 跳转到文章头部与尾部
 * 

 */

(function () {
    'use strict';

    var STACK_ID = 'GmeekButton-Top-Foot';
    var TOP_ID = 'gmeek-top-btn';
    var FOOT_ID = 'gmeek-foot-btn';
    var IDLE_CLASS = 'gmeek-fab--idle';
    var EDGE_TOLERANCE = 8;

    var FOOT_SELECTORS = ['footer', '#footer', '.footer', '.post-footer', '.site-footer', '#gmeek-footer'];
    var ARTICLE_SELECTORS = ['#postBody', '.markdown-body', 'article', '#content'];

    var fabRefs = { stack: null, top: null, foot: null, hues: [220, 130] };
    var currentMode = null;
    var edgeTicking = false;
    var themeTicking = false;

    /* ==================== 通用工具 ==================== */
    function loadResource(type, attributes) {
        var element;
        if (type === 'script') {
            element = document.createElement('script');
            element.src = attributes.src;
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

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function hsl(h, s, l) {
        return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
    }

    function hsla(h, s, l, a) {
        return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
    }

    function toggleClass(el, name, on) {
        if (!el) return;
        var has = el.classList.contains(name);
        if (on && !has) el.classList.add(name);
        if (!on && has) el.classList.remove(name);
    }

    function queryFirst(selectors) {
        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) return el;
        }
        return null;
    }

    function randomHue() {
        return Math.floor(Math.random() * 360);
    }

    function randomHuePair() {
        var first = randomHue();
        var second = (first + 90 + Math.floor(Math.random() * 180)) % 360;
        return [first, second];
    }

    /* ==================== 主题：读取 html[data-color-mode] ==================== */
    function getMode() {
        var mode = document.documentElement.getAttribute('data-color-mode');
        if (mode === 'dark' || mode === 'light') return mode;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function paint(btn, hue, mode) {
        if (!btn) return;
        var s = btn.style;
        s.setProperty('--fab-hue', String(hue));

        if (mode === 'dark') {
            s.color = hsl(hue, 65, 68);
            s.background = 'linear-gradient(145deg, ' + hsl(hue, 24, 18) + ', ' + hsl(hue, 30, 11) + ')';
            s.setProperty('--fab-border', hsla(hue, 60, 70, 0.28));
            s.setProperty('--fab-glow', '0.45');
            s.setProperty('--fab-glow-hover', '0.6');
            // 改为暗色系阴影
            s.setProperty('--fab-shadow-color', 'rgba(0, 0, 0, 0.6)');
            s.setProperty('--fab-inset', 'rgba(255, 255, 255, 0.12)');
        } else {
            s.color = hsl(hue, 65, 42);
            s.background = 'linear-gradient(145deg, #ffffff, ' + hsl(hue, 45, 97) + ')';
            s.setProperty('--fab-border', hsla(hue, 45, 55, 0.22));
            s.setProperty('--fab-glow', '0.35');
            s.setProperty('--fab-glow-hover', '0.45');
            // 改为暗色系阴影
            s.setProperty('--fab-shadow-color', 'rgba(0, 0, 0, 0.18)');
            s.setProperty('--fab-inset', 'rgba(255, 255, 255, 0.9)');
        }
    }

    /* ==================== 滚动定位 ==================== */
    function smoothScrollTo(top) {
        top = Math.round(top);
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({ top: top, behavior: 'smooth' });
        } else {
            window.scrollTo(0, top);
        }
    }

    function getMaxScroll() {
        var d = document.documentElement;
        var b = document.body;
        var h = Math.max(d.scrollHeight, d.offsetHeight, b ? b.scrollHeight : 0, b ? b.offsetHeight : 0, window.innerHeight);
        return Math.max(0, h - window.innerHeight);
    }

    function getFootY() {
        var max = getMaxScroll();
        var offset = window.pageYOffset || document.documentElement.scrollTop || 0;
        var target = queryFirst(FOOT_SELECTORS) || queryFirst(ARTICLE_SELECTORS);
        if (target) {
            var rect = target.getBoundingClientRect();
            return clamp(rect.bottom + offset - window.innerHeight + 24, 0, max);
        }
        return max;
    }

    /* ==================== 按钮构建 ==================== */
    function ripple(btn, event) {
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        if (!size) return;
        var span = document.createElement('span');
        span.className = 'gmeek-fab-ripple';
        span.style.width = size + 'px';
        span.style.height = size + 'px';
        var left = rect.width / 2 - size / 2;
        var top = rect.height / 2 - size / 2;
        if (event && typeof event.clientX === 'number' && event.clientX) {
            left = event.clientX - rect.left - size / 2;
            top = event.clientY - rect.top - size / 2;
        }
        span.style.left = left + 'px';
        span.style.top = top + 'px';
        btn.appendChild(span);
        span.addEventListener('animationend', function () {
            if (span.parentNode) span.parentNode.removeChild(span);
        });
        setTimeout(function () {
            if (span.parentNode) span.parentNode.removeChild(span);
        }, 800);
    }

    function createButton(id, label, ariaLabel, title, extraClass, onClick) {
        var btn = document.createElement('button');
        btn.id = id;
        btn.className = 'gmeek-fab ' + extraClass;
        btn.type = 'button';
        btn.textContent = label;
        btn.setAttribute('aria-label', ariaLabel);
        btn.setAttribute('title', title);
        btn.addEventListener('click', function (event) {
            ripple(btn, event);
            onClick();
        });
        return btn;
    }

    /* ==================== 边缘状态 ==================== */
    function updateEdgeState() {
        if (!fabRefs.top || !fabRefs.foot) return;
        var offset = window.pageYOffset || document.documentElement.scrollTop || 0;
        toggleClass(fabRefs.top, IDLE_CLASS, offset <= EDGE_TOLERANCE);
        toggleClass(fabRefs.foot, IDLE_CLASS, offset >= getFootY() - 12);
    }

    function requestEdgeUpdate() {
        if (edgeTicking) return;
        edgeTicking = true;
        nextFrame(function () {
            edgeTicking = false;
            updateEdgeState();
        });
    }

    /* ==================== 主题刷新 ==================== */
    function applyTheme() {
        var mode = getMode();
        var changed = mode !== currentMode;
        currentMode = mode;
        if (!fabRefs.stack) return;
        fabRefs.stack.setAttribute('data-theme', mode);
        if (changed) {
            paint(fabRefs.top, fabRefs.hues[0], mode);
            paint(fabRefs.foot, fabRefs.hues[1], mode);
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

    /* ==================== 样式注入（统一暗色阴影） ==================== */
    function injectFabStyle() {
        var css = `
        #gmeek-fab-stack {
            position: fixed;
            right: clamp(14px, 2.4vw, 30px);
            bottom: calc(clamp(14px, 2.4vw, 30px) + env(safe-area-inset-bottom, 0px));
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: clamp(10px, 2.2vw, 18px);
            z-index: 9999;
            pointer-events: none;
        }
        #gmeek-fab-stack > .gmeek-fab { pointer-events: auto; }

        .gmeek-fab {
            --fab-hue: 220;
            --fab-glow: 0.35;
            --fab-glow-hover: 0.45;
            --fab-shadow-color: rgba(0, 0, 0, 0.18);
            --fab-inset: rgba(255, 255, 255, 0.9);
            --fab-border: rgba(15, 23, 42, 0.08);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: clamp(48px, 6.2vw, 56px);
            height: clamp(48px, 6.2vw, 56px);
            padding: 0;
            margin: 0;
            border: 1px solid var(--fab-border);
            border-radius: 50%;
            background: #fff;
            color: hsl(var(--fab-hue), 65%, 42%);
            font-family: inherit;
            font-size: clamp(11px, 1.25vw, 13px);
            font-weight: 700;
            letter-spacing: 0.5px;
            line-height: 1;
            cursor: pointer;
            overflow: hidden;
            isolation: isolate;
            -webkit-appearance: none;
            appearance: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-backdrop-filter: blur(10px) saturate(160%);
            backdrop-filter: blur(10px) saturate(160%);
            box-shadow:
                0 8px 20px -6px var(--fab-shadow-color), /* 使用暗色阴影 */
                0 2px 6px -2px var(--fab-shadow-color),
                inset 0 1px 0 var(--fab-inset);
            transition:
                transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.24s ease,
                background 0.3s ease,
                color 0.3s ease,
                border-color 0.3s ease,
                opacity 0.3s ease,
                text-shadow 0.24s ease;
            user-select: none;
            -webkit-user-select: none;
            animation: gmeek-fab-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        #gmeek-fab-stack .gmeek-fab-foot { animation-delay: 0.08s; }

        .gmeek-fab::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: radial-gradient(130% 130% at 28% 18%, hsla(var(--fab-hue), 85%, 72%, 0.35), transparent 62%);
            opacity: 0;
            transition: opacity 0.24s ease;
            pointer-events: none;
            z-index: -1;
        }

        .gmeek-fab:hover {
            transform: translateY(-3px) scale(1.05);
            border-color: hsla(var(--fab-hue), 70%, 55%, 0.55);
            box-shadow:
                0 14px 28px -8px var(--fab-shadow-color), /* 使用暗色阴影 */
                0 4px 10px -4px var(--fab-shadow-color),
                0 0 0 4px hsla(var(--fab-hue), 85%, 60%, 0.14),
                inset 0 1px 0 var(--fab-inset);
            text-shadow: 0 0 10px hsla(var(--fab-hue), 90%, 60%, 0.55);
        }
        .gmeek-fab:hover::after { opacity: 1; }

        .gmeek-fab:active {
            transform: translateY(0) scale(0.96);
            box-shadow:
                0 4px 12px -4px var(--fab-shadow-color),
                0 1px 2px -1px var(--fab-shadow-color),
                inset 0 1px 0 var(--fab-inset);
        }

        .gmeek-fab:focus { outline: none; }
        .gmeek-fab:focus-visible {
            outline: 2px solid hsl(var(--fab-hue), 75%, 55%);
            outline-offset: 3px;
        }

        .gmeek-fab.gmeek-fab--idle {
            opacity: 0.55;
            box-shadow:
                0 4px 10px -6px var(--fab-shadow-color),
                0 1px 2px -1px var(--fab-shadow-color);
        }
        .gmeek-fab.gmeek-fab--idle:hover { opacity: 0.95; }

        .gmeek-fab-ripple {
            position: absolute;
            border-radius: 50%;
            background: hsla(var(--fab-hue), 90%, 55%, 0.42);
            pointer-events: none;
            transform: scale(0);
            animation: gmeek-fab-ripple 0.55s ease-out forwards;
        }

        @keyframes gmeek-fab-in {
            from { opacity: 0; transform: translateX(14px) scale(0.86); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes gmeek-fab-ripple {
            to { transform: scale(2.4); opacity: 0; }
        }

        @media (max-width: 600px) {
            #gmeek-fab-stack { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); gap: clamp(8px, 2vw, 12px); }
            .gmeek-fab { width: 46px; height: 46px; font-size: 11px; }
        }

        @media (max-width: 360px) {
            #gmeek-fab-stack { gap: 8px; right: 10px; }
            .gmeek-fab { width: 42px; height: 42px; font-size: 10px; }
        }

        @media (max-height: 420px) {
            #gmeek-fab-stack { gap: 8px; }
            .gmeek-fab { width: 42px; height: 42px; font-size: 10px; }
        }

        @media (prefers-reduced-motion: reduce) {
            .gmeek-fab { animation: none !important; transition: none !important; }
            .gmeek-fab-ripple { display: none; }
        }
        `;
        loadResource('style', { css: css });
    }

    /* ==================== 初始化 ==================== */
    function boot() {
        // 单例守卫：防止脚本被多次引用导致出现多组按钮
        if (document.getElementById(STACK_ID)) return;

        var stack = document.createElement('div');
        stack.id = STACK_ID;
        stack.setAttribute('role', 'group');
        stack.setAttribute('aria-label', '页面跳转');

        var topBtn = createButton(
            TOP_ID, 'TOP', '前往页面顶部', '回到页面顶部',
            'gmeek-fab-top',
            function () { smoothScrollTo(0); }
        );
        var footBtn = createButton(
            FOOT_ID, 'FOOT', '前往页面底部', '前往文章末尾',
            'gmeek-fab-foot',
            function () { smoothScrollTo(getFootY()); }
        );

        stack.appendChild(topBtn);
        stack.appendChild(footBtn);
        document.body.appendChild(stack);

        fabRefs.stack = stack;
        fabRefs.top = topBtn;
        fabRefs.foot = footBtn;
        fabRefs.hues = randomHuePair();

        injectFabStyle();
        applyTheme();

        window.addEventListener('scroll', requestEdgeUpdate, { passive: true });
        window.addEventListener('resize', requestEdgeUpdate);
        window.addEventListener('load', requestEdgeUpdate);

        // 监听 html[data-color-mode] 变化
        if (window.MutationObserver) {
            var observer = new MutationObserver(refreshTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
        }
        // 系统偏好变化
        if (window.matchMedia) {
            var media = window.matchMedia('(prefers-color-scheme: dark)');
            if (media.addEventListener) media.addEventListener('change', refreshTheme);
            else if (media.addListener) media.addListener(refreshTheme);
        }

        updateEdgeState();
        requestEdgeUpdate();
        setTimeout(requestEdgeUpdate, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();