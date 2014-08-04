let PLUGIN_INFO = <KeySnailPlugin>
    <name>displayLastModified</name>
    <description>ページの最終更新日を表示する</description>
    <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/displayLastModified/displayLastModified.ks.js</updateURL>
    <iconURL>https://github.com/azu/KeySnail-Plugins/raw/master/displayLastModified/MyIcon.png</iconURL>
    <version>0.0.3</version>
    <minVersion>1.8.5</minVersion>
    <author mail="info@efcl.info" homepage="http://efcl.info/">azu</author>
    <license>The MIT License</license>
    <provides>
        <ext>displayLastModified-URL</ext>
    </provides>
    <detail><![CDATA[]]></detail>
    <detail lang="ja"><![CDATA[
            === 使い方 ===
このプラグインをインストールすることにより
- displayLastModified-URL
というコマンドがエクステに追加されます。
このコマンドを実行すると現在のタブのページにそのページの最終更新日を表示する事ができます。
より正確な最終更新日を見るため、document.lastModifiedではなく、Google検索からデータを取得します。
そのため、サイトによっては取得できない場合があります。
このコマンドは引数としてURLを渡す事ができますが、引数がない場合は現在のタブのURLが使われます。
以下のようにviewのみに割り当てるのがいいかもしれません。
>|javascript|
key.setViewKey(['C-b', 'l'], function (ev, arg) {
    ext.exec('displayLastModified-URL', arg, ev);
}, 'ページの最終更新日を表示', true);
// 指定URLの最終更新日を表示するには以下のように引数で渡す
ext.exec('displayLastModified-URL', "http://efcl.info/");
||<
       ]]></detail>
</KeySnailPlugin>;
function displayLastModifiedURL() {
    var requestURL = arguments[1] || window.content.location.href;
    var request = {
        url: "http://www.google.com/search?num=1&tbs=qdr%3Ay15&q=site%3A" + encodeURIComponent(requestURL),
        onload: function (doc) {
            var dayText = getLastModified(doc);
            if (!dayText) {
                display.prettyPrint(L("×"), { timeout: 500, fade: 500 })
            } else {
                display.prettyPrint(dayText, { timeout: 3000, fade: 300 });// 日付を表示
            }
        }
    }

    function getLastModified(doc) {
        var siteList = $X('//div[@class="s"]', doc);
        for (var i = 0, len = siteList.length; i < len; i++) {
            var site = siteList[i];
            if (site && !_.isElement(site)) {
                return window.content.document.lastModified;
            }
            var lastModifyElement = $X('.//span[@class="f"]', site);
            if (lastModifyElement && _.isElement(lastModifyElement[0])) {
                return lastModifyElement[0].textContent;
            }
        }

    }

    req(request);
}
ext.add("displayLastModified-URL",
    displayLastModifiedURL,
    M({ja: "ページの最終更新日を表示",
        en: "display page's last modified"}));
function log() {
    var DEBUG = false;
    if (DEBUG) {
        console.log(arguments);
    }
}
function req(target) {
    // util.message(L("通信開始"));
    if (!target.url) {
        throw "target.urlがありません";
    }
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        target.onload && target.onload(createHTMLDocument_XSLT(xhr.responseText));
        target.next && target.next();
    }
    xhr.open("get", target.url, true);
    xhr.overrideMimeType("text/html; charset=" + (target.charset || "utf-8"));
    xhr.send(null);
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
        case XPathResult.STRING_TYPE :
            return result.stringValue;
        case XPathResult.NUMBER_TYPE :
            return result.numberValue;
        case XPathResult.BOOLEAN_TYPE:
            return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            // not ensure the order.
            var ret = [], i = null;
            while (i = result.iterateNext()) {
                ret.push(i);
            }
            return ret;
    }
}
