/**
 * Gmeek-Article-RSS-TOC-20261107.js
 * Article-RSS-TOC 基于 RSS 的文章导航目录 包含：上一篇、下一篇、当前文章、文章列表
 * 20261107 版本号 2026年11月7日 发版的稳定版
 * 2026年11月7日16:41:10
 * 
 * 引用地址 https://blog.caicai.asia/GmeekUtils/Gmeek-Article-RSS-TOC-20261107.js
 * 引用方法 "script":"<script src='https://blog.caicai.asia/GmeekUtils/Gmeek-Article-RSS-TOC-20261107.js'></script>"
**/

(function () {
    'use strict';

    var STACK_ID = 'Gmeek-Article-RSS-TOC';
    var RSS_URL = window.location.origin + '/rss.xml';

    // ==================== 通用工具 ====================
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

    function getMode() {
        var mode = document.documentElement.getAttribute('data-color-mode');
        if (mode === 'dark' || mode === 'light') return mode;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
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

    // ==================== 动态位置计算 ====================
    function updatePosition() {
        var stack = document.getElementById(STACK_ID);
        if (!stack) return;

        var content = document.querySelector('.markdown-body') || document.getElementById('content') || document.querySelector('article');

        if (content) {
            var rect = content.getBoundingClientRect();
            var leftSpace = rect.left;
            if (leftSpace > 280) {
                stack.style.right = (window.innerWidth - leftSpace + 24) + 'px';
                stack.style.display = 'flex';
            } else {
                stack.style.display = 'none';
            }
        } else {
            stack.style.right = '24px';
        }
    }

    // ==================== 样式注入 ====================
    function injectNavStyle() {
        var css = `
        #Gmeek-Article-RSS-TOC {
            position: fixed;
            top: 130px;
            right: 24px; /* 默认值，会被 JS 动态覆盖 */
            width: 260px;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
            border-radius: 14px;
            z-index: 100;
            overflow: hidden;
            scrollbar-width: thin;
            
            /* 字体渲染基础 */
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.85rem;
            --base-hue: 220;

            /* 平滑过渡 */
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
        }

        /* 亮色主题背景与边框（与 TOC 保持完全一致） */
        #Gmeek-Article-RSS-TOC[data-theme="light"] {
            background: linear-gradient(145deg, #ffffff, ${hsl(220, 45, 97)}) !important;
            border: 1px solid ${hsla(220, 45, 55, 0.22)} !important;
            box-shadow:
                0 10px 25px -5px ${hsla(220, 70, 45, 0.42)},
                0 8px 10px -6px rgba(15, 23, 42, 0.18),
                0 0 0 1px rgba(255, 255, 255, 0.9) inset !important;
            scrollbar-color: #cbd5e1 transparent !important;
            color: #334155;
        }

        /* 暗色主题背景与边框（与 TOC 保持完全一致） */
        #Gmeek-Article-RSS-TOC[data-theme="dark"] {
            background: linear-gradient(145deg, ${hsl(220, 24, 18)}, ${hsl(220, 30, 11)}) !important;
            border: 1px solid ${hsla(220, 60, 70, 0.28)} !important;
            box-shadow:
                0 10px 25px -5px ${hsla(220, 70, 45, 0.5)},
                0 8px 10px -6px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.12) inset !important;
            scrollbar-color: #475569 transparent !important;
            color: #cbd5e1;
        }

        /* 滚轴 */
        #Gmeek-Article-RSS-TOC::-webkit-scrollbar { width: 6px; background-color: transparent; }
        #Gmeek-Article-RSS-TOC::-webkit-scrollbar-track { background-color: transparent; }
        #Gmeek-Article-RSS-TOC::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        #Gmeek-Article-RSS-TOC[data-theme="dark"]::-webkit-scrollbar-thumb { background-color: #475569; }

        /* 当前文章标题 (最上方) */
        .gan-current {
            padding: 14px 12px;
            text-align: center;
            font-weight: 700;
            font-size: 0.9rem;
            flex-shrink: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-bottom: 1px solid ${hsla(220, 45, 55, 0.15)};
            background: ${hsla(220, 45, 55, 0.04)};
            color: ${hsl(220, 65, 42)};
            text-shadow: 0 1px 2px ${hsla(220, 70, 30, 0.28)};
            transition: color 0.25s, text-shadow 0.25s;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-current {
            border-bottom-color: ${hsla(220, 60, 70, 0.15)};
            background: ${hsla(220, 60, 70, 0.04)};
            color: ${hsl(220, 65, 68)};
            text-shadow: 0 1px 2px ${hsla(220, 70, 8, 0.45)};
        }

        /* 头部：上一篇 / 下一篇 (标题下方) */
        .gan-header {
            display: flex;
            border-bottom: 1px solid ${hsla(220, 45, 55, 0.15)};
            flex-shrink: 0;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-header {
            border-bottom-color: ${hsla(220, 60, 70, 0.15)};
        }
        
        .gan-btn {
            flex: 1; 
            padding: 10px 0;
            text-align: center;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1.2;
            
            /* 继承色彩变量与过渡 */
            color: hsl(var(--toc-hue), 65%, 42%) !important;
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 30%, 0.28) !important;
            transition: color 0.25s, background-color 0.25s, text-shadow 0.25s !important;
        }
        .gan-btn:first-child:not(:only-child) { 
            border-right: 1px solid ${hsla(220, 45, 55, 0.15)}; 
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-btn:first-child:not(:only-child) { 
            border-right-color: ${hsla(220, 60, 70, 0.15)}; 
        }

        .gan-btn:hover:not(.gan-disabled) {
            background-color: rgba(148, 163, 184, 0.18);
            color: hsl(var(--toc-hue), 75%, 32%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 50%, 0.55) !important;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-btn:hover:not(.gan-disabled) {
            background-color: rgba(148, 163, 184, 0.16);
            color: hsl(var(--toc-hue), 75%, 78%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 60%, 0.75) !important;
        }
        
        .gan-disabled { 
            opacity: 0.4; 
            cursor: not-allowed; 
            flex: 1;
            padding: 10px 0;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1.2;
        }

        /* 文章列表容器 */
        .gan-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
            scrollbar-width: thin;
        }

        /* 列表项 (文字居中，带彩色与阴影) */
        .gan-item {
            display: block;
            padding: 4px 16px;
            text-align: center;
            text-decoration: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.85rem;
            
            /* 基础颜色与字体阴影（由 JS 生成色相） */
            color: hsl(var(--toc-hue), 65%, 42%) !important;
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 30%, 0.28) !important;
            transition: color 0.25s, background-color 0.25s, text-shadow 0.25s !important;
        }
        .gan-item:hover {
            background-color: rgba(148, 163, 184, 0.18);
            color: hsl(var(--toc-hue), 75%, 32%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 50%, 0.55) !important;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-item {
            color: hsl(var(--toc-hue), 65%, 68%) !important;
            text-shadow: 0 1px 2px hsla(var(--toc-hue), 70%, 8%, 0.45) !important;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-item:hover {
            background-color: rgba(148, 163, 184, 0.16);
            color: hsl(var(--toc-hue), 75%, 78%) !important;
            text-shadow: 0 0 10px hsla(var(--toc-hue), 90%, 60%, 0.75) !important;
        }
        
        /* 当前高亮项（统一参照 TOC 的高亮） */
        .gan-item.active {
            background-color: rgba(59, 130, 246, 0.12);
            border-left: 3px solid currentColor;
            font-weight: 600;
            padding-left: 13px; 
            padding-right: 16px;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-item.active {
            background-color: rgba(96, 165, 250, 0.18);
        }

        /* 窄屏自适应 */
        @media (max-width: 1249px) {
            #Gmeek-Article-RSS-TOC {
                display: none !important;
            }
        }
    `;
        loadResource('style', { css: css });
    }

    // ==================== 解析 RSS 并渲染 ====================
    function fetchAndRenderRSS() {
        fetch(RSS_URL)
            .then(res => {
                if (!res.ok) throw new Error('网络请求失败');
                return res.text();
            })
            .then(str => {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(str, "text/xml");
                var items = xmlDoc.querySelectorAll("item");
                if (!items.length) throw new Error('未找到文章');

                var articles = [];
                items.forEach(function (item) {
                    var title = item.querySelector("title") ? item.querySelector("title").textContent : "无标题";
                    var link = item.querySelector("link") ? item.querySelector("link").textContent : "#";
                    var pubDate = item.querySelector("pubDate") ? item.querySelector("pubDate").textContent : "";

                    var urlObj = new URL(link);
                    var cleanLink = urlObj.origin + urlObj.pathname;

                    articles.push({ title, link: cleanLink, pubDate });
                });

                renderNav(articles);
            })
            .catch(err => {
                console.warn('[ArticleNav] RSS 获取或解析失败: ', err);
                renderError(err.message);
            });
    }

    // ==================== 渲染 UI ====================
    function renderNav(articles) {
        if (document.getElementById(STACK_ID)) return;

        var stack = document.createElement('div');
        stack.id = STACK_ID;
        stack.setAttribute('data-theme', getMode());

        // 识别当前文章
        var currentUrl = window.location.origin + window.location.pathname;
        var normalizedCurrentUrl = currentUrl.replace(/\/index\.html$/, '/');

        var currentIndex = articles.findIndex(a => a.link === normalizedCurrentUrl || a.link === currentUrl);

        var prevHtml = '';
        var nextHtml = '';
        var currentTitle = '未找到当前文章';

        if (currentIndex !== -1) {
            var currentArticle = articles[currentIndex];
            currentTitle = currentArticle.title;

            // 上一篇
            if (currentIndex < articles.length - 1) {
                var prevArticle = articles[currentIndex + 1];
                prevHtml = `<a class="gan-btn" href="${prevArticle.link}" title="${escapeHTML(prevArticle.title)}" style="--toc-hue: ${randomHue()};">上一篇<br>${escapeHTML(prevArticle.title.substring(0, 6))}...</a>`;
            }

            // 下一篇
            if (currentIndex > 0) {
                var nextArticle = articles[currentIndex - 1];
                nextHtml = `<a class="gan-btn" href="${nextArticle.link}" title="${escapeHTML(nextArticle.title)}" style="--toc-hue: ${randomHue()};">下一篇<br>${escapeHTML(nextArticle.title.substring(0, 6))}...</a>`;
            }
        }

        // 构建 DOM
        var currentHtml = `<div class="gan-current" title="${escapeHTML(currentTitle)}">${escapeHTML(currentTitle)}</div>`;

        var headerHtml = '';
        if (prevHtml || nextHtml) {
            headerHtml = `<div class="gan-header">${prevHtml}${nextHtml}</div>`;
        }

        var listHtml = '<div class="gan-list">';
        articles.forEach(function (article, index) {
            var isActive = (index === currentIndex) ? ' active' : '';
            // 为每个列表项注入随机色相变量
            var hue = randomHue();
            listHtml += `<a class="gan-item${isActive}" href="${article.link}" title="${escapeHTML(article.title)}" style="--toc-hue: ${hue};">${escapeHTML(article.title)}</a>`;
        });
        listHtml += '</div>';

        stack.innerHTML = currentHtml + headerHtml + listHtml;
        document.body.appendChild(stack);

        // 自动居中
        setTimeout(() => {
            var activeItem = stack.querySelector('.gan-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'center' });
            }
            updatePosition();
        }, 100);
    }

    function renderError(msg) {
        if (document.getElementById(STACK_ID)) return;
        var stack = document.createElement('div');
        stack.id = STACK_ID;
        stack.setAttribute('data-theme', getMode());
        stack.innerHTML = `<div class="gan-current" style="color:red;">RSS 加载失败<br><span style="font-size:12px">${msg}</span></div>`;
        document.body.appendChild(stack);
        updatePosition();
    }

    // ==================== 主题与窗口同步 ====================
    function syncTheme() {
        var stack = document.getElementById(STACK_ID);
        if (!stack) return;
        stack.setAttribute('data-theme', getMode());
    }

    function setupListeners() {
        if (window.MutationObserver) {
            var observer = new MutationObserver(syncTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
        }
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
        }

        window.addEventListener('resize', updatePosition);
    }

    // ==================== 初始化 ====================
    (function init() {
        function boot() {
            injectNavStyle();
            setupListeners();
            fetchAndRenderRSS();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    })();

})();