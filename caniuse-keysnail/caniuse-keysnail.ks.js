var PLUGIN_INFO =
    <KeySnailPlugin>
        <name>caniuse for keysnail</name>
        <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/caniuse-keysnail.ks.js</updateURL>
        <description>Search on http://caniuse.com/</description>
        <version>0.0.1</version>
        <author mail="" homepage="http://efcl.info/">10sr</author>
        <license>MIT</license>
        <minVersion>1.0</minVersion>
        <include>main</include>
        <provides>
            <ext>caniuse-search</ext>
        </provides>
        <detail><![CDATA[
=== Overview ===
Search on http://caniuse.com/
]]></detail>
    </KeySnailPlugin>;

/**
 * CanIuse
 * @constructor
 */
function CanIuse() {
}
CanIuse.prototype.dataJSONURL = "https://raw.github.com/Fyrd/caniuse/master/data.json";
CanIuse.prototype.getDataJSON = function (callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        callback(null, xhr.response);
    };
    xhr.onerror = function () {
        callback(new Error(xhr.statusText), xhr.response);
    };
    xhr.open("get", this.dataJSONURL, true);
    xhr.responseType = 'json';
    xhr.send();
};
/**
 *
 * @param json
 * @returns {Array} ["title", "description", "categories", "keywords"]
 */
CanIuse.prototype.buildDataTable = function (json) {
    var data;
    var dataList = json.data;
    var dataTable = [];
    for (var key in dataList) {
        data = dataList[key];
        var row = [
            data["title"],
            data["description"],
            data["categories"].join(","),
            data["keywords"],
            key
        ];
        dataTable.push(row);
    }
    return dataTable;
};

ext.add("caniuse-search",
    function (aEvent, aArg) {
        searchOn(aArg);
    },
    M({ja: "Can I use... 検索",
        en: "Search Can I use..."}));

function searchOn() {
    var canIuse = new CanIuse();
    canIuse.getDataJSON(function (error, json) {
        if (error != null) {
            display.showPopup("Can I use... error", error);
            return;
        }
        var dataTable = canIuse.buildDataTable(json);
        openPrompt(dataTable);
    });

    function openPrompt(dataTable) {
        prompt.selector(
            {
                message: "pattern:",
                collection: dataTable,
                flags: [0, 0, 0, 0, IGNORE | HIDDEN],
                style: [null, null, "color:#001d6b;", "color:#001d6b;"],
                header: ["title", "description", "categories", "keywords"],
                width: [20, 60, 10, 10],
                actions: [
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(getURL(aIndex), "tab");
                        }
                    }, M({en: "Open Link in new tab (foreground)", ja: "新しいタブで開く (前面)"})],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(getURL(aIndex), "tabshifted");
                        }
                    }, M({en: "Open Link in new tab (background)", ja: "新しいタブで開く (背面)"})],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(getURL(aIndex), "current");
                        }
                    }, M({en: "Open Link in current tab", ja: "現在のタブで開く"})],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(getURL(aIndex), "window");
                        }
                    }, M({en: "Open Link in new window", ja: "新しいウィンドウで開く (背面)"})]
                ]
            }
        );

        function getURL(aIndex) {
            var data = dataTable[aIndex];
            return "http://caniuse.com/#feat=" + data[data.length - 1];
        }
    }
}