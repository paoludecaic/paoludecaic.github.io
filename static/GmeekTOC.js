/**
 * 由DeepSeek-V4.1-Flash-1017基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekTocBot.js
 * 
 * 时间 2026-11-3 21:08:46 
 * 
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
        element = document.createElement('style');   // 去掉无效的 rel
        element.appendChild(document.createTextNode(attributes.css));
    } else {
        console.warn('[GmeekTocBot] 未知资源类型:', type);
        return;                                       // type 兜底
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
    while (used.has(id)) { id = base + '-' + (i++); }  // 重复标题去重
    used.add(id);
    return id;
}

function createTOC() {
    var contentContainer = document.getElementById('content');
    if (!contentContainer) return;              // 空值保护

    // 先同步生成标题 id，保证 tocbot.init 时 id 已就绪
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
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('content')) return;   // 非文章页直接跳过

    createTOC();

    var css = '.toc{position:fixed;top:130px;left:50%;transform:translateX(calc(50% + 300px));width:200px;padding-left:30px;}' +
        '@media (max-width:1249px){.toc{position:static;top:auto;left:auto;transform:none;padding:10px;margin-bottom:20px;background-color:var(--color-open-muted);}}';
    loadResource('style', { css: css });

    loadResource('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.css' });

    loadResource('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.27.4/tocbot.min.js' }, function () {
        if (typeof tocbot === 'undefined') return;     // 脚本异常兜底
        tocbot.init({
            tocSelector: '.toc',
            contentSelector: '.markdown-body',
            headingSelector: 'h1, h2, h3, h4, h5, h6',
            scrollSmooth: true,
            scrollSmoothOffset: -10,
            headingsOffset: 10,
        });
    });

    //  保留大佬的项目地址
    console.log("\n %c GmeekVercount Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#bc4c00;color:#fff");
});