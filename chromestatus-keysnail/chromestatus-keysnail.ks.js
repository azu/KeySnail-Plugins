var PLUGIN_INFO =
    <KeySnailPlugin>
        <name>caniuse for keysnail</name>
        <updateURL>https://github.com/azu/KeySnail-Plugins/raw/master/chromestatus-keysnail/chromestatus-keysnail.ks.js</updateURL>
        <description>Search on http://caniuse.com/</description>
        <version>0.0.1</version>
        <author mail="info@efcl.info" homepage="http://efcl.info/">10sr</author>
        <license>MIT</license>
        <minVersion>1.0</minVersion>
        <include>main</include>
        <provides>
            <ext>chromium-dashboard-search</ext>
        </provides>
        <detail><![CDATA[
=== Overview ===
Search on chromestatus-keysnail
]]></detail>
    </KeySnailPlugin>;

/**
 * ChStatus
 * @constructor
 */
function ChStatus() {
}
ChStatus.prototype.dataJSONURL = "http://www.chromestatus.com/features.json";
ChStatus.prototype.getDataJSON = function (callback) {
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
ChStatus.prototype.buildDataTable = function (json) {
    return json.map(function (data) {
        return [
            data["name"],
            data["summary"],
            data["category"],
            data["id"],
        ]
    });
};

ext.add("chromium-dashboard-search",
    function (aEvent, aArg) {
        searchOn(aArg);
    },
    M({ja: "Chromium Dashboard 検索",
        en: "Search Chromium Dashboard"}));

function searchOn() {
    var chStatus = new ChStatus();
    chStatus.getDataJSON(function (error, json) {
        if (error != null) {
            display.showPopup("Chromium Dashboard error", error);
            return;
        }
        var dataTable = chStatus.buildDataTable(json);
        openPrompt(dataTable);
    });

    function openPrompt(dataTable) {
        prompt.selector(
            {
                message: "pattern:",
                collection: dataTable,
                flags: [0, 0, 0, IGNORE | HIDDEN],
                style: [null, null, "color:#001d6b;"],
                header: ["title", "description", "categories", "id"],
                width: [20, 70, 10, 0],
                actions: [
                    [
                        function (aIndex) {
                            if (aIndex >= 0) {
                                openUILinkIn(getURL(aIndex), "tab");
                            }
                        }, M({en: "Open Link in new tab (foreground)", ja: "新しいタブで開く (前面)"})
                    ],
                    [
                        function (aIndex) {
                            if (aIndex >= 0) {
                                openUILinkIn(getURL(aIndex), "tabshifted");
                            }
                        }, M({en: "Open Link in new tab (background)", ja: "新しいタブで開く (背面)"})
                    ],
                    [
                        function (aIndex) {
                            if (aIndex >= 0) {
                                openUILinkIn(getURL(aIndex), "current");
                            }
                        }, M({en: "Open Link in current tab", ja: "現在のタブで開く"})
                    ],
                    [
                        function (aIndex) {
                            if (aIndex >= 0) {
                                openUILinkIn(getURL(aIndex), "window");
                            }
                        }, M({en: "Open Link in new window", ja: "新しいウィンドウで開く (背面)"})
                    ]
                ]
            }
        );

        function getURL(aIndex) {
            var data = dataTable[aIndex];
            return "http://www.chromestatus.com/features/" + data[data.length - 1];
        }
    }
}