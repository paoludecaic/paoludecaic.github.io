/**
 * GmeekButton-Top-Foot.20261104.js
 * GmeekButton-Top-Foot 跳转到文章头部与尾部
 * 20261104 版本号 2026年11月4日 发版的稳定版
 *
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekButton-Top-Foot.20261104.js
**/


(function () {
    'use strict';

    var STACK_ID = 'gmeek-fab-stack';
    var TOP_ID = 'gmeek-top-btn';
    var FOOT_ID = 'gmeek-foot-btn';
    var IDLE_CLASS = 'gmeek-fab--idle';
    var EDGE_TOLERANCE = 8;
    var FOOT_SELECTORS = ['footer', '#footer', '.footer', '.post-footer', '.site-footer', '#gmeek-footer'];
    var ARTICLE_SELECTORS = ['#postBody', '.markdown-body', 'article', '#content'];

    var refs = { stack: null, top: null, foot: null, hues: [220, 130] };
    var currentDark = null;
    var edgeTicking = false;
    var themeTicking = false;

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

    function injectStyle(css) {
        if (typeof window.loadResource === 'function') {
            window.loadResource('style', { css: css });
            return;
        }
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function randomHue() {
        return Math.floor(Math.random() * 360);
    }

    function randomHuePair() {
        var first = randomHue();
        var second = (first + 90 + Math.floor(Math.random() * 180)) % 360;
        return [first, second];
    }

    function parseRGBA(value) {
        var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i.exec(value || '');
        if (!m) return null;
        return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] === undefined ? 1 : parseFloat(m[4])];
    }

    function relativeLuminance(rgb) {
        var c = [rgb[0], rgb[1], rgb[2]].map(function (v) {
            var x = v / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }

    function pageBackgroundLuminance() {
        var node = document.body;
        while (node && node.nodeType === 1) {
            var rgba = parseRGBA(getComputedStyle(node).backgroundColor);
            if (rgba && rgba[3] >= 0.5) return relativeLuminance(rgba);
            node = node.parentElement;
        }
        return null;
    }

    function hasDarkMark() {
        var nodes = [document.documentElement, document.body];
        var re = /(^|\s)(dark|dark-mode|darkmode|theme-dark|night)($|\s)/i;
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (!el) continue;
            var theme = el.getAttribute ? el.getAttribute('data-theme') : '';
            if (theme && /dark|night/i.test(theme)) return true;
            if (typeof el.className === 'string' && re.test(el.className)) return true;
        }
        return false;
    }

    function isDarkPage() {
        if (hasDarkMark()) return true;
        var lum = pageBackgroundLuminance();
        if (lum !== null) return lum < 0.5;
        return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function paint(btn, hue, dark) {
        if (!btn) return;
        var s = btn.style;
        s.setProperty('--fab-hue', String(hue));
        if (dark) {
            s.color = hsl(hue, 65, 68);
            s.background = 'linear-gradient(145deg, ' + hsl(hue, 24, 18) + ', ' + hsl(hue, 30, 11) + ')';
            s.setProperty('--fab-border', hsla(hue, 60, 70, 0.28));
            s.setProperty('--fab-glow', '0.5');
            s.setProperty('--fab-glow-hover', '0.62');
            s.setProperty('--fab-shadow-color', 'rgba(0, 0, 0, 0.5)');
            s.setProperty('--fab-inset', 'rgba(255, 255, 255, 0.12)');
        } else {
            s.color = hsl(hue, 65, 42);
            s.background = 'linear-gradient(145deg, #ffffff, ' + hsl(hue, 45, 97) + ')';
            s.setProperty('--fab-border', hsla(hue, 45, 55, 0.22));
            s.setProperty('--fab-glow', '0.42');
            s.setProperty('--fab-glow-hover', '0.55');
            s.setProperty('--fab-shadow-color', 'rgba(15, 23, 42, 0.18)');
            s.setProperty('--fab-inset', 'rgba(255, 255, 255, 0.9)');
        }
    }

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

    function updateEdgeState() {
        if (!refs.top || !refs.foot) return;
        var offset = window.pageYOffset || document.documentElement.scrollTop || 0;
        toggleClass(refs.top, IDLE_CLASS, offset <= EDGE_TOLERANCE);
        toggleClass(refs.foot, IDLE_CLASS, offset >= getFootY() - 12);
    }

    function requestEdgeUpdate() {
        if (edgeTicking) return;
        edgeTicking = true;
        nextFrame(function () {
            edgeTicking = false;
            updateEdgeState();
        });
    }

    function applyTheme() {
        var dark = isDarkPage();
        var changed = dark !== currentDark;
        currentDark = dark;
        if (!refs.stack) return;
        refs.stack.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (changed) {
            paint(refs.top, refs.hues[0], dark);
            paint(refs.foot, refs.hues[1], dark);
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

    var FAB_CSS = `
#gmeek-fab-stack {
    position: fixed;
    right: clamp(14px, 2.4vw, 30px);
    bottom: calc(clamp(14px, 2.4vw, 30px) + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: clamp(10px, 2.2vh, 18px);
    z-index: 9999;
    pointer-events: none;
}
#gmeek-fab-stack > .gmeek-fab { pointer-events: auto; }

.gmeek-fab {
    --fab-hue: 220;
    --fab-glow: 0.42;
    --fab-glow-hover: 0.55;
    --fab-shadow-color: rgba(15, 23, 42, 0.18);
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
        0 8px 20px -6px hsla(var(--fab-hue), 70%, 45%, var(--fab-glow)),
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
        0 14px 28px -8px hsla(var(--fab-hue), 75%, 45%, var(--fab-glow-hover)),
        0 4px 10px -4px var(--fab-shadow-color),
        0 0 0 4px hsla(var(--fab-hue), 85%, 60%, 0.14),
        inset 0 1px 0 var(--fab-inset);
    text-shadow: 0 0 10px hsla(var(--fab-hue), 90%, 60%, 0.55);
}
.gmeek-fab:hover::after { opacity: 1; }

.gmeek-fab:active {
    transform: translateY(0) scale(0.96);
    box-shadow:
        0 4px 12px -4px hsla(var(--fab-hue), 75%, 45%, var(--fab-glow)),
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
        0 4px 10px -6px hsla(var(--fab-hue), 60%, 45%, var(--fab-glow)),
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
    from { opacity: 0; transform: translateY(14px) scale(0.86); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes gmeek-fab-ripple {
    to { transform: scale(2.4); opacity: 0; }
}

@media (max-width: 600px) {
    #gmeek-fab-stack {
        right: 14px;
        bottom: calc(14px + env(safe-area-inset-bottom, 0px));
        gap: clamp(8px, 1.8vh, 14px);
    }
    .gmeek-fab { width: 46px; height: 46px; font-size: 11px; }
}
@media (max-height: 420px) {
    #gmeek-fab-stack { gap: 8px; }
    .gmeek-fab { width: 42px; height: 42px; font-size: 10px; }
}

@media (prefers-reduced-motion: reduce) {
    .gmeek-fab {
        animation: none !important;
        transition: none !important;
    }
    .gmeek-fab-ripple { display: none; }
}
`;

    function boot() {
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

        refs.stack = stack;
        refs.top = topBtn;
        refs.foot = footBtn;
        refs.hues = randomHuePair();

        injectStyle(FAB_CSS);
        applyTheme();

        window.addEventListener('scroll', requestEdgeUpdate, { passive: true });
        window.addEventListener('resize', requestEdgeUpdate);
        window.addEventListener('load', requestEdgeUpdate);

        if (window.MutationObserver) {
            var observer = new MutationObserver(refreshTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
            if (document.body) {
                observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
            }
        }
        if (window.matchMedia) {
            var media = window.matchMedia('(prefers-color-scheme: dark)');
            if (media.addEventListener) media.addEventListener('change', refreshTheme);
            else if (media.addListener) media.addListener(refreshTheme);
        }

        updateEdgeState();
        requestEdgeUpdate();
        setTimeout(requestEdgeUpdate, 400);

        window.GmeekTopFoot = {
            top: refs.top,
            foot: refs.foot,
            scrollToTop: function () { smoothScrollTo(0); },
            scrollToFoot: function () { smoothScrollTo(getFootY()); },
            refreshTheme: refreshTheme
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();