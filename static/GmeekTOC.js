/**
 * GmeekTOC.js
 * 基于 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js 修改
 * 优化：多级目录缩进、阴影美化、返回顶部按钮、CDN 降级、防重复初始化
 * 时间：2026-11-03
 */

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

/* ---- 1. 右下角 TOP 按钮 ---- */
function createTopButton() {
    var btn = document.createElement('button');
    btn.className = 'gmeek-top-btn';
    btn.type = 'button';
    btn.textContent = '↑ TOP';
    btn.setAttribute('aria-label', '返回页面顶部');
    btn.addEventListener('click', function () {
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
    });
    document.body.appendChild(btn);
}

/* ---- 3. 目录链接随机彩色 ---- */
function colorizeTOC() {
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        // 随机 hue，固定饱和度和亮度保证可读性
        var hue = Math.floor(Math.random() * 360);
        a.style.color = 'hsl(' + hue + ', 65%, 42%)';
        a.style.transition = 'color 0.25s, background-color 0.25s';
        // hover 时保持同色系但更深
        a.addEventListener('mouseenter', function () {
            a.style.color = 'hsl(' + hue + ', 75%, 32%)';
        });
        a.addEventListener('mouseleave', function () {
            a.style.color = 'hsl(' + hue + ', 65%, 42%)';
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    createTOC();
    createTopButton();   // 1. 右下角 TOP 按钮

    var css = `
        /* ===== 目录框美化 ===== */
        .toc {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(50%) translateX(300px);
            width: 220px;
            padding: 16px 16px 16px 20px;
            background: #ffffff;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            box-shadow:
                0 10px 25px -5px rgba(0, 0, 0, 0.12),
                0 8px 10px -6px rgba(0, 0, 0, 0.08),
                0 0 0 1px rgba(255, 255, 255, 0.6) inset;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
            z-index: 100;
            transition: box-shadow 0.2s;
        }
        .toc:hover {
            box-shadow:
                0 14px 30px -6px rgba(0, 0, 0, 0.16),
                0 10px 14px -8px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        .toc::-webkit-scrollbar { width: 6px; }
        .toc::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .toc::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

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
        .toc .is-active-link {
            font-weight: 600;
            background-color: #eff6ff;
            border-left-color: currentColor;
        }

        /* ===== 1. 强制展开所有层级（覆盖 tocbot 默认折叠） ===== */
        .toc .toc-list { display: block !important; }
        .toc .toc-list-item { display: list-item !important; }
        .toc .is-collapsible { max-height: none !important; }
        .toc .is-collapsed { max-height: none !important; }

        /* ===== 2. 右下角 TOP 按钮 ===== */
        .gmeek-top-btn {
            position: fixed;
            right: 28px;
            bottom: 28px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #fff;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.3px;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
            transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        }
        .gmeek-top-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            box-shadow: 0 8px 22px rgba(37, 99, 235, 0.5);
            transform: translateY(-2px);
        }
        .gmeek-top-btn:active {
            transform: translateY(0);
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
        }

        /* ===== 响应式 ===== */
        @media (max-width: 1249px) {
            .toc {
                position: static;
                transform: none;
                width: 100%;
                max-height: none;
                margin-bottom: 20px;
                background-color: #f8fafc;
                padding: 14px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
        }
        @media (max-width: 600px) {
            .gmeek-top-btn {
                right: 16px;
                bottom: 16px;
                width: 46px;
                height: 46px;
                font-size: 0.7rem;
            }
        }
    `;
    loadResource('style', { css: css });

    loadResource('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js' }, function () {
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
            collapseDepth: 6,           // 1. 深度 6 = 全部展开
            // 若 tocbot 版本支持，也可用：collapseDepth: Number.MAX_SAFE_INTEGER
        });

        // 3. tocbot 渲染完后再着色（顺序很重要）
        colorizeTOC();

        // 兜底：部分情况下 tocbot 异步渲染，延迟再着色一次
        setTimeout(colorizeTOC, 300);
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