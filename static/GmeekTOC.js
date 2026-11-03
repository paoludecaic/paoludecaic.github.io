/**
 * GmeekTOC.js
 * 基于 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js 修改
 * 优化：多级目录缩进、阴影美化、返回顶部按钮、CDN 降级、防重复初始化
 * 时间：2026-11-03
 */

(function () {
    'use strict';

    /* ============ 资源加载 ============ */
    function loadResource(type, attributes, callback) {
        var element;
        if (type === 'script') {
            element = document.createElement('script');
            element.src = attributes.src;
            element.async = true;
            element.onload = callback || function () { };
            element.onerror = function () {
                console.warn('[GmeekTOC] 脚本加载失败:', attributes.src);
                if (attributes.onerror) attributes.onerror();
            };
        } else if (type === 'link') {
            element = document.createElement('link');
            element.rel = attributes.rel || 'stylesheet';
            element.href = attributes.href;
            element.onerror = function () {
                console.warn('[GmeekTOC] 样式加载失败:', attributes.href);
                if (attributes.onerror) attributes.onerror();
            };
        } else if (type === 'style') {
            element = document.createElement('style');
            element.appendChild(document.createTextNode(attributes.css || ''));
        } else {
            console.warn('[GmeekTOC] 未知资源类型:', type);
            return;
        }
        document.head.appendChild(element);
    }

    /* ============ 标题 id 规范化 ============ */
    function slugify(text, used) {
        var base = (text || '').trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u4e00-\u9fa5\-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'heading';

        var id = base, i = 1;
        while (used.has(id)) { id = base + '-' + (i++); }
        used.add(id);
        return id;
    }

    /* ============ 兜底：CDN 加载失败时手搓目录 ============ */
    function buildFallbackTOC(headings) {
        if (!headings.length) return;
        var html = '<ul class="toc-list toc-list-fallback">';
        for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var level = parseInt(h.tagName.charAt(1), 10);
            var indent = Math.max(0, level - 1) * 10;
            html += '<li class="toc-list-item" style="margin-left:' + indent + 'px">' +
                '<a href="#' + h.id + '" class="toc-link">' +
                escapeHtml(h.textContent.trim()) +
                '</a></li>';
        }
        html += '</ul>';
        var toc = document.querySelector('.toc');
        if (toc) toc.innerHTML = html;

        // 点击平滑滚动
        var links = document.querySelectorAll('.toc a.toc-link');
        for (var j = 0; j < links.length; j++) {
            links[j].addEventListener('click', function (e) {
                e.preventDefault();
                var id = this.getAttribute('href').slice(1);
                var target = document.getElementById(id);
                if (target) {
                    var top = target.getBoundingClientRect().top + window.pageYOffset - 20;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            });
        }
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* ============ 返回顶部 ============ */
    function scrollToTop() {
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
    }

    /* ============ 主流程 ============ */
    var initialized = false;

    function createTOC() {
        if (initialized) return;
        initialized = true;

        var contentContainer = document.getElementById('content');
        if (!contentContainer) return;

        // 1. 同步生成标题 id
        var used = new Set();
        var headings = document.querySelectorAll(
            '.markdown-body h1, .markdown-body h2, .markdown-body h3, ' +
            '.markdown-body h4, .markdown-body h5, .markdown-body h6'
        );
        headings.forEach(function (heading) {
            if (!heading.id) heading.id = slugify(heading.textContent, used);
        });

        // 无标题直接跳过
        if (!headings.length) return;

        // 2. 创建目录容器
        var tocElement = document.createElement('div');
        tocElement.className = 'toc';
        if (contentContainer.firstChild) {
            contentContainer.insertBefore(tocElement, contentContainer.firstChild);
        } else {
            contentContainer.appendChild(tocElement);
        }

        // 3. 创建 TOP 按钮 —— 放进 .toc 内部，随目录定位
        var topBtn = document.createElement('button');
        topBtn.className = 'toc-top-btn';
        topBtn.type = 'button';
        topBtn.textContent = '↑ TOP';
        topBtn.setAttribute('aria-label', '返回页面顶部');
        topBtn.addEventListener('click', function (e) {
            e.preventDefault();
            scrollToTop();
        });
        tocElement.appendChild(topBtn);

        // 4. 注入样式
        loadResource('style', { css: CSS_TEXT });

        // 5. 加载 tocbot
        loadResource('link', {
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css'
        });

        loadResource('script', {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js',
            onerror: function () {
                // CDN 失败 → 手搓目录
                buildFallbackTOC(Array.prototype.slice.call(headings));
            }
        }, function () {
            if (typeof tocbot === 'undefined') {
                buildFallbackTOC(Array.prototype.slice.call(headings));
                return;
            }
            tocbot.init({
                tocSelector: '.toc',
                contentSelector: '.markdown-body',
                headingSelector: 'h1, h2, h3, h4, h5, h6',
                scrollSmooth: true,
                scrollSmoothOffset: -10,
                headingsOffset: 10,
                // 让 tocbot 只渲染列表，不覆盖我们的按钮
                // 通过额外容器隔离
                hasInnerContainers: false
            });
            // tocbot 会重写 .toc 内容，需要把按钮重新塞回去
            var toc = document.querySelector('.toc');
            if (toc) {
                var oldBtn = toc.querySelector('.toc-top-btn');
                if (!oldBtn) toc.appendChild(topBtn);
            }
        });
    }

    /* ============ 样式 ============ */
    var CSS_TEXT = `
        /* ---- 目录整体 ---- */
        .toc {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(calc(50% + 300px));
            width: 240px;
            padding: 20px 16px 16px 16px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-radius: 20px;
            box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.15),
                        0 10px 15px -6px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 255, 255, 0.7) inset;
            border: 1px solid rgba(255, 255, 255, 0.5);
            max-height: calc(100vh - 200px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
            transition: box-shadow 0.2s;
            z-index: 100;
            box-sizing: border-box;
        }
        .toc:hover {
            box-shadow: 0 25px 40px -10px rgba(0, 0, 0, 0.2),
                        0 12px 20px -8px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        .toc::-webkit-scrollbar { width: 6px; }
        .toc::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .toc::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        /* 目录列表 */
        .toc .toc-list { padding-left: 0; margin: 0; list-style: none; }
        .toc .toc-list-item { margin: 2px 0; padding: 0; list-style: none; }
        .toc .toc-list .toc-list { padding-left: 10px; }

        /* 链接 */
        .toc a {
            display: block;
            padding: 5px 8px 5px 10px;
            font-size: 0.85rem;
            line-height: 1.5;
            color: #1e293b;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.15s;
            border-left: 2px solid transparent;
            word-break: break-word;
        }
        .toc a:hover {
            background-color: #eef2ff;
            color: #1e40af;
            border-left-color: #a5b4fc;
        }
        .toc .is-active-link {
            background-color: #e0e7ff;
            color: #1e3a8a;
            font-weight: 600;
            border-left-color: #3b82f6;
        }

        /* 返回顶部按钮 —— 目录内吸底 */
        .toc-top-btn {
            position: sticky;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 12px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #fff;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
            width: 100%;
            text-align: center;
            letter-spacing: 0.3px;
            font-family: inherit;
        }
        .toc-top-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
            transform: translateY(-1px);
        }
        .toc-top-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
        }

        /* 响应式 */
        @media (max-width: 1249px) {
            .toc {
                position: static;
                transform: none;
                width: 100%;
                max-height: none;
                margin-bottom: 20px;
                background-color: #f8fafc;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
                backdrop-filter: none;
            }
            .toc-top-btn {
                position: static;
                width: 100%;
                margin-top: 12px;
            }
        }

        /* 暗色主题兜底（如站点开启） */
        @media (prefers-color-scheme: dark) {
            .toc {
                background: rgba(30, 41, 59, 0.85);
                border-color: rgba(255, 255, 255, 0.08);
            }
            .toc a { color: #e2e8f0; }
            .toc a:hover { background-color: #334155; color: #bfdbfe; }
            .toc .is-active-link { background-color: #1e3a8a; color: #fff; }
        }
    `;

    /* ============ 启动 ============ */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('content')) return;
        createTOC();

        console.log(
            "\n %c GmeekVercount Plugins https://github.com/Meekdai/Gmeek \n",
            "padding:5px 0;background:#bc4c00;color:#fff"
        );
    });
})();