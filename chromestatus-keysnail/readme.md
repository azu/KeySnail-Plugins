# Chromium Dashboard for keysnail

Chromium Dashboard を KeySnailから検索出来るプラグイン

![ScreenShot](http://gyazo.com/373fbbec3f5a955175e81ca5afc86789.gif)

```js
// e.g.)
key.setGlobalKey(['C-b', 'c'], function (ev, arg) {
    ext.exec('chromium-dashboard-search', arg, ev);
}, 'Chromium Dashboard検索', true);
```

* [Chromium Dashboard](http://www.chromestatus.com/features "Chromium Dashboard")