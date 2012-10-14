##概要

JavaScriptなどのリファレンスのインデックスを構築し、高速で検索できるようにするKeySnailプラグイン。

##対応サイト

- [developer.mozilla.org]
- [jp.developer.mozilla.org]
- [www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/]
- [api.jquery.com]
- [es5.github.com]
- [msdn.microsoft.com]
- [developer.apple.com/library/ios]
- [profo.jp/wiki]
- [js.studio-kingdom.com/jquery]

[developer.mozilla.org]: http://developer.mozilla.org "Mozilla Developer Network"
[jp.developer.mozilla.org]: https://developer.mozilla.org/ja "Mozilla Developer Network日本語版"
[www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/]: http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/ "Under Translation of ECMA-262 3rd Edition"
[api.jquery.com]: http://api.jquery.com "jQuery API Document"
[js.studio-kingdom.com/jquery]: http://js.studio-kingdom.com/jquery "js STUDIO | jQuery 日本語リファレンス"
[es5.github.com]: http://es5.github.com/ "Annotated ECMAScript 5.1"
[msdn.microsoft.com]: http://msdn.microsoft.com/en-us/library/yek4tbz0%28v=VS.94%29.aspx "MSDN JavaScript Language Reference"
[developer.apple.com/library/ios]: http://developer.apple.com/library/ios/sitemap.php "Apple dcoument"
[profo.jp/wiki]: http://profo.jp/wiki/index.php?cmd=list "iOS 日本語リファレンス"

対応サイトの増やし方はjs-referrence.ks.js内のSITEINFO付近に以下のような感じで増やしていきます。

DOMAIN_NAME_SPACEはユニークなものにする必要があるので、そのサイトのドメインなどを使うのが最適でしょう

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


##更新履歴

####ver 0.0.6

対応サイトの追加

- [js.studio-kingdom.com/jquery]
- [developer.apple.com/library/ios]
- [profo.jp/wiki]


####ver 0.0.5
インデックス処理が動かないバグを修正。

[jp.developer.mozilla.org] 日本語版のMDNも追加した。
重複した感じで表示されるので、英語か日本語どちらかに絞るか、jaなどを検索ワードに入れて絞り込んで使う感じで

####ver 0.0.4
[msdn.microsoft.com] のJavaScript Language Referenceに対応
取りこぼしがあるかもしれない。

インデックス構築時のメッセージを増やした。
####ver 0.0.3
[es5.github.com] に対応

####ver 0.0.2
[api.jquery.com] に対応

JsReferrence-open-promptコマンドで任意のサイトのみを対象に検索できるようになった。

引数にドメイン名前空間の配列を渡す。

    key.setGlobalKey(['C-b', 'l'], function (ev, arg) {
        ext.exec("JsReferrence-open-prompt", ["developer.mozilla.org", "www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/"], ev);
    }, 'JsReferrenceのプロンプトを開く', true);

####ver 0.0.1

リリース