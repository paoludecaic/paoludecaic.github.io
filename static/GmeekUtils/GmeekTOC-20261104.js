/**
 * GmeekTOC-20261104.js
 * GmeekTOC 文章目录工具 随机展开3/4级目录
 * 20261104 版本号 2026年11月4日 发版的稳定版
 * 基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 引用地址 https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261104.js
**/


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

/* ---- 目录链接随机彩色 ---- */
function colorizeTOC() {
    var links = document.querySelectorAll('.toc a.toc-link');
    links.forEach(function (a) {
        var hue = Math.floor(Math.random() * 360);
        a.style.color = 'hsl(' + hue + ', 65%, 42%)';
        a.style.transition = 'color 0.25s, background-color 0.25s';
        a.addEventListener('mouseenter', function () {
            a.style.color = 'hsl(' + hue + ', 75%, 32%)';
        });
        a.addEventListener('mouseleave', function () {
            a.style.color = 'hsl(' + hue + ', 65%, 42%)';
        });
    });
}

/* ---- 隐藏空目录 ---- */
function hideEmptyTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    if (!toc.querySelector('a.toc-link')) {
        toc.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    createTOC();

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
            max-height: 60vh;
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

        /* ===== 折叠动画（替代强制展开，让 collapseDepth 生效） ===== */
        .toc .is-collapsible {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .toc .is-collapsible.is-open {
            max-height: 1000px;
            opacity: 1;
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
    `;
    loadResource('style', { css: css });

    var randomDepth = Math.random() < 0.5 ? 3 : 4;

    loadResource('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js' }, function () {
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
            collapseDepth: randomDepth,
        });

        colorizeTOC();

        setTimeout(function () {
            colorizeTOC();
            hideEmptyTOC();
        }, 300);
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