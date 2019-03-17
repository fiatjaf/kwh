/** @format */

import browser from 'webextension-polyfill'
import createHmac from 'create-hmac'

import openPrompt, {PROMPT_PAYMENT, getOriginData} from './open-prompt'

const fetch = window.fetch

export function rpcCall(method, params = []) {
  return browser.storage.local
    .get(['endpoint', 'username', 'password'])
    .then(({endpoint, username, password}) => {
      let accessKey = createHmac('sha256', `${username}:${password}`)
        .update('access-key')
        .digest('base64')
        .replace(/\W+/g, '')

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'kwh-extension',
          'X-Access': accessKey
        },
        body: JSON.stringify({method, params})
      }).then(r => r.json())
    })
}

// when someone -- the popup -- wants to call the lightning rpc
browser.runtime.onMessage.addListener(({rpc, method, params}) => {
  if (!rpc) return
  return rpcCall(method, params)
})

// making the context menu work
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
