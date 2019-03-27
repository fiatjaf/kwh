/** @format */

import browser from 'webextension-polyfill'

import {PROMPT_PAYMENT, PROMPT_INVOICE} from './constants'
import {rpcCall, sprint, msatsFormat} from './utils'
import {getBehavior} from './predefined-behaviors'
import * as current from './current-action'

// logger service
browser.runtime.onMessage.addListener((message, sender) => {
  console.log(
    `[message-in]: ${sprint({
      ...message,
      tab: message.getInit ? '-' : (sender.tab || message.tab).id
    })}}`
  )
})

// return the current action to anyone asking for it -- normally the popup
browser.runtime.onMessage.addListener(({getInit}) => {
  if (!getInit) return
  return browser.tabs.query({active: true}).then(tabs => {
    let tab = tabs[0]
    return {action: current.get(tab.id)[0], tab: {id: tab.id}}
  })
})

// set current action when anyone -- normally the popup -- wants
browser.runtime.onMessage.addListener(({setAction, tab}, sender) => {
  if (!setAction) return

  tab = sender.tab || tab
  let [action, promise] = current.set(tab.id, setAction)

  if (tab) {
    // means it's coming from the content-script, not the popup
    // so we notify the popup just in case it's open and needs to update
    browser.runtime.sendMessage({setAction: action}).catch(() => {})
  }

  // notify user there's an action waiting for him in the popup
  // either by opening the popup or by showing a notification
  if (action.type === PROMPT_PAYMENT || action.type === PROMPT_INVOICE) {
    browser.browserAction.openPopup().catch(() => {
      // if that fails, show a notification
      let [title, message] = {
        [PROMPT_PAYMENT]: [
          'Send a payment',
          `'${action.origin.name}' is requesting a payment!`
        ],
        [PROMPT_INVOICE]: [
          'Make an invoice',
          `'${action.origin.name}' needs an invoice${
            action.amount ? `for ${msatsFormat(action.amount * 1000)}` : ''
          }.`
        ]
      }[action.type]

      let notificationId = `openpopup-${action.id}`
      browser.notifications.create(notificationId, {
        type: 'basic',
        title,
        message,
        iconUrl: '/icon64-active.png'
      })
      setTimeout(() => {
        browser.notification.clear(notificationId)
      }, 3000)
    })
  }

  return promise
})

browser.notifications.onClicked.addListener(notificationId => {
  if (notificationId && notificationId.split('-')[0] === 'openpopup') {
    browser.browserAction.openPopup().catch(err => console.log('err', err))
  }
})

// do an rpc call on behalf of anyone who wants that -- normally the popup
browser.runtime.onMessage.addListener(
  ({rpc, method, params, behaviors = {}, extra = {}, tab}, sender) => {
    if (!rpc) return

    tab = sender.tab || tab
    let resPromise = rpcCall(method, params).then(res => {
      if (res.code) {
        throw new Error(res.message || res.code)
      }
      return res
    })

    resPromise.then(res => {
      ;(behaviors.success || [])
        .map(getBehavior)
        .forEach(behavior => behavior(res, current.get(tab.id), tab.id))
    })

    resPromise.catch(err => {
      ;(behaviors.failure || [])
        .map(getBehavior)
        .forEach(behavior => behavior(err, current.get(tab.id), tab.id))
    })

    return resPromise
  }
)

// trigger behaviors from popup action
browser.runtime.onMessage.addListener(
  ({triggerBehaviors, behaviors, tab}, sender) => {
    if (!triggerBehaviors) return
    tab = sender.tab || tab
    behaviors
      .map(getBehavior)
      .forEach(behavior => behavior(null, current.get(tab.id), tab.id))
  }
)

// return if a domain is authorized or authorize a domain
browser.runtime.onMessage.addListener(({getBlocked, domain, tab}, sender) => {
  if (!getBlocked) return
  tab = sender.tab || tab
  return browser.storage.local.get('blocked').then(res => {
    let blocked = res.blocked || {}
    return domain
      ? blocked[domain] || false
      : blocked /* return all if domain not given */
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
  browser.tabs.sendMessage(tab.id, {getOrigin: true}).then(origin => {
    switch (info.menuItemId) {
      case 'pay-invoice':
        // set current action to pay this invoice
        current.set(tab.id, {
          type: PROMPT_PAYMENT,
          invoice: currentInvoice,
          origin
        })
        break
      case 'generate-invoice-here':
        current.set(tab.id, {
          type: PROMPT_INVOICE,
          pasteOn: [tab.id, info.targetElementId],
          origin
        })
        break
    }
  })
})

var currentInvoice = ''

browser.runtime.onMessage.addListener(({contextMenu, invoice}) => {
  if (!contextMenu) return

  // set context menu visibility based on right-clicked text
  currentInvoice = invoice.trim()
  var visible = currentInvoice.slice(0, 4) === 'lnbc'
  browser.contextMenus.update('pay-invoice', {visible})
})
