/** @format */

import browser from 'webextension-polyfill'

import openPrompt, {PROMPT_PAYMENT, getOriginData} from './open-prompt'

function setContextMenus() {
  browser.contextMenus.create({
    id: 'pay-invoice',
    title: 'Pay Lightning Invoice',
    contexts: ['selection', 'page'],
    visible: false
  })

  var currentInvoice = ''

  browser.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'pay-invoice') {
      openPrompt({
        type: PROMPT_PAYMENT,
        args: {invoice: currentInvoice},
        origin: getOriginData()
      })
    }
  })

  browser.runtime.onMessage.addListener(({contextMenu, args}) => {
    if (!contextMenu) return

    // set context menu visibility based on right-clicked text
    currentInvoice = args.invoice.trim()
    var visible = currentInvoice.slice(0, 4) === 'lnbc'
    browser.contextMenus.update('pay-invoice', {visible})
  })
}

setContextMenus()
