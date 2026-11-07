/**
 * Gmeek-load-plugins-20261107.js
 * 自定义插件整合包
 *
 * 只需要维护 PLUGIN_URLS 插件列表就可以实现动态加载其余插件
 * 目前整合包只对 https://blog.caicai.asia/GmeekUtils/* URL下插件负责，确保其兼容性
 * 其余地址的插件需要各位自行甄别
 * 2026年11月7日
 *
 * 引用地址 https://blog.caicai.asia/plugins/Gmeek-load-plugins-20261107.js
 */


/**
 * 目前可整合插件
 * 文章目录插件   GmeekTOC-20261107.js              https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261107.js
 * 文章导航插件   Gmeek-Article-RSS-TOC-20261107.js https://blog.caicai.asia/GmeekUtils/Gmeek-Article-RSS-TOC-20261107.js
 * 
 * GmeekButton-Top-Foot-row-20261107.js/GmeekButton-Top-Foot-column-20261107.js 只能选择加载其中一个
 * 回到顶部/底部按钮-行排列 GmeekButton-Top-Foot-row-20261107.js https://blog.caicai.asia/GmeekUtils/GmeekButton-Top-Foot-row-20261107.js
 * 回到顶部/底部按钮-列排列 GmeekButton-Top-Foot-column-20261107.js https://blog.caicai.asia/GmeekUtils/GmeekButton-Top-Foot-column-20261107.js
 */


(function () {
    'use strict';


    if (window.__GmeekPluginsLoaded__) {
        console.log('[Gmeek Plugins] 已加载过，跳过重复执行。');
        return;
    }
    window.__GmeekPluginsLoaded__ = true;

    // 插件基础路径（换域名请同步修改）
    var LOAD_BASE_URL = 'https://blog.caicai.asia/GmeekUtils/'; 

    // 单个脚本加载超时（毫秒）
    var SCRIPT_TIMEOUT = 10000;
    
    // 单个脚本失败后的重试次数
    var MAX_RETRY = 3;     
    
    // 全部加载完成后派发的事件名
    var READY_EVENT = 'gmeek-load-plugins-ready'; 

    // ===== 插件列表（只维护这里即可扩展）=====
    var PLUGIN_URLS = [

        // 1. 左侧：基于 RSS 的文章导航
        LOAD_BASE_URL + 'Gmeek-Article-RSS-TOC-20261107.js',

        // 2. 右侧：文章目录 TOC
        LOAD_BASE_URL + 'GmeekTOC-20261107.js',

        // 3. 右下角：回到顶部/底部按钮 GmeekButton-Top-Foot-row-20261107.js/GmeekButton-Top-Foot-column-20261107.js 只能选择加载其中一个
        LOAD_BASE_URL + 'GmeekButton-Top-Foot-row-20261107.js'

    ];



    function loadScriptOnce(url) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var settled = false;

            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                script.onload = script.onerror = null;
                if (script.parentNode) script.parentNode.removeChild(script);
                reject(new Error('Timeout(' + SCRIPT_TIMEOUT + 'ms): ' + url));
            }, SCRIPT_TIMEOUT);

            script.src = url;
            script.async = false;

            script.onload = function () {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                console.log('[Gmeek Plugins] 成功加载:', url);
                resolve();
            };

            script.onerror = function () {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                console.warn('[Gmeek Plugins] 脚本加载失败:', url);
                reject(new Error('Failed to load script: ' + url));
            };

            document.head.appendChild(script);
        });
    }


    function loadScript(url) {
        var attempt = 0;

        function tryLoad() {
            return loadScriptOnce(url).catch(function (err) {
                if (attempt < MAX_RETRY) {
                    attempt++;
                    console.warn('[Gmeek Plugins] 重试第 ' + attempt + ' 次:', url);
                    return tryLoad();
                }
                throw err;
            });
        }

        return tryLoad();
    }


    function loadPluginsSequentially() {
        var failed = [];

        PLUGIN_URLS.reduce(function (promiseChain, currentUrl) {
            return promiseChain.then(function () {
                return loadScript(currentUrl).catch(function (err) {
                    console.warn('[Gmeek Plugins] 跳过错误继续执行:', err.message);
                    failed.push({ url: currentUrl, message: err.message });
                });
            });
        }, Promise.resolve()).then(function () {
            if (failed.length) {
                console.warn('[Gmeek Plugins] 所有插件加载流程结束，失败 ' + failed.length + ' 个:', failed);
            } else {
                console.log('[Gmeek Plugins] 所有插件加载流程结束，全部成功。');
            }

            try {
                document.dispatchEvent(new CustomEvent(READY_EVENT, {
                    detail: {
                        total: PLUGIN_URLS.length,
                        failed: failed
                    }
                }));
            } catch (e) {
                console.warn(e.message);
            }
        });
    }


    function boot() {
        console.log('[Gmeek Plugins] 整合包开始按序加载外部资源...');
        loadPluginsSequentially();
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();