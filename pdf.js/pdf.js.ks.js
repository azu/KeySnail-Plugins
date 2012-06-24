var PLUGIN_INFO = <KeySnailPlugin>
    <name>pdf.js</name>
    <description>pdf.js</description>
    <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/pdf.js/pdf.js.ks.js</updateURL>
    <version>0.0.1</version>
    <minVersion>1.8.5</minVersion>
    <author mail="info@efcl.info" homepage="http://efcl.info/">azu</author>
    <license>The MIT License</license>
    <provides>
        <ext>pdfjs-scroll-document-down</ext>
        <ext>pdfjs-scroll-document-up</ext>
        <ext>pdfjs-display-toc</ext>
    </provides>
    <detail><![CDATA[

サイトローカル・キーマップ から呼び出して使うのを推奨

>|javascript|
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
||<
    ]]></detail>
</KeySnailPlugin>;

function findScrollableWindow(){
    let win;
    try{
        win = window.document.commandDispatcher.focusedWindow;
        if (win && (win.scrollMaxX > 0 || win.scrollMaxY > 0))
            return win;

        win = window.content;
        if (win.scrollMaxX > 0 || win.scrollMaxY > 0)
            return win;

        for (let frame in win.frames)
            if (frame.scrollMaxX > 0 || frame.scrollMaxY > 0)
                return frame;
    }
    catch (x){
        win = window.content;
    }

    return win;
}

var pdfjsUtil = {
    scrollByScrollSize : function(arg, direction){
        direction = direction ? 1 : -1;
        arg = arg || 1;
        var win = findScrollableWindow();
        var scrollContent = win.document.querySelector('#viewerContainer');
        scrollContent.scrollTop += (win.innerHeight / 2 * direction) * arg;
    },
    getTocCollection : function(){
        var win = findScrollableWindow();
        // 全て取得済み
        var outline = Array.slice(win.document.querySelectorAll('#outlineView .outlineItem > a'));
        if (!_.isArray(outline)){
            fbug(outline);
            return;
        }
        var pageReg = /#page=(\d+)\&/;
        var collection = outline.map(function(val, index, array){
            var page = val.href.match(pageReg);
            page = page && page[1];
            return [page || index, val.textContent];
        });
        return collection;
    },
    displayToc : function(){
        var collection = pdfjsUtil.getTocCollection();
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
                "No", "title"
            ],
            width : [
                5, 95
            ],
            actions : [
                [
                    function(aIndex){
                        if (aIndex >= 0){
                            var page = collection[aIndex][0];
                            content.window.wrappedJSObject.PDFView.page = page;
                        }
                    }, "move to page"
                ]
            ]
        });
    }
};

plugins.pdfjsUtil = pdfjsUtil;
ext.add("pdfjs-scroll-document-down", function(ev, arg){
    pdfjsUtil.scrollByScrollSize(arg, true);
}, M({en : "Scroll document down", ja : "半画面スクロールダウン"}));
ext.add("pdfjs-scroll-document-up", function(ev, arg){
    pdfjsUtil.scrollByScrollSize(arg, false);
}, M({en : "Scroll document up", ja : "半画面スクロールアップ"}));
ext.add("pdfjs-display-toc", function(ev, arg){
    pdfjsUtil.displayToc(arg, false);
}, M({en : "display outline", ja : "アウトライン表示"}));