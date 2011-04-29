var PLUGIN_INFO =
        <KeySnailPlugin>
            <name>JsReferrence</name>
            <description>JavaScriptリファレンスを引く</description>
            <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/js-referrence.ks.js</updateURL>
            <iconURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/MyIcon.png</iconURL>
            <version>0.0.2</version>
            <minVersion>1.8.5</minVersion>
            <author mail="info@efcl.info" homepage="http://efcl.info/">azu</author>
            <license>The MIT License</license>
            <provides>
                <ext>JsReferrence-open-prompt</ext>
                <ext>JsReferrence-reIndex</ext>
            </provides>
            <detail><![CDATA[
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
またJsReferrence-open-promptには引数として、候補に表示するドメインの"配列"を指定できます。
無指定の場合は全てのサイトから検索を行います。
>|javascript|
// developer.mozilla.org だけを候補にする例
key.setGlobalKey(['C-b', 'k'], function (ev, arg) {
    ext.exec("JsReferrence-open-prompt", ["developer.mozilla.org"], ev);
}, 'JsReferrenceのプロンプトを開く', true);
// 二つのサイトを候補にする - JavaScript
key.setGlobalKey(['C-b', 'l'], function (ev, arg) {
    ext.exec("JsReferrence-open-prompt", ["developer.mozilla.org", "www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"], ev);
}, 'JsReferrenceのプロンプトを開く', true);
||<
現在対応しているサイトと追加方法は以下の参考にしてください。
https://github.com/azu/KeySnail-Plugins/tree/master/JSReference

取得候補を足すにはSITEINFO部分次のような書式でパースしてIndexを作成するものを書きます。
Pull Requestしてくれればデフォルトに取り入れるかもしれないです。
>|javascript|
crawler.domainFunc["DOMAIN_NAME_SPACE"] = {
    charset : "UTF-8",// 無指定だとUTF-8
    indexTarget : ["http://" ,"http://"],// 取得したいURLの配列
    indexer : function(doc){// documetオブジェクトが引数に渡されます
        var collection = [];// indexerで返す配列
        // パースして、候補毎にタイトルとURLの配列を作りpushします。
            collection.push([title ,url]);
        // 候補もまた配列なので次のような感じで配列内に配列を並べたものを返す
        // [[title ,url],[title ,url]...]
        return collection;
    }
}
更新履歴はGithubのReadme.mdに書いてあります。
https://github.com/azu/KeySnail-Plugins/tree/master/JSReference
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
    var getIndex = function(domains) {
        if (!domains) {// 指定なしならreturn ALL
            return indexArray;
        }
        var selectedIndex = {};
        for (var i = 0,len = domains.length; i < len; i++) {
            var domain = domains[i];
            if (indexArray[domain]) {
                selectedIndex[domain] = indexArray[domain];
            }
        }
        return selectedIndex;
    }
    var clearIndex = function() {

    }
    var saveIndexFile = function() {
        persist.preserve(indexArray, saveKey);
        display.showPopup(saveKey, M({
            ja:"Indexの構築が完了しました",
            en:"Finish index"
        }))
    }
    var startIndex = function(domains) {
        domains = domains || _.keys(crawler.domainFunc);// ["com.exsample" ,"jp.hoge"]
        if (!domains) {
            util.message(L("Index構築のドメインが指定されていない"));
            return;
        }
        display.showPopup(saveKey, M({
            ja: domains.length + "個のIndexを構築します",
            en:"Start building " + domains.length + " index."
        }));
        reIndex(domains);
    }
    var reIndex = function(domains) {
        var cd = crawler.domainFunc;
        domainIndexer(domains.pop());
        function domainIndexer(domain) {
            var domainIndex = cd[domain].indexTarget;// URLの配列
            var target = getDomainObj(domain);
            // ドメイン内のindexTargetが無くなるまで再帰的に取得する
            req(target, function(res) {
                saveContentIndex(domain, res);
            }, function next() {
                if (domainIndex.length > 0) { // 次のtarget pageへ
                    var target = getDomainObj(domain);
                    req(target, function(res) {
                        saveContentIndex(domain, res);
                    }, next);
                } else {
                    if (domains.length > 0) {// 次のドメインへ
                        var nextDomain = domains.pop();
                        domainIndexer(nextDomain);
                    } else {// 取得対象がなくなったのでファイルに保存
                        saveIndexFile();
                    }
                }
            });
            function getDomainObj(domain) {
                return {
                    "url" : domainIndex.pop(),
                    "charset": cd[domain].charset
                }
            }

            // indexerを呼び出して取得結果をpushする
            function saveContentIndex(domain, doc) {
                var collection = cd[domain].indexer(doc);
                crawler.pushIndex(domain, collection);
            }

        }
    }
    return {
        "getIndex" : getIndex,
        "domainFunc": domainFunc,
        "pushIndex" : pushIndex,
        "startIndex" : startIndex
    };
})();
/*
 * SITE INFO
 */
// Under Translation of ECMA-262 3rd Edition
crawler.domainFunc["www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"] = {
    charset : "Shift-jis",
    indexTarget : [
        "http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html"
    ],
    indexer : function (doc) {
        var anchors = $X("//dt/a", doc);
        // http://d.hatena.ne.jp/brazil/20080416/1208325257
        var IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        var uri = IOService.newURI("http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html", null, null).QueryInterface(Ci.nsIURL);
        var collection = [];
        for (var i = 0, len = anchors.length; i < len; i++) {
            var a = anchors[i];
            var title = a.textContent.replace(/^[\d\s.]*/, "");
            var url = uri.resolve(a.getAttribute("href"));
            collection.push([title ,url]);
        }
        return collection;
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
            var title = a.textContent;
            var url = a.href;
            collection.push([title ,url]);
        }
        return collection;
    }
};
// jQuery API document
crawler.domainFunc["api.jquery.com"] = {
    indexTarget : [
        "http://api.jquery.com/"
    ],
    indexer : function (doc) {
        var anchors = $X('id("method-list")//a[@rel="bookmark"]', doc)
        var collection = [];
        for (var i = 0, len = anchors.length; i < len; i++) {
            var a = anchors[i];
            var title = a.textContent;
            var url = a.href;
            collection.push([title ,url]);
        }
        return collection;
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
    xhr.overrideMimeType("text/html; charset=" + (target.charset || "utf-8"));
    xhr.send(null);
}
/**
 * プロンプトを開き、リファレンスの検索を開始する
 * @param domains ドメインの配列を指定する事ができる
 */
function openPrompt(domains) {
    // 指定したDomainだけのIndexを取り出す || 無指定ならALL
    var indexPages = crawler.getIndex(domains || null);
    if (_.isEmpty(indexPages)) {
        display.showPopup(saveKey, M({
            ja:"Indexがないので構築します…しばしお待ち",
            en:"No Index,start building index."
        }));
        crawler.startIndex();
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
        function(aEvent, aArg) {
            crawler.startIndex(aArg || null);
        },
        M({ja: saveKey + "のインデックスを作り直す",
            en: "reindex of" + saveKey}));
ext.add(saveKey + "-open-prompt",
        function(aEvent, aArg) {
            openPrompt(aArg || null);
        },
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