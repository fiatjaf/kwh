/** @format */

import browser from 'webextension-polyfill'

import {HOME, PROMPT_PAYMENT, PROMPT_INVOICE} from './constants'
import {rpcCall, getOriginData} from './utils'
import {getBehavior} from './predefined-behaviors'

// return the current action to anyone asking for it -- normally the popup
browser.runtime.onMessage.addListener(({getPopupAction}) => {
  if (!getPopupAction) return
  return Promise.resolve({popupAction: currentAction})
})

// set current action when anyone -- normally the popup -- wants
browser.runtime.onMessage.addListener(({setAction}) => {
  if (!setAction) return
  setCurrentAction(setAction, false)
})

var currentAction = {type: HOME}
export function setCurrentAction(action, sendMessage = true) {
  currentAction = action

  if (currentAction.type === PROMPT_PAYMENT) {
    browser.browserAction.setBadgeText({text: 'pay'})
    browser.browserAction.setIcon({
      path: {16: 'icon16-active.png', 64: 'icon64-active.png'}
    })
  } else {
    browser.browserAction.setBadgeText({text: ''})
    browser.browserAction.setIcon({
      path: {16: 'icon16.png', 64: 'icon64.png'}
    })
  }

  if (sendMessage) {
    browser.runtime.sendMessage({setAction: action})
  }

  if (
    currentAction.type === PROMPT_PAYMENT ||
    currentAction.type === PROMPT_INVOICE
  ) {
    if (browser.browserAction.openPopup) {
      browser.browserAction.openPopup().catch(() => {})
    }
  }
}

// do an rpc call on behalf of anyone who wants that -- normally the popup
browser.runtime.onMessage.addListener(
  ({rpc, method, params, behaviors = {}, extra = {}}) => {
    if (!rpc) return
    let resPromise = rpcCall(method, params)

    resPromise.then(res => {
      ;(behaviors.success || [])
        .map(getBehavior)
        .forEach(behavior => behavior(res, extra))
    })

    resPromise.catch(err => {
      ;(behaviors.failure || [])
        .map(getBehavior)
        .forEach(behavior => behavior(err, extra))
    })

    return resPromise
  }
)

// context menus
// 'pay with lightning' context menu
browser.contextMenus.create({
  id: 'pay-invoice',
  title: 'Pay Lightning Invoice',
  contexts: ['selection', 'page'],
  visible: false
})

// 'insert invoice' here context menu
browser.contextMenus.create({
  id: 'generate-invoice-here',
  title: 'Generate invoice here',
  contexts: ['editable']
})

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'pay-invoice':
      // set current action to pay this invoice
      setCurrentAction({
        type: PROMPT_PAYMENT,
        invoice: currentInvoice,
        origin: getOriginData()
      })
      break
    case 'generate-invoice-here':
      setCurrentAction({
        type: PROMPT_INVOICE,
        pasteOn: [tab.id, info.targetElementId],
        origin: getOriginData()
      })
      break
  }
})

var currentInvoice = ''

browser.runtime.onMessage.addListener(({contextMenu, invoice}) => {
  if (!contextMenu) return

  // set context menu visibility based on right-clicked text
  currentInvoice = invoice.trim()
  var visible = currentInvoice.slice(0, 4) === 'lnbc'
  browser.contextMenus.update('pay-invoice', {visible})
})
