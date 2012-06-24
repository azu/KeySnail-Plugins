## 概要

pdf.jsでスクロールしたり、目次をプロンプトに表示するAPIを定義したプラグイン

[サイトローカル・キーマップ](http://d.hatena.ne.jp/mooz/20091101/p1 "サイトローカル・キーマップ") と
一緒に使って、pdf上で動くように定義して使う。

とりあえず、欲しかったものしか入れてないので必要な機能はpullreq。

## 使い方

指定例

    local["\.pdf$"] = [
        ["t",function(evt,arg){
            ext.exec("pdfjs-display-toc", arg, evt);
        }],
        ['SPC',function(evt){
            ext.exec("pdfjs-scroll-document-down", 0.3, evt);
        }],
        ['S-SPC',function(evt){
            ext.exec("pdfjs-scroll-document-up", 0.3, evt);
        }]
    ]

## 参考

* [Vimperator で PDF を読もう! - Death to false Web browser! - vimperatorグループ](http://vimperator.g.hatena.ne.jp/nokturnalmortum/20120610/1339333950 "Vimperator で PDF を読もう! - Death to false Web browser! - vimperatorグループ")