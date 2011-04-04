var PLUGIN_INFO =
        <KeySnailPlugin>
            <name>JsReferrence</name>
            <description>JavaScriptリファレンスを引く</description>
            <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/js-referrence.ks.js</updateURL>
            <iconURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/MyIcon.png</iconURL>
            <version>0.0.1</version>
            <minVersion>1.8.5</minVersion>
            <author mail="info@efcl.info" homepage="http://efcl.info/">azu</author>
            <license>The MIT License</license>
            <provides>
                <ext>JsReferrence-open-prompt</ext>
                <ext>JsReferrence-reIndex</ext>
            </provides>
            <detail><![CDATA[]]></detail>
            <detail lang="ja"><![CDATA[
            === 使い方 ===
このプラグインをインストールすることにより
- JsReferrence-open-prompt
- JsReferrence-reIndex
というコマンドがエクステに追加されます。
初回にJsReferrence-open-promptを実行するIndexを構築します。
手動でIndexを作り直したい時はJsReferrence-reIndexコマンドを使って下さい。
>|javascript|
key.setGlobalKey(['C-b', 'j'], function (ev, arg) {
    ext.exec("JsReferrence-open-prompt", arg, ev);
}, 'JsReferrenceのプロンプトを開く', true);
key.setGlobalKey(['C-b', 'r'], function (ev, arg) {
    ext.exec("JsReferrence-reIndex", arg, ev);
}, 'JsReferrenceののインデックスを作り直す', true);
||<
]]></detail>
        </KeySnailPlugin>;

var saveKey = PLUGIN_INFO.name.toString().replace(/\s/g, "_");
var crawler = crawler || {};
crawler = (function() {
    var domainFunc = {},// ドメイン毎のindexer
            indexArray = persist.restore(saveKey) || {};

    var pushIndex = function(domain, collection) {
        indexArray[domain] = collection;
    }
    var getIndex = function(domain) {
        return indexArray;
    }
    var saveIndex = function() {
        persist.preserve(indexArray, saveKey);
        display.showPopup(saveKey, M({
            ja:"Indexの構築が完了しました",
            en:"Finish index"
        }))
    }
    var reIndex = function() {
        var domains = _.keys(crawler.domainFunc);
        var cd = crawler.domainFunc;
        domainIndexer(domains.pop());
        function domainIndexer(domain) {
            var domainIndex = cd[domain].indexTarget;// URLの配列
            var target = {
                "url" : domainIndex.pop(),
                "charset":  cd[domain].charset || "UTF-8"
            }
            req(target, cd[domain].indexer, function next() {
                if (domainIndex.length > 0) { // 次のtarget pageへ
                    var target = {
                        "url":domainIndex.pop(),
                        "charset":  cd[domain].charset || "UTF-8"
                    };
                    req(target, cd[domain].indexer, next);
                } else {// 次のドメインへ
                    if (domains.length > 0) {
                        var nextDomain = domains.pop();
                        domainIndexer(nextDomain);
                    } else {
                        saveIndex();
                    }
                }
            });
        }
    }
    return {
        "getIndex" : getIndex,
        "domainFunc": domainFunc,
        "pushIndex" : pushIndex,
        "reIndex" : reIndex
    };
})();
// Under Translation of ECMA-262 3rd Edition
crawler.domainFunc["www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"] = {
    charset : "Shift-jis",
    indexTarget : [
        "http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html"
    ],
    indexer : function (doc) {
        var anchors = $X("//dt/a", doc);
        var index = new Array(anchors.length);
        // http://d.hatena.ne.jp/brazil/20080416/1208325257
        var IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        var uri = IOService.newURI("http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html", null, null).QueryInterface(Ci.nsIURL);
        var collection = [];
        for (var i = 0, len = index.length; i < len; i++) {
            var a = anchors[i];
            var name = a.textContent.replace(/^[\d\s.]*/, "");
            var url = uri.resolve(a.getAttribute("href"));
            collection.push([name ,url]);
        }
        crawler.pushIndex("www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/", collection);
        return null;
    }
};
// MDC
crawler.domainFunc["developer.mozilla.org"] = {
    indexTarget : [
        'https://developer.mozilla.org/Special:Sitemap'//?language=ja
    ],
    indexer : function (doc) {
        var anchors = doc.querySelectorAll('a[pageid][rel="internal"]');
        var collection = [];
        for (var i = 0, len = anchors.length; i < len; i++) {
            var a = anchors[i];
            var name = a.textContent;
            var url = a.href;
            collection.push([name ,url]);
        }
        crawler.pushIndex("developer.mozilla.org", collection);
        return this;
    }
};

function req(target, callback, next) {
    // util.message(L("通信開始"));
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        callback(createHTMLDocument_XSLT(xhr.responseText));
        next();
    }
    xhr.open("get", target.url, true);
    xhr.overrideMimeType("text/html; charset=" + target.charset);
    xhr.send(null);
}
function openPrompt() {
    var indexPages = crawler.getIndex();
    if (_.isEmpty(indexPages)) {
        display.showPopup(saveKey, M({
            ja:"Indexがないので構築します…しばしお待ち",
            en:"No Index,start building index."
        }));
        crawler.reIndex();
        return;
    }
    var collection = [];
    for (var i in indexPages) {
        collection = collection.concat(indexPages[i]);
    }
    prompt.selector({
        message    : "pattern:",
        collection : collection,
        flags      : [0 , 0],
        style      : [null, style.prompt.description],
        header     : ["Title", "URL"],
        width      : [25, 45],
        actions    : [
            [function (aIndex) {
                if (aIndex >= 0) {
                    openUILinkIn(getURL(aIndex), "current");
                }
            },M({
                ja: '現在タブで開く',
                en: "Open current tab"
            }),"open-current-tab"],
            [function (aIndex) {
                if (aIndex >= 0) {
                    openUILinkIn(getURL(aIndex), "tab");
                }
            }, "Open Link in new tab (foreground)"],
            [function (aIndex) {
                if (aIndex >= 0) {
                    openUILinkIn(getURL(aIndex), "tabshifted");
                }
            }, "Open Link in new tab (background)"],
            [function (aIndex) {
                if (aIndex >= 0) {
                    openUILinkIn(getURL(aIndex), "window");
                }
            }, "Open Link in new window"],
            [function (aIndex) {
                if (aIndex >= 0) {
                    openUILinkIn(getURL(aIndex), "current");
                }
            }, "Open Link in current tab"],
        ]
    });
    function getURL(index) {
        return collection[index][1];
    }
}
// コマンド追加
ext.add(saveKey + "-reIndex",
        crawler.reIndex,
        M({ja: saveKey + "のインデックスを作り直す",
            en: "reindex of" + saveKey}));
ext.add(saveKey + "-open-prompt",
        openPrompt,
        M({ja: saveKey + "で検索を開始する",
            en: "open prompt of" + saveKey}));

// $X on XHTML
// @target Freifox3, Chrome3, Safari4, Opera10
// @source http://gist.github.com/184276.txt
function $X(exp, context) {
    context || (context = document);
    var _document = context.ownerDocument || context,
            documentElement = _document.documentElement,
            isXHTML = documentElement.tagName !== 'HTML' && _document.createElement('p').tagName === 'p',
            defaultPrefix = null;
    if (isXHTML) {
        defaultPrefix = '__default__';
        exp = addDefaultPrefix(exp, defaultPrefix);
    }
    function resolver(prefix) {
        return context.lookupNamespaceURI(prefix === defaultPrefix ? null : prefix) ||
                documentElement.namespaceURI || "";
    }

    var result = _document.evaluate(exp, context, resolver, XPathResult.ANY_TYPE, null);
    switch (result.resultType) {
        case XPathResult.STRING_TYPE : return result.stringValue;
        case XPathResult.NUMBER_TYPE : return result.numberValue;
        case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            // not ensure the order.
            var ret = [], i = null;
            while (i = result.iterateNext()) ret.push(i);
            return ret;
    }
}

function createHTMLDocument_XSLT(source) {
    var processor = new XSLTProcessor();
    var sheet = new DOMParser().parseFromString(
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">' +
                    '<xsl:output method="html"/>' +
                    '<xsl:template match="/">' +
                    '<html><head><title></title></head><body></body></html>' +
                    '</xsl:template>' +
                    '</xsl:stylesheet>',
            'application/xml'
            );
    processor.importStylesheet(sheet);
    var doc = processor.transformToDocument(sheet);
    var range = doc.createRange();
    range.selectNodeContents(doc.documentElement);
    range.deleteContents();
    doc.documentElement.appendChild(range.createContextualFragment(source));
    return doc;
}