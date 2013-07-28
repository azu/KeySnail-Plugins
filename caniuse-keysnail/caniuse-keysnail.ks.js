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

var { Loader } = Components.utils.import("resource://gre/modules/commonjs/toolkit/loader.js", {});
var loader = Loader.Loader({
    paths: {
        "sdk/": "resource://gre/modules/commonjs/sdk/",
        "": "globals:///"
    },
    resolve: function (id, base) {
        if (id == "chrome" || id.startsWith("@"))
            return id;
        return Loader.resolve(id, base);
    }
});
var module = Loader.Module("main", "scratchpad://");
var require = Loader.Require(loader, module);

/**
 * CanIuse
 * @constructor
 */
function CanIuse() {
}
CanIuse.prototype.dataJSONURL = "https://raw.github.com/Fyrd/caniuse/master/data.json";
/**
 *
 * @returns {Object}
 */
CanIuse.prototype.getDataJSON = function (callback) {
    var Request = require("sdk/request").Request;
    Request({
        url: this.dataJSONURL,
        onComplete: function (response) {
            if (response.json) {
                callback(null, response.json);
            } else {
                throw new Error("Not Found!");
            }
        }
    }).get();
    return {};
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
            return;
        }
        var dataTable = canIuse.buildDataTable(json);
        openPrompt(dataTable);
    });

    function openPrompt(dataTable) {
        fbug(dataTable[0]);
        prompt.selector(
            {
                message: "pattern:",
                collection: dataTable,
                flags: [0, 0, 0, 0, IGNORE | HIDDEN],
                style: [null, null, "color:#001d6b;", "color:#001d6b;"],
                header: ["title", "description", "categories", "keywords"],
                width: [20, 40, 10, 10],
                actions: [
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(getURL(aIndex), "tab");
                        }
                    }, "Open Link in new tab (foreground)"]
                ]
            }
        );

        function getURL(aIndex) {
            var data = dataTable[aIndex];
            return "http://caniuse.com/#feat=" + data[data.length - 1];
        }
    }
}