<p align="center">
  <img src="https://i.imgur.com/Opk21LD.png" alt="kWh" style="max-width:100%;" width="400">
</p>

<p align="center">The companion browser extension for c-lightning nodes.</p>

<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/kwh/"><img src="https://i.imgur.com/aNCB2LG.png" alt="Install for Firefox" width="215" style="max-width:100%;"></a>
  <a href="https://chrome.google.com/webstore/detail/kwh/mbjlodgfcaknfbphnnfioilcnippdnjp"><img src="https://i.imgur.com/kWBQU9Q.png" alt="Install for Chrome" width="215" style="max-width:100%;"></a>
</p>

## Features

- Browse balance and latest transactions;
- [`webln`](https://webln.dev/#/) support;
- Pay highlighted invoice with a context menu item;
- Handle `lightning:` links;
- [“Generate invoice here”](https://youtu.be/wzkxxz5FsJo) context menu;
- Manual payments and invoice creation;
- No popups, all interactions happen in the browserAction.

### Requirements

A [lightningd](https://github.com/ElementsProject/lightning/) with a [Spark](https://github.com/shesek/spark-wallet) [RPC server](https://github.com/fiatjaf/sparko) in front of it.

### Build instructions

You'll need: Node.js>=10, npm>=6, GNU Make>=4

```
npm install
make extension.zip
```

---

<div>Icons made by <a href="https://www.flaticon.com/authors/smalllikeart" title="smalllikeart">smalllikeart</a> from <a href="https://www.flaticon.com/"               title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/"              title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
