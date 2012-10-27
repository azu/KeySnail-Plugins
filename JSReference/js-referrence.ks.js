var PLUGIN_INFO =
        <KeySnailPlugin>
            <name>JsReferrence</name>
            <description>JavaScriptリファレンスを引く</description>
            <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/js-referrence.ks.js</updateURL>
            <iconURL>https://github.com/azu/KeySnail-Plugins/raw/master/JSReference/MyIcon.png</iconURL>
            <version>0.0.7</version>
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
またこれらのコマンドは、引数として対象ドメインの"配列"を指定できます。
無指定の場合は全てのサイトから検索やインデックスの再構築を行います。
>|javascript|
// developer.mozilla.org だけを候補にする例
key.setGlobalKey(['C-b', 'k'], function (ev, arg) {
    ext.exec("JsReferrence-open-prompt", ["developer.mozilla.org"], ev);
}, 'JsReferrenceのプロンプトを開く', true);
// 二つのサイトを候補にする - JavaScript
key.setGlobalKey(['C-b', 'l'], function (ev, arg) {
    ext.exec("JsReferrence-open-prompt", ["developer.mozilla.org", "www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"], ev);
}, 'JsReferrenceのプロンプトを開く', true);
// インデックスの構築もドメイン指定できる
key.setGlobalKey(['C-b', 'r'], function (ev, arg) {
    ext.exec("JsReferrence-reIndex", ["msdn.microsoft.com"], ev);
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
||<

更新履歴はGithubのReadme.mdに書いてあります。
https://github.com/azu/KeySnail-Plugins/tree/master/JSReference

]]></detail>
        </KeySnailPlugin>;

var saveKey = "JsReferrence";
var crawler = crawler || {};
crawler = (function(){
    var domainFunc = {}, // ドメイン毎のindexer
            indexArray = persist.restore(saveKey) || {};

    function uniqAry(ary, prop){
        prop = prop || 0;
        var checkAry = [];// 重複チェック用
        return _.reduce(ary, function(memo, el, i){
            if (0 == i || checkAry.indexOf(el[prop]) === -1){
                // memoにまだ無い要素だったらpushする
                memo[memo.length] = el;
                checkAry.push(el[prop])
            }
            return memo;
        }, []);// memoの初期値
    }

    var pushIndex = function(domain, collection){
        if (!indexArray[domain]){
            indexArray[domain] = [];
        }
        // 結合して[0,1]重複チェックする
        indexArray[domain] = uniqAry(indexArray[domain].concat(collection), 1);
        return indexArray[domain];
    }
    var getIndex = function(domains){
        if (!domains){// 指定なしならreturn ALL
            return indexArray;
        }
        var selectedIndex = {};
        for (var i = 0, len = domains.length; i < len; i++){
            var domain = domains[i];
            if (indexArray[domain]){
                selectedIndex[domain] = indexArray[domain];
            }
        }
        return selectedIndex;
    }
    var clearIndex = function(){
        indexArray = {};
    }
    var saveIndexFile = function(){
        persist.preserve(indexArray, saveKey);
        display.showPopup(saveKey, M({
            ja : "インデックスの構築が完了しました",
            en : "Finish index"
        }));
    }
    var startIndex = function(domains){
        clearIndex();
        domains = domains || _.keys(crawler.domainFunc);// ["com.exsample" ,"jp.hoge"]
        if (!domains){
            util.message(L("インデックス構築のドメインが指定されていない"));
            return;
        }else if (!_.isArray(domains)){
            util.message(L("ドメインは配列でして下さい"));
            return;
        }
        display.showPopup(saveKey, M({
            ja : domains.length + "個のインデックスを構築します",
            en : "Start building " + domains.length + " index."
        }));
        reIndex(domains);
    }
    var reIndex = function(domains){
        var cd = crawler.domainFunc;
        domainIndexer(domains.pop());
        function domainIndexer(domain){
            var indexCount = 0
            display.echoStatusBar(M({
                ja : domain + "のIndexを構築開始します",
                en : "Start building " + domain + "'s index."
            }), 3000);
            var domainIndex = cd[domain].indexTarget;// URLの配列
            var target = getDomainObj(domain);
            // ドメイン内のindexTargetが無くなるまで再帰的に取得する
            req(target, function(res){
                saveContentIndex(domain, res);
            }, function next(){
                if (domainIndex.length > 0){ // 次のtarget pageへ
                    var target = getDomainObj(domain);
                    setTimeout(function(){
                        req(target, function(res){
                            saveContentIndex(domain, res);
                        }, next);
                    }.bind(this), 500);
                }else{
                    if (domains.length > 0){// 次のドメインへ
                        var nextDomain = domains.pop();
                        domainIndexer(nextDomain);
                    }else{// 取得対象がなくなったのでファイルに保存
                        saveIndexFile();
                    }
                }
            });
            function getDomainObj(domain){
                return {
                    "url" : domainIndex.pop(),
                    "charset" : cd[domain].charset
                }
            }

            // indexerを呼び出して取得結果をpushする
            function saveContentIndex(domain, doc){
                try{
                    // this は cd[domain] にする
                    var collection = cd[domain].indexer.call(cd[domain], doc);
                    if (collection){
                        crawler.pushIndex(domain, collection);
                        display.echoStatusBar(M({
                            ja : domain + "のIndexを構築中... " + (indexCount++)
                        }), 3000);
                    }
                }catch (e){
                    util.message(L(e + "\n"
                            + domain + "のindexerでエラー"));
                }
            }

        }
    }
    return {
        "getIndex" : getIndex,
        "domainFunc" : domainFunc,
        "pushIndex" : pushIndex,
        "startIndex" : startIndex
    };
})();
/*
 * SITE INFO
 */
