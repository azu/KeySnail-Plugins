var PLUGIN_INFO = <KeySnailPlugin>
    <name>makeLinkSnail</name>
    <name lang="ja">makeLinkSnail</name>
    <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/makelink_snail/makelink_snail.ks.js</updateURL>
    <description>Copy Link as MakeLink</description>
    <version>0.1</version>
    <author mail="azuciao@gmail.com" homepage="http://efcl.info/">azu</author>
    <license>MIT</license>
    <include>main</include>
    <detail><![CDATA[
=== Usage ===

.keysnail.js

>||
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
||<



>||
key.setGlobalKey(['C-c', 't'], function (ev, arg) {
    ext.exec('makeLinkSnail', arg, ev);
}, 'makeLinkSnail', true);
||<
    ]]></detail>
</KeySnailPlugin>;

var makeLinkSnail = (function () {
    var formatCollection = plugins.options["makelink_snail"] || [];

    var Loader = Components.utils.import("resource://gre/modules/commonjs/toolkit/loader.js", {}).Loader;
    var loader = Loader.Loader({
        paths: {
            "sdk/": "resource://gre/modules/commonjs/sdk/",
            "": "globals:///"
        },
        resolve: function (id, base) {
            if (id == "chrome" || id.startsWith("@")) {
                return id;
            }
            return Loader.resolve(id, base);
        }
    });
    var module = Loader.Module("main");
    var require = Loader.Require(loader, module);

    var escapeHTMLEntity = (function () {
        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&#34;',
            "'": '&#39;'
        };
        return function (text) {
            return text.replace(/[&<>'"]/g, function (tag) {
                return tagsToReplace[tag] || tag;
            })
        };
    })();

    function copyLink(link) {
        var clipboard = require("sdk/clipboard");
        clipboard.set(link, "html");
        display.showPopup("MakeLinkSnail", link);
    }

    function copyLinkAsPlainText(link) {
        var clipboard = require("sdk/clipboard");
        clipboard.set(link, "text");
        display.showPopup("MakeLinkSnail", link);
    }

    function formatTextAndURI(parameters) {
        var format = parameters.format;
        var title = parameters.title;
        var uri = parameters.uri;
        var selectText = parameters.selectText || title;
        var link = format;
        link = link.replace("%URL%", uri, "ig");
        link = link.replace("%TITLE%", escapeHTMLEntity(title), "ig");
        link = link.replace("%TEXT%", escapeHTMLEntity(selectText).replace("\n", "", "g"), "ig");
        link = link.replace("%TEXT_BR%", escapeHTMLEntity(selectText), "ig");
        return link;
    }

    function formatSelector(next) {
        var collections = _.map(formatCollection, function (obj) {
            return [obj["title"], obj["format"]];
        });
        prompt.selector({
            message: "Format:",
            collection: collections,
            width: [20, 80],
            header: ["name", "format"],
            callback: next
        });
    }

    var makeLink = {
        copyThisPage: function () {
            formatSelector(function (index) {
                var uri = content.location.href;
                var title = content.document.title;
                var selectText = content.getSelection().toString();
                var format = formatCollection[index]["format"];
                var parameters = {format: format, title: title, uri: uri, selectText: selectText};
                if (formatCollection[index]["plain"]) {
                    copyLinkAsPlainText(formatTextAndURI(parameters));
                } else {
                    copyLink(formatTextAndURI(parameters));
                }
            });
        }
    };

    return makeLink;
})();

plugins.withProvides(function (provide) {
    provide("makeLinkSnail", function () {
        makeLinkSnail.copyThisPage();
    }, "makeLinkSnail");
}, PLUGIN_INFO);
