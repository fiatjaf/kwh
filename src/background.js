/** @format */

import browser from 'webextension-polyfill'

import {
  PROMPT_PAYMENT,
  PROMPT_INVOICE,
  MENUITEM_PAY,
  MENUITEM_BLOCK,
  MENUITEM_GENERATE
} from './constants'
import {sprint, msatsFormat, notify} from './utils'
import {getBehavior} from './predefined-behaviors'
import {handleRPC, listenForEvents} from './interfaces'
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

      notify({
        title,
        message,
        iconUrl: '/icon64-active.png'
      })
    })
  }

  return promise
})

// start listening for events from the node
listenForEvents((type, data) => {
  switch (type) {
    case 'payment-received':
      let {amount, description, hash} = data
      notify({
        title: 'Got payment',
        message: `Your ${msatsFormat(
          amount
        )} invoice ("${description}") was paid!`,
        iconUrl: '/icon64-active.png'
      })
      browser.runtime.sendMessage({
        invoicePaid: true,
        hash
      })
      break
    case 'payment-failed':
      break
  }
})

// do an rpc call on behalf of anyone who wants that -- normally the popup
browser.runtime.onMessage.addListener(
  ({rpc, behaviors = {}, extra = {}, tab}, sender) => {
    if (!rpc) return

    tab = sender.tab || tab
    let resPromise = handleRPC(rpc)

    resPromise.then(res => {
      ;(behaviors.success || [])
        .map(getBehavior)
        .forEach(behavior => behavior(res, current.get(tab.id), tab.id, extra))
    })

    resPromise.catch(err => {
      ;(behaviors.failure || [])
        .map(getBehavior)
        .forEach(behavior => behavior(err, current.get(tab.id), tab.id, extra))
    })

    return resPromise
  }
)

// trigger behaviors from popup action
browser.runtime.onMessage.addListener(
  ({triggerBehaviors, behaviors, extra = {}, tab}, sender) => {
    if (!triggerBehaviors) return
    tab = sender.tab || tab
    behaviors
      .map(getBehavior)
      .forEach(behavior => behavior(null, current.get(tab.id), tab.id, extra))
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
  id: MENUITEM_PAY,
  title: 'Pay Lightning Invoice',
  contexts: ['selection', 'page'],
  visible: false
})

// 'insert invoice' here context menu
browser.contextMenus.create({
  id: MENUITEM_GENERATE,
  title: 'Generate invoice here',
  contexts: ['editable']
})

// 'block domain' context menu
browser.contextMenus.create({
  id: MENUITEM_BLOCK,
  title: 'Prevent this site from calling webln',
  contexts: ['browser_action']
})

// listen to context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  browser.tabs.sendMessage(tab.id, {getOrigin: true}).then(origin => {
    switch (info.menuItemId) {
      case MENUITEM_PAY:
        // set current action to pay this invoice
        current.set(tab.id, {
          type: PROMPT_PAYMENT,
          invoice: invoiceToPay,
          origin
        })
        break
      case MENUITEM_GENERATE:
        current.set(tab.id, {
          type: PROMPT_INVOICE,
          pasteOn: [tab.id, info.targetElementId],
          defaultAmount: invoiceDefaultValue,
          origin
        })
        break
      case MENUITEM_BLOCK:
        browser.tabs.query({active: true}).then(tabs => {
          browser.storage.local
            .get('blocked')
            .then(({blocked}) => {
              blocked = blocked || {}
              blocked[origin.domain] = true
              browser.storage.local.set({blocked})
            })
            .then(() => {
              notify({
                title: `${origin.domain} was blocked`,
                message:
                  'Refreshing the page is necessary for the modifications to take place.'
              })
            })
            .catch(err => {
              notify({
                title: `Error blocking ${origin.domain}`,
                message: err.message
              })
            })
        })
        break
    }
  })
})

// listen to page events
var invoiceToPay = ''
var invoiceDefaultValue = 100

browser.runtime.onMessage.addListener(({contextMenu, text}) => {
  // set context menu based on selected/right-clicked text
  if (!contextMenu) return

  // pay-invoice
  invoiceToPay = text.trim()
  var visible = invoiceToPay.slice(0, 4) === 'lnbc'
  browser.contextMenus.update(MENUITEM_PAY, {visible})

  // generate-invoice-here
  invoiceDefaultValue = parseInt(text.trim())
  if (!isNaN(invoiceDefaultValue)) {
    browser.contextMenus.update(MENUITEM_GENERATE, {
      title: `Generate ${msatsFormat(invoiceDefaultValue * 1000)} invoice here`
    })
  } else {
    browser.contextMenus.update(MENUITEM_GENERATE, {
      title: 'Generate invoice here'
    })
  }
})
