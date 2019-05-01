/** @format */

import browser from 'webextension-polyfill'

import {HOME} from './constants'
import {set, cleanupBrowserAction} from './current-action'
import {msatsFormat, notify} from './utils'
import handleRPC from './interfaces'

const behaviors = {
  'navigate-home': (_, __, tabId) => {
    set(tabId, {type: HOME})
  },
  'save-pending-to-current-action': (_, [action], tabId) => {
    set(tabId, {...action, pending: true})
  },
  'return-preimage': ({preimage}, [_, promise]) => {
    if (promise) promise.resolve(preimage)
  },
  'notify-payment-success': ({msatoshi_paid, msatoshi_fees}, _) => {
    notify({
      title: 'Payment succeeded',
      message: `${msatsFormat(msatoshi_paid)} paid with a fee of ${msatsFormat(
        msatoshi_fees
      )}.`,
      iconUrl: '/icon64-active.png'
    })
  },
  'return-payment-error': (resp, [_, promise]) => {
    console.log(resp)
    if (promise) promise.reject(new Error('Payment failed or still pending.'))
  },
  'notify-payment-error': (e, _) => {
    notify({
      message: e.message,
      title: 'Payment error'
    })
  },
  'paste-invoice': (bolt11, [{pasteOn}]) => {
    if (pasteOn) {
      browser.tabs.sendMessage(pasteOn[0], {
        paste: true,
        elementId: pasteOn[1],
        bolt11
      })
    }
  },
  'save-invoice-to-current-action': (bolt11, [action, _], tabId) => {
    set(tabId, {...action, invoice: bolt11})
  },
  'return-invoice': (bolt11, [_, promise]) => {
    if (promise) promise.resolve(bolt11)
  },
  'wait-for-invoice': ({bolt11}, _, tabId, extra) => {
    handleRPC({invoiceWait: [extra.newInvoiceLabel]})
      .then(({status, msatoshi, description}) => {
        if (status === 'paid') {
          notify({
            title: 'Got payment',
            message: `Your ${msatsFormat(
              msatoshi
            )} invoice ("${description}") was paid!`,
            iconUrl: '/icon64-active.png'
          })
          browser.runtime.sendMessage({
            invoicePaid: true,
            bolt11
          })
          setTimeout(() => {
            behaviors['navigate-home'](null, null, tabId)
          }, 5000)
        }
      })
      .catch(() => {})
  },
  'notify-invoice-error': (e, _) => {
    notify({
      message: e.message,
      title: 'Error generating invoice'
    })
  },
  'cleanup-browser-action': (_, [action]) => {
    cleanupBrowserAction(action.tabId)
  }
}

export function getBehavior(name) {
  return behaviors[name]
}

export default behaviors
