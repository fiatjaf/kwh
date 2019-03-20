/** @format */

import browser from 'webextension-polyfill'

import {
  HOME,
  PROMPT_PAYMENT,
  PROMPT_INVOICE,
  PROMPT_ENABLE,
  prompt_label
} from './constants'
import {
  rpcCall,
  getOriginData,
  emphasizeBrowserAction,
  cleanupBrowserAction
} from './utils'
import {getBehavior} from './predefined-behaviors'

// return the current action to anyone asking for it -- normally the popup
browser.runtime.onMessage.addListener(({getCurrentAction}) => {
  if (!getCurrentAction) return
  return Promise.resolve({action: currentAction[0]})
})

// set current action when anyone -- normally the popup -- wants
browser.runtime.onMessage.addListener(({setAction}) => {
  if (!setAction) return

  return new Promise((resolve, reject) => {
    let action = setAction
    setCurrentAction(action, false, {resolve, reject})
  })
})

const blankAction = {type: HOME}
var actionIdNext = 1
var currentAction = [{...blankAction, id: 0}, null]
export function setCurrentAction(action, sendMessage = true, promise = null) {
  currentAction = [{...action, id: actionIdNext++}, promise]

  if (
    action.type === PROMPT_PAYMENT ||
    action.type === PROMPT_INVOICE ||
    action.type === PROMPT_ENABLE
  ) {
    let label = prompt_label[action.type]
    emphasizeBrowserAction(label)
  } else {
    cleanupBrowserAction()
  }

  if (sendMessage) {
    browser.runtime.sendMessage({setAction: action}).catch(() => {})
  }

  if (
    action.type === PROMPT_PAYMENT ||
    action.type === PROMPT_INVOICE ||
    action.type === PROMPT_ENABLE
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
        .forEach(behavior => behavior(res, currentAction))
    })

    resPromise.catch(err => {
      ;(behaviors.failure || [])
        .map(getBehavior)
        .forEach(behavior => behavior(err, currentAction))
    })

    return resPromise
  }
)

// trigger behaviors from popup action
browser.runtime.onMessage.addListener(({triggerBehaviors, behaviors}) => {
  if (!triggerBehaviors) return
  behaviors.map(getBehavior).forEach(behavior => behavior(null, currentAction))
})

// return if a domain is authorized or authorize a domain
browser.runtime.onMessage.addListener(({getAuthorized, domain}) => {
  if (!getAuthorized) return
  return browser.storage.local.get('authorized').then(res => {
    let authorized = res.authorized || {}
    return domain
      ? authorized[domain]
      : authorized /* return all if domain not given */
  })
})

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
