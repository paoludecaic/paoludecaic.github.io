/**
 * Gmeek-Article-RSS-TOC-20261107.js
 * Article-RSS-TOC 基于 RSS 的文章导航目录 包含：上一篇、下一篇、当前文章、文章列表
 * 20261107 版本号 2026年11月7日 发版的稳定版
 *
 * 引用地址 https://blog.caicai.asia/GmeekUtils/Gmeek-Article-RSS-TOC-20261107.js
 * 引用方法 "script":"<script src='https://blog.caicai.asia/GmeekUtils/Gmeek-Article-RSS-TOC-20261107.js'></script>"
**/


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

// ==================== 样式注入 ====================
function injectNavStyle() {
    var css = `
        #gmeek-article-nav {
            position: fixed;
            top: 130px;
            left: 50%;
            /* 默认放在现有 TOC 右侧，若你的 TOC 宽度或位置有变，调整这里的 300px 即可 */
            transform: translateX(50%) translateX(540px); 
            width: 260px;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
            border-radius: 14px;
            z-index: 100;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.85rem;
            overflow: hidden; /* 防止圆角溢出 */
        }

        /* 亮色主题 */
        #gmeek-article-nav[data-theme="light"] {
            background: linear-gradient(145deg, #ffffff, hsl(220, 45%, 97%));
            border: 1px solid hsla(220, 45%, 55%, 0.22);
            box-shadow: 0 10px 25px -5px hsla(220, 70%, 45%, 0.42), 0 8px 10px -6px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9) inset;
            color: #334155;
        }

        /* 暗色主题 */
        #gmeek-article-nav[data-theme="dark"] {
            background: linear-gradient(145deg, hsl(220, 24%, 18%), hsl(220, 30%, 11%));
            border: 1px solid hsla(220, 60%, 70%, 0.28);
            box-shadow: 0 10px 25px -5px hsla(220, 70%, 45%, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
            color: #cbd5e1;
        }

        /* 头部：上一篇 / 下一篇 */
        .gan-header {
            display: flex;
            border-bottom: 1px solid hsla(220, 45%, 55%, 0.15);
            flex-shrink: 0;
        }
        #gmeek-article-nav[data-theme="dark"] .gan-header {
            border-bottom-color: hsla(220, 60%, 70%, 0.15);
        }
        
        .gan-btn {
            flex: 1;
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
        .gan-btn:first-child { border-right: 1px solid hsla(220, 45%, 55%, 0.15); }
        #gmeek-article-nav[data-theme="dark"] .gan-btn:first-child { border-right-color: hsla(220, 60%, 70%, 0.15); }

        .gan-btn:hover:not(.gan-disabled) {
            background: hsla(220, 70%, 55%, 0.08);
            color: hsl(220, 70%, 55%);
        }
        #gmeek-article-nav[data-theme="dark"] .gan-btn:hover:not(.gan-disabled) {
            background: hsla(220, 70%, 60%, 0.12);
            color: hsl(220, 70%, 65%);
        }
        
        .gan-disabled { opacity: 0.4; cursor: not-allowed; }

        /* 当前文章标题 */
        .gan-current {
            padding: 12px;
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
        #gmeek-article-nav[data-theme="dark"] .gan-current {
            border-bottom-color: hsla(220, 60%, 70%, 0.15);
            background: hsla(220, 60%, 70%, 0.04);
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
        #gmeek-article-nav[data-theme="dark"] .gan-list::-webkit-scrollbar-thumb { background-color: #475569; }

        /* 列表项 */
        .gan-item {
            display: block;
            padding: 6px 16px;
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
        #gmeek-article-nav[data-theme="dark"] .gan-item:hover {
            background: hsla(220, 70%, 60%, 0.12);
            color: hsl(220, 70%, 65%);
        }
        
        /* 当前高亮项 */
        .gan-item.active {
            background: hsla(220, 70%, 55%, 0.15);
            color: hsl(220, 70%, 45%);
            font-weight: 600;
            border-left: 3px solid hsl(220, 70%, 55%);
            padding-left: 13px;
        }
        #gmeek-article-nav[data-theme="dark"] .gan-item.active {
            background: hsla(220, 70%, 60%, 0.2);
            color: hsl(220, 70%, 75%);
            border-left-color: hsl(220, 70%, 65%);
        }

        /* 窄屏适配 */
        @media (max-width: 1024px) {
            #gmeek-article-nav {
                display: none !important; /* 小屏默认隐藏，防止遮挡 */
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

                // 处理 URL 格式化，确保与浏览器地址栏匹配
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
    // 去除 index.html 等后缀以便更好匹配
    var normalizedCurrentUrl = currentUrl.replace(/\/index\.html$/, '/');

    var currentIndex = articles.findIndex(a => a.link === normalizedCurrentUrl || a.link === currentUrl);

    var prevHtml = '<span class="gan-disabled">上一篇<br>按钮</span>';
    var nextHtml = '<span class="gan-disabled">下一篇<br>按钮</span>';
    var currentTitle = '未找到当前文章';

    if (currentIndex !== -1) {
        var currentArticle = articles[currentIndex];
        currentTitle = currentArticle.title;

        // 注意：RSS 通常按时间倒序排列（新的在前）。
        // "上一篇" 通常指时间更早的（索引更大的），"下一篇" 指时间更新的（索引更小的）。
        if (currentIndex < articles.length - 1) {
            var prevArticle = articles[currentIndex + 1];
            prevHtml = `<a class="gan-btn" href="${prevArticle.link}" title="${escapeHTML(prevArticle.title)}">上一篇<br>${escapeHTML(prevArticle.title.substring(0, 6))}...</a>`;
        }

        if (currentIndex > 0) {
            var nextArticle = articles[currentIndex - 1];
            nextHtml = `<a class="gan-btn" href="${nextArticle.link}" title="${escapeHTML(nextArticle.title)}">下一篇<br>${escapeHTML(nextArticle.title.substring(0, 6))}...</a>`;
        }
    }

    // 构建头部
    var headerHtml = `<div class="gan-header">${prevHtml}${nextHtml}</div>`;
    var currentHtml = `<div class="gan-current" title="${escapeHTML(currentTitle)}">${escapeHTML(currentTitle)}</div>`;

    // 构建列表
    var listHtml = '<div class="gan-list">';
    articles.forEach(function (article, index) {
        var isActive = (index === currentIndex) ? ' active' : '';
        listHtml += `<a class="gan-item${isActive}" href="${article.link}" title="${escapeHTML(article.title)}">${escapeHTML(article.title)}</a>`;
    });
    listHtml += '</div>';

    stack.innerHTML = headerHtml + currentHtml + listHtml;
    document.body.appendChild(stack);

    // 让当前项在列表中自动居中
    setTimeout(() => {
        var activeItem = stack.querySelector('.gan-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'center' });
        }
    }, 100);
}

function renderError(msg) {
    if (document.getElementById(STACK_ID)) return;
    var stack = document.createElement('div');
    stack.id = STACK_ID;
    stack.setAttribute('data-theme', getMode());
    stack.innerHTML = `<div class="gan-current" style="color:red;">RSS 加载失败<br><span style="font-size:12px">${msg}</span></div>`;
    document.body.appendChild(stack);
}

// ==================== 主题同步 ====================
function syncTheme() {
    var stack = document.getElementById(STACK_ID);
    if (!stack) return;
    stack.setAttribute('data-theme', getMode());
}

function setupThemeListener() {
    if (window.MutationObserver) {
        var observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
    }
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
    }
}

// ==================== 初始化 ====================
(function init() {
    function boot() {
        injectNavStyle();
        setupThemeListener();
        fetchAndRenderRSS();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();