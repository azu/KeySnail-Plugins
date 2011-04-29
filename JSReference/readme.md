
##対応サイト

- [developer.mozilla.org]
- [www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/]
- [api.jquery.com]

[developer.mozilla.org]: http://developer.mozilla.org "Mozilla Developer Network"
[www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/]: http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/ "Under Translation of ECMA-262 3rd Edition"
[api.jquery.com]: http://api.jquery.com "jQuery API Document"

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