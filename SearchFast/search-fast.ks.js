/**
 * Created by azu.
 * Date: 12/02/05 16:49
 * License: MIT License
 */
var PLUGIN_INFO = <KeySnailPlugin>
    <name>SearchFast</name>
    <description>検索プラグインで検索</description>
    <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/SearchFast/search-fast.ks.js</updateURL>
    <version>0.0.1</version>
    <minVersion>1.8.5</minVersion>
    <author mail="info@efcl.info" homepage="http://efcl.info/">azu</author>
    <license>The MIT License</license>
    <provides>
        <ext>search-fast</ext>
    </provides>
    <detail><![CDATA[
=== 使い方 ===

Original script
- search-with-google-suggest.js
- https://gist.github.com/285701

]]></detail>
</KeySnailPlugin>;


ext.add("search-fast",
        searchFast,
        M({ja:"検索エンジン選んで検索",
            en:"Search Search Engine"}));
function searchFast(aEvent, aArg) {
    let engines = util.suggest.getEngines();

    // If you want to use all available suggest engines,
    // change suggestEngines value to util.suggest.filterEngines(engines);

    let suggestEngines = [util.suggest.ss.getEngineByName("Google")];
    let collection = engines.map(
            function (engine) [(engine.iconURI || {spec:""}).spec, engine.name, engine.description]
    );
    let selectedString = getSelection(aEvent);
    prompt.selector({
        message:"engine:",
        collection:collection,
        flags:[ICON | IGNORE, 0, 0],
        header:["Name", "Description"],
        keymap:{
            "s":"prompt-decide",
            "j":"prompt-next-completion",
            "k":"prompt-previous-completion"
        },
        callback:function (i) {
            if (i >= 0) {
                searchWithSuggest(engines[i], suggestEngines, "tab");
            }
            function searchWithSuggest(aSearchEngine, aSuggestEngines, aOpenStyle) {
                prompt.reader(
                        {
                            initialInput:selectedString,
                            cursorEnd:true,
                            message:util.format("Search [%s]:", aSearchEngine.name),
                            group:"web-search",
                            flags:[0, 0],
                            style:["", style.prompt.url],
                            completer:completer.fetch.suggest(aSuggestEngines, true),
                            callback:function (query) {
                                if (query) {
                                    let uri = aSearchEngine.getSubmission(query, null).uri.spec;
                                    openUILinkIn(uri, aOpenStyle || "tab");
                                }
                            }
                        }
                );
            }
        }
    });
}

function getSelection(evt) {
    var str, target = evt.target;
    var tagName = target.tagName;
    switch (tagName) {
        case "TEXTAREA":
        case "INPUT":
            var start = target.selectionStart;
            var end = target.selectionEnd;
            str = target.value.slice(start, end);
            break;
        default:
            str = content.getSelection().toString();
    }
    if (!_.isEmpty(str)) {
        str = str.trim();
    }
    return str;
}