# Can I use... for keysnail

Can I use... を KeySnailから検索出来るプラグイン

![ScreenShot](http://f.cl.ly/items/2l2A1d120K2x3r020t2L/Image%202013.07.28%2017%3A50%3A06.png)

```js
// e.g.)
key.setGlobalKey(['C-b', 'c'], function (ev, arg) {
    ext.exec('caniuse-search', arg, ev);
}, 'Can I Use... 検索', true);
```

* [Can I use... Support tables for HTML5, CSS3, etc](http://caniuse.com/ "Can I use... Support tables for HTML5, CSS3, etc")