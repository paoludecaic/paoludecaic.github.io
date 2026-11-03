#  `Gmeek` 基础配置
简单的基础配置，来自于  [[Gmeek快速上手](https://blog.meekdai.com/post/Gmeek-kuai-su-shang-shou.html)](https://blog.meekdai.com/post/Gmeek-kuai-su-shang-shou.html)  

剔除一些不常用的配置，常用简单配置如下

```json
{
    "title":"",
    "subTitle":"",
    "avatarUrl":"",
    "GMEEK_VERSION":"last",
    "displayTitle":"",    
    "startSite":"",
    "onePageListNum":"",
    "i18n":"CN",
    "UTC":8,      
    "showPostSource":1,
    "rssSplit":"sentence",
    "bottomText":"转载请注明出处",
    "needComment":1
}
```

我的个人简单配置（未包含插件部分）
```json
{{
    "title":"蔡永斌的博客",
    "subTitle":"记录我的经历",
    "avatarUrl":"https://blog.caicai.asia/logo.svg",
    "GMEEK_VERSION":"last",
    "displayTitle":"博客，记录美好生活",
    "homeUrl":"https://blog.caicai.asia",
    "faviconUrl":"https://blog.caicai.asia/logo.svg",
    "email":"2929507217@qq.com",
    "startSite":"11/01/2026",
    "onePageListNum":15,
    "singlePage":["about"],
    "commentLabelColor":"#006b75",
    "yearColorList":["#bc4c00", "#0969da", "#1f883d", "#A333D0"],
    "i18n":"CN",
    "UTC":8,    
    "urlMode":"issue",
    "showPostSource":1,
    "bottomText":"❤️ 转载文章请注明出处，谢谢！❤️",
    "primerCSS":"<link href='https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/Primer/21.0.7/primer.css' rel='stylesheet' />",
    "needComment":1
}
```

#  `Gmeek` 插件配置

目前推荐三个插件

1. 浏览量插件
2. 目录插件
3. 灯箱图片插件

## 浏览量插件  

推荐 `Vercount` 插件
```json
"allHead":"<script src='https://blog.meekdai.com/Gmeek/plugins/GmeekVercount.js'></script>"
```

## 目录插件

推荐TOC目录插件
### TOC目录插件
```json
"script":"<script src='https://blog.meekdai.com/Gmeek/plugins/GmeekTOC.js'></script>"
```

### articletoc目录插件
```json
"script":"<script src='https://blog.meekdai.com/Gmeek/plugins/articletoc.js'></script>"
```

## 灯箱图片插件

点击图片就会出现灯箱效果

```json
"script":"<script src='https://blog.meekdai.com/Gmeek/plugins/lightbox.js'></script>"
```

## 多插件配置

多插件配置，目前推荐  `浏览量插件+TOC目录插件+灯箱图片插件` ，节选配置如下
浏览量插件使用 `allHead`  关键字配置 
TOC目录插件+灯箱图片插件使用  `script` 关键字配置

```json
"allHead":"<script src='https://blog.meekdai.com/Gmeek/plugins/GmeekVercount.js'></script>",
"script":"<script src='https://blog.meekdai.com/Gmeek/plugins/GmeekTOC.js'></script><script src='https://blog.meekdai.com/Gmeek/plugins/lightbox.js'></script>"
```


# 我的完整配置

```json
{
    "title":"蔡永斌的博客",
    "subTitle":"记录我的经历",
    "avatarUrl":"https://blog.caicai.asia/img/logo.svg",
    "GMEEK_VERSION":"last",
    "displayTitle":"博客，记录美好生活",
    "homeUrl":"https://blog.caicai.asia",
    "faviconUrl":"https://blog.caicai.asia/img/logo.svg",
    "email":"2929507217@qq.com",
    "startSite":"11/01/2026",
    "onePageListNum":15,
    "singlePage":["about"],
    "commentLabelColor":"#006b75",
    "yearColorList":["#bc4c00", "#0969da", "#1f883d", "#A333D0"],
    "i18n":"CN",
    "UTC":8,    
    "urlMode":"issue",
    "script":"<script src='https://blog.caicai.asia/GmeekUtils/GmeekTOC-20261103.js'></script>",
    "allHead":"<script src='https://blog.caicai.asia/GmeekUtils/GmeekPageView-20261103.js'></script>",
    "showPostSource":1,
    "bottomText":"❤️ 转载文章请注明出处，谢谢！❤️",
    "primerCSS":"<link href='https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/Primer/21.0.7/primer.css' rel='stylesheet' />",
    "needComment":1
}

```