(function(){

    // Under Translation of ECMA-262 3rd Edition
    crawler.domainFunc["www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"] = {
        charset : "Shift-jis",
        indexTarget : [
            "http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html"
        ],
        indexer : function(doc){
            var anchors = $X("//dt/a", doc);
            var uri = resolveURI("http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/fulltoc.html");
            var collection = [
            ];
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent.replace(/^[\d\s.]*/, "");
                var url = uri.resolve(a.getAttribute("href"));
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };

    // Mozilla Developer Network
    crawler.domainFunc["developer.mozilla.org"] = {
        indexTarget : [
            'https://developer.mozilla.org/en-US/docs/all'
        ],
        indexer : (function(){
            var uri = resolveURI("https://developer.mozilla.org/");
            return function(doc){
                // next linkを辿ってクロールする
                var nextLink = doc.querySelector('#document-list .next > a');
                if (nextLink){
                    this.indexTarget.push(nextLink.href);
                }
                var anchors = doc.querySelectorAll('#document-list .documents li > a');
                var collection = [];
                for (var i = 0, len = anchors.length; i < len; i++){
                    var a = anchors[i];
                    var title = a.textContent;
                    var url = uri.resolve(a.getAttribute("href"));
                    collection.push([
                        title , url
                    ]);
                }
                return collection;
            }
        })()
    };
    // Mozilla Developer Network 日本語
    crawler.domainFunc["jp.developer.mozilla.org"] = {
        indexTarget : [
            'https://developer.mozilla.org/ja-JP/docs/all'
        ],
        indexer : crawler.domainFunc["developer.mozilla.org"].indexer
    };
    // jQuery API document
    crawler.domainFunc["api.jquery.com"] = {
        indexTarget : [
            "http://api.jquery.com/"
        ],
        indexer : function(doc){
            var anchors = $X('id("method-list")//a[@rel="bookmark"]', doc)
            var collection = [
            ];
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent;
                var url = a.href;
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };
    // jQuery unofficial API document(ja)
    crawler.domainFunc["js.studio-kingdom.com/jquery"] = {
        indexTarget : [
            "http://js.studio-kingdom.com/jquery/"
        ],
        indexer : function(doc){
            var anchors = doc.querySelectorAll(".nav-list li > a");
            var collection = [];
            var uri = resolveURI("http://js.studio-kingdom.com/");
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent;
                var url = uri.resolve(a.getAttribute("href"));
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };
    // Annotated ECMAScript 5.1
    crawler.domainFunc["es5.github.com"] = {
        indexTarget : [
            "http://es5.github.com/"
        ],
        indexer : function(doc){
            var anchors = doc.querySelectorAll('#toc-full a');
            var collection = [];
            var uri = resolveURI("http://es5.github.com/");
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent;
                var url = uri.resolve(a.getAttribute("href"));
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };

    // msdn.microsoft.com JavaScript Language Reference
    crawler.domainFunc["msdn.microsoft.com"] = {
        // Util : https://gist.github.com/1008796
        indexTarget : [
            // http://msdn.microsoft.com/en-us/library/yek4tbz0%28v=VS.94%29.aspx
            "http://msdn.microsoft.com/en-us/library/s4esdbwz(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/ff818462(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/xyad316h(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/6fw3zxcx(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/c6hac83s(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/ce57k8d5(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/3xcfcb93(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/7th8s2xk(v=VS.94).aspx",
            // Object
            "http://msdn.microsoft.com/en-us/library/htbw4ywd(v=VS.94).aspx",
            // http://msdn.microsoft.com/en-us/library/htbw4ywd%28v=VS.94%29.aspx 以下
            "http://msdn.microsoft.com/en-us/library/7sw4ddf8(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/k4h76zbx(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/87dw3w1k(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/t7bkhaz6(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/cd9w2te4(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/bs12a9wf(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/6ch9zb09(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/dww52sbt(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/x844tc74(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/52f50e9t(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/cc836458(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/b272f386(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/dwab3ed2(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/kb6te8d3(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/9dthzd08(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/h6e2eb7w(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/ecczf11c(v=VS.94).aspx",
            "http://msdn.microsoft.com/en-us/library/y39d47w8(v=VS.94).aspx",
        ],
        indexer : function(doc){
            var anchors = doc.querySelectorAll('#Navigation .children > div > a');
            var subject = doc.querySelector('#Navigation div.toclevel1.current > a').title;
            subject = subject.replace(" (JavaScript)", "");
            if (_.isEmpty(anchors) || !subject){
                return;
            }
            var collection = [];

            var uri = resolveURI("http://msdn.microsoft.com/");
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.title.replace(" (JavaScript)", "");
                var url = uri.resolve(a.getAttribute("href"));
                collection.push([
                    subject + " / " + title , url
                ]);
            }
            return collection;
        }
    };
    //  sitepoint CSS reference
    crawler.domainFunc["reference.sitepoint.com/css"] = {
        indexTarget : [
            "http://reference.sitepoint.com/css/demos"
        ],
        indexer : function(doc){
            var anchors = doc.querySelectorAll("#contentpanelcontent a");
            var collection = [];
            var uri = resolveURI("http://reference.sitepoint.com/");
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent;
                var url = uri.resolve(a.getAttribute("href"));
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };

    // Apple iOS Document
    crawler.domainFunc["developer.apple.com/library/ios"] = {
        category : "iOS",
        indexTarget : [
            "http://developer.apple.com/library/ios/sitemap.php"
        ],
        indexer : function(doc){
            var anchors = doc.getElementsByTagName("a");
            var collection = [];
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var link = a.getAttribute("href");
                var linkSplit = link.split("/");
                var title = linkSplit[linkSplit.length - 2].replace("_", " ");
                var url = a.getAttribute("href");
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };
    // 福井高専IT研究会Wiki iOSフレームワーク
    // http://profo.jp/wiki/index.php?%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%83%AA%E3%83%95%E3%82%A1%E3%83%AC%E3%83%B3%E3%82%B9
    crawler.domainFunc["profo.jp/wiki"] = {
        category : "iOS",
        indexTarget : [
            "http://profo.jp/wiki/index.php?cmd=list"
        ],
        indexer : function(doc){
            var anchors = doc.querySelectorAll("#body a:not([id])");
            var collection = [];
            for (var i = 0, len = anchors.length; i < len; i++){
                var a = anchors[i];
                var title = a.textContent;
                var url = a.getAttribute("href");
                collection.push([
                    title , url
                ]);
            }
            return collection;
        }
    };
})();

function req(target, callback, next){
    // util.message(L("通信開始"));
    var xhr = new XMLHttpRequest();
    xhr.onload = function(){
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
function openPrompt(domains){
    // 指定したDomainだけのIndexを取り出す || 無指定ならALL
    var indexPages = crawler.getIndex(domains || null);
    if (_.isEmpty(indexPages)){
        display.showPopup(saveKey, M({
            ja : "インデックスがないので構築します…しばしお待ち",
            en : "No Index,start building index."
        }));
        crawler.startIndex();
        return;
    }
    var collection = [
    ];
    for (var i in indexPages){
        collection = collection.concat(indexPages[i]);
    }
    prompt.selector({
        message : "pattern:",
        collection : collection,
        flags : [
            0 , 0
        ],
        style : [
            null, style.prompt.description
        ],
        header : [
            "Title", "URL"
        ],
        width : [
            25, 45
        ],
        actions : [
            [
                function(aIndex){
                    if (aIndex >= 0){
                        openUILinkIn(getURL(aIndex), "current");
                    }
                }, "Open Link in current tab"
            ],
            [
                function(aIndex){
                    if (aIndex >= 0){
                        openUILinkIn(getURL(aIndex), "tab");
                    }
                }, "Open Link in new tab (foreground)"
            ],
            [
                function(aIndex){
                    if (aIndex >= 0){
                        openUILinkIn(getURL(aIndex), "tabshifted");
                    }
                }, "Open Link in new tab (background)"
            ],
            [
                function(aIndex){
                    if (aIndex >= 0){
                        openUILinkIn(getURL(aIndex), "window");
                    }
                }, "Open Link in new window"
            ],
            [
                function(aIndex){
                    if (aIndex >= 0){
                        openUILinkIn(getURL(aIndex), "current");
                    }
                }, "Open Link in current tab"
            ],
        ]
    });
    function getURL(index){
        return collection[index][1];
    }
}
// コマンド追加
ext.add(saveKey + "-reIndex",
        function(aEvent, aArg){
            crawler.startIndex(aArg || null);
        },
        M({ja : saveKey + "のインデックスを作り直す",
            en : "reindex of" + saveKey}));
ext.add(saveKey + "-open-prompt",
        function(aEvent, aArg){
            openPrompt(aArg || null);
        },
        M({ja : saveKey + "で検索を開始する",
            en : "open prompt of" + saveKey}));

// $X on XHTML
// @target Freifox3, Chrome3, Safari4, Opera10
// @source http://gist.github.com/184276.txt
function $X(exp, context){
    context || (context = document);
    var _document = context.ownerDocument || context,
            documentElement = _document.documentElement,
            isXHTML = documentElement.tagName !== 'HTML' && _document.createElement('p').tagName === 'p',
            defaultPrefix = null;
    if (isXHTML){
        defaultPrefix = '__default__';
        exp = addDefaultPrefix(exp, defaultPrefix);
    }
    function resolver(prefix){
        return context.lookupNamespaceURI(prefix === defaultPrefix ? null : prefix) ||
                documentElement.namespaceURI || "";
    }

    var result = _document.evaluate(exp, context, resolver, XPathResult.ANY_TYPE, null);
    switch (result.resultType){
        case XPathResult.STRING_TYPE :
            return result.stringValue;
        case XPathResult.NUMBER_TYPE :
            return result.numberValue;
        case XPathResult.BOOLEAN_TYPE:
            return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            // not ensure the order.
            var ret = [
            ], i = null;
            while (i = result.iterateNext()){
                ret.push(i);
            }
            return ret;
    }
}

function createHTMLDocument_XSLT(source){
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
// nsURIを使って相対URLを絶対URLにするインターフェースを作る
// http://d.hatena.ne.jp/brazil/20080416/1208325257
function resolveURI(URI){
    var IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    return IOService.newURI(URI, null, null).QueryInterface(Ci.nsIURL);
}