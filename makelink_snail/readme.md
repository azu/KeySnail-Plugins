# MakeLinkSnail

[Make Link](https://addons.mozilla.org/ja/firefox/addon/make-link/ "Make Link") のようなKeySnailプラグイン.

``.keysnail.js`` にフォーマットを記述したオブジェクトを設定する

``` js
plugins.options["makelink_snail"] = [
    {
        "title": "plain",
        "format": "%TITLE%\n%URL%"
    },
    {
        "title": "HTML",
        "format": "<a href=\"%URL%\" title=\"%TITLE\">%TEXT%</a>"
    },
    {
        "title": "引用",
        "format": "<blockquote cite=\"%url%\"\n title=\"%title%\">\n<p>%text%</p>\n<cite>\n <a href=\"%url%\">%title%</a>\n</cite>\n</blockquote>"
    },
    {
        "title": "Markdown",
        "format": "[%text%](%url% \"%text%\")"
    },
    {
        "title": "@Markdown",
        "format": "[%text%]: %url%  \"%title%\""
    },
    {
        "title": "rst",
        "format": "`%text% <%url%>`_"
    },
    {
        "title": "@rst",
        "format": ".. _`%text%`: %url%"
    }
];
```