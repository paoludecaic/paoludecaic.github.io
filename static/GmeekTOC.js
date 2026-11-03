/**
 * 由DeepSeek-V4.1-Flash-1017基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 时间 2026-11-3 21:08:46 
 * 
 * 优化：多级目录缩进、阴影美化、返回顶部按钮
 * **/

function loadResource(type, attributes, callback) {
    var element;
    if (type === 'script') {
        element = document.createElement('script');
        element.src = attributes.src;
        element.async = true;
        element.onload = callback;
        element.onerror = function () {
            console.warn('[GmeekTocBot] 脚本加载失败:', attributes.src);
        };
    } else if (type === 'link') {
        element = document.createElement('link');
        element.rel = attributes.rel || 'stylesheet';
        element.href = attributes.href;
        element.onerror = function () {
            console.warn('[GmeekTocBot] 样式加载失败:', attributes.href);
        };
    } else if (type === 'style') {
        element = document.createElement('style');
        element.appendChild(document.createTextNode(attributes.css));
    } else {
        console.warn('[GmeekTocBot] 未知资源类型:', type);
        return;
    }
    document.head.appendChild(element);
}

// 标题 id 规范化：去空白、去标点、去重
function slugify(text, used) {
    var base = text.trim()
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5\-]/g, '')   // 保留中英文、数字、连字符
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'heading';
    var id = base, i = 1;
    while (used.has(id)) { id = base + '-' + (i++); }
    used.add(id);
    return id;
}

function createTOC() {
    var contentContainer = document.getElementById('content');
    if (!contentContainer) return;

    // 同步生成标题 id，保证 tocbot.init 时 id 已就绪
    var used = new Set();
    document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6')
        .forEach(function (heading) {
            if (!heading.id) heading.id = slugify(heading.textContent, used);
        });

    var tocElement = document.createElement('div');
    tocElement.className = 'toc';
    if (contentContainer.firstChild) {
        contentContainer.insertBefore(tocElement, contentContainer.firstChild);
    } else {
        contentContainer.appendChild(tocElement);
    }

    // 创建返回顶部按钮，插入到 .toc 之后
    var topBtn = document.createElement('button');
    topBtn.className = 'toc-top-btn';
    topBtn.textContent = '↑ TOP';
    topBtn.setAttribute('aria-label', '返回页面顶部');
    topBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (tocElement.nextSibling) {
        contentContainer.insertBefore(topBtn, tocElement.nextSibling);
    } else {
        contentContainer.appendChild(topBtn);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('content')) return;

    createTOC();

    var css = `
        /* ---- 目录整体美化 ---- */
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
        }
        .toc:hover {
            box-shadow: 0 25px 40px -10px rgba(0, 0, 0, 0.2),
                        0 12px 20px -8px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        .toc::-webkit-scrollbar {
            width: 6px;
        }
        .toc::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        .toc::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        /* 目录列表样式 */
        .toc .toc-list {
            padding-left: 0;
            margin: 0;
            list-style: none;
        }
        .toc .toc-list-item {
            margin: 2px 0;
            padding: 0;
            list-style: none;
        }
        /* 多级缩进：每一级嵌套缩进 10px */
        .toc .toc-list .toc-list {
            padding-left: 10px;
        }
        /* 链接样式 */
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
        /* 返回顶部按钮 */
        .toc-top-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 16px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
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
                width: 100%;
                margin-top: 12px;
            }
        }
    `;
    loadResource('style', { css: css });

    loadResource('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css' });

    loadResource('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js' }, function () {
        if (typeof tocbot === 'undefined') return;
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
        });
    });

    // 保留原作者的项目地址日志
    console.log("\n %c GmeekVercount Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#bc4c00;color:#fff");
});