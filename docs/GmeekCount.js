/**
 * 由DeepSeek-V4.1-Flash-1017基于原始脚本修改 https://blog.meekdai.com/Gmeek/plugins/GmeekVercount.js
 * 
 * 时间 2026-11-3 21:05:24 
 * 
 * **/


function createVercount() {
    // 幂等保护：避免重复插入
    if (document.getElementById('busuanzi_container_page_pv')) return;

    var postBody = document.getElementById('postBody');
    if (postBody) {
        postBody.insertAdjacentHTML('afterend',
            '<div id="busuanzi_container_page_pv" style="display:none;float:left;margin-top:8px;font-size:small;">本文浏览量 <span id="busuanzi_value_page_pv"></span> 人次</div>'
        );
    }

    // 空值保护：元素不存在时跳过，避免 TypeError
    var runday = document.getElementById('runday');
    if (runday) {
        runday.insertAdjacentHTML('afterend',
            '<span id="busuanzi_container_site_pv" style="display:none">总浏览量 <span id="busuanzi_value_site_pv"></span> 人次 • </span>'
        );
    }
}

function loadVercountScript() {
    // 避免重复加载脚本
    if (document.getElementById('vercount-script')) return;

    var element = document.createElement('script');
    element.id = 'vercount-script';
    element.src = 'https://vercount.one/js';
    element.onerror = function () {
        console.warn('[GmeekVercount] 统计脚本加载失败，请检查网络或 CDN 可用性。');
    };
    document.head.appendChild(element);
}

document.addEventListener('DOMContentLoaded', function () {
    createVercount();
    loadVercountScript();

    //  保留大佬的项目地址
    console.log("\n %c GmeekVercount Plugins https://github.com/Meekdai/Gmeek \n", "padding:5px 0;background:#bc4c00;color:#fff");
});