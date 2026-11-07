/**
 * Gmeek-Article-RSS-TOC-20261107.js
 * Article-RSS-TOC 基于 RSS 的文章导航目录 包含：上一篇、下一篇、当前文章、文章列表
 * 20261107 版本号 2026年11月7日 发版的稳定版
 * 2026年11月7日16:31:28
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

    // ==================== 动态位置计算 ====================
    // 根据中间文章容器的位置，动态计算导航栏的 right 值
    function updatePosition() {
        var stack = document.getElementById(STACK_ID);
        if (!stack) return;

        // 尝试获取 Gmeek 的文章主容器
        var content = document.querySelector('.markdown-body') || document.getElementById('content') || document.querySelector('article');

        if (content) {
            var rect = content.getBoundingClientRect();
            // 计算文章左侧距离屏幕左侧的距离
            var leftSpace = rect.left;
            // 如果左侧空间足够，把面板放在距离文章左边 24px 的位置
            // 公式：right = 屏幕宽度 - 文章左边距 + 间距
            if (leftSpace > 280) {
                stack.style.right = (window.innerWidth - leftSpace + 24) + 'px';
                stack.style.display = 'flex';
            } else {
                // 屏幕太窄，左边放不下了，隐藏面板
                stack.style.display = 'none';
            }
        } else {
            // 如果找不到文章容器，给个保底的右侧固定值
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
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.85rem;
            overflow: hidden;
        }

        /* 亮色主题 */
        #Gmeek-Article-RSS-TOC[data-theme="light"] {
            background: linear-gradient(145deg, #ffffff, hsl(220, 45%, 97%));
            border: 1px solid hsla(220, 45%, 55%, 0.22);
            box-shadow: 0 10px 25px -5px hsla(220, 70%, 45%, 0.42), 0 8px 10px -6px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9) inset;
            color: #334155;
        }

        /* 暗色主题 */
        #Gmeek-Article-RSS-TOC[data-theme="dark"] {
            background: linear-gradient(145deg, hsl(220, 24%, 18%), hsl(220, 30%, 11%));
            border: 1px solid hsla(220, 60%, 70%, 0.28);
            box-shadow: 0 10px 25px -5px hsla(220, 70%, 45%, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
            color: #cbd5e1;
        }

        /* 当前文章标题 (最上方) */
        .gan-current {
            padding: 14px 12px;
            text-align: center;
            font-weight: 700;
            font-size: 0.9rem;
            border-bottom: 1px solid hsla(220, 45%, 55%, 0.15);
            background: hsla(220, 45%, 55%, 0.04);
            flex-shrink: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-current {
            border-bottom-color: hsla(220, 60%, 70%, 0.15);
            background: hsla(220, 60%, 70%, 0.04);
        }

        /* 头部：上一篇 / 下一篇 (标题下方) */
        .gan-header {
            display: flex;
            border-bottom: 1px solid hsla(220, 45%, 55%, 0.15);
            flex-shrink: 0;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-header {
            border-bottom-color: hsla(220, 60%, 70%, 0.15);
        }
        
        .gan-btn {
            flex: 1; /* 如果有两个按钮，平分宽度；如果只有一个，占满 100% */
            padding: 10px 0;
            text-align: center;
            text-decoration: none;
            color: inherit;
            font-weight: 600;
            transition: background 0.2s, color 0.2s;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1.2;
        }
        /* 只有两个按钮都在时，才画中间的分割线 */
        .gan-btn:first-child:not(:only-child) { 
            border-right: 1px solid hsla(220, 45%, 55%, 0.15); 
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-btn:first-child:not(:only-child) { 
            border-right-color: hsla(220, 60%, 70%, 0.15); 
        }

        .gan-btn:hover:not(.gan-disabled) {
            background: hsla(220, 70%, 55%, 0.08);
            color: hsl(220, 70%, 55%);
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-btn:hover:not(.gan-disabled) {
            background: hsla(220, 70%, 60%, 0.12);
            color: hsl(220, 70%, 65%);
        }
        
        /* 禁用状态，仅在渲染时作为空位占位时使用 */
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
        .gan-list::-webkit-scrollbar { width: 6px; }
        .gan-list::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-list::-webkit-scrollbar-thumb { background-color: #475569; }

        /* 列表项 (文字居中) */
        .gan-item {
            display: block;
            padding: 6px 16px;
            text-align: center;
            text-decoration: none;
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: background 0.2s, color 0.2s;
            font-size: 0.85rem;
        }
        .gan-item:hover {
            background: hsla(220, 70%, 55%, 0.08);
            color: hsl(220, 70%, 55%);
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-item:hover {
            background: hsla(220, 70%, 60%, 0.12);
            color: hsl(220, 70%, 65%);
        }
        
        /* 当前高亮项 */
        .gan-item.active {
            background: hsla(220, 70%, 55%, 0.15);
            color: hsl(220, 70%, 45%);
            font-weight: 600;
            border-left: 3px solid hsl(220, 70%, 55%);
            padding-left: 13px; /* 补偿 border 的 3px */
            padding-right: 16px;
        }
        #Gmeek-Article-RSS-TOC[data-theme="dark"] .gan-item.active {
            background: hsla(220, 70%, 60%, 0.2);
            color: hsl(220, 70%, 75%);
            border-left-color: hsl(220, 70%, 65%);
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

            // RSS 通常按时间倒序排列（最新在最前）
            // 上一篇：时间更早的（索引更大）
            if (currentIndex < articles.length - 1) {
                var prevArticle = articles[currentIndex + 1];
                prevHtml = `<a class="gan-btn" href="${prevArticle.link}" title="${escapeHTML(prevArticle.title)}">上一篇<br>${escapeHTML(prevArticle.title.substring(0, 6))}...</a>`;
            }

            // 下一篇：时间更新的（索引更小）
            if (currentIndex > 0) {
                var nextArticle = articles[currentIndex - 1];
                nextHtml = `<a class="gan-btn" href="${nextArticle.link}" title="${escapeHTML(nextArticle.title)}">下一篇<br>${escapeHTML(nextArticle.title.substring(0, 6))}...</a>`;
            }
        }

        // 构建 DOM
        var currentHtml = `<div class="gan-current" title="${escapeHTML(currentTitle)}">${escapeHTML(currentTitle)}</div>`;

        var headerHtml = '';
        // 如果上一/下一篇有任何一个存在，才渲染 header
        if (prevHtml || nextHtml) {
            headerHtml = `<div class="gan-header">${prevHtml}${nextHtml}</div>`;
        }

        var listHtml = '<div class="gan-list">';
        articles.forEach(function (article, index) {
            var isActive = (index === currentIndex) ? ' active' : '';
            listHtml += `<a class="gan-item${isActive}" href="${article.link}" title="${escapeHTML(article.title)}">${escapeHTML(article.title)}</a>`;
        });
        listHtml += '</div>';

        stack.innerHTML = currentHtml + headerHtml + listHtml;
        document.body.appendChild(stack);

        // 让当前项在列表中自动居中
        setTimeout(() => {
            var activeItem = stack.querySelector('.gan-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'center' });
            }
            // 首次渲染完成后计算位置
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
        // 监听主题变化
        if (window.MutationObserver) {
            var observer = new MutationObserver(syncTheme);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
        }
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
        }

        // 监听窗口大小变化，实时重新计算面板位置
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