/** @format */

import browser from 'webextension-polyfill'

import {HOME} from './constants'
import {setCurrentAction} from './background'
import {cleanupBrowserAction} from './utils'

const behaviors = {
  'navigate-home': () => {
    setCurrentAction({type: HOME})
  },
  'return-preimage': ({payment_preimage}, [_, promise]) => {
    promise.resolve({preimage: payment_preimage})
  },
  'notify-payment-success': ({msatoshi, msatoshi_sent}, _) => {
    browser.notifications.create({
      type: 'basic',
      message: `${parseInt(
        msatoshi / 1000
      )} satoshis paid with a fee of ${msatoshi_sent - msatoshi}msats.`,
      title: 'Payment succeeded',
      iconUrl: '/icon64-active.png'
    })
  },
  'return-payment-error': (resp, [_, promise]) => {
    console.log(resp)
    promise.reject(new Error('Payment failed or still pending.'))
  },
  'notify-payment-error': (e, _) => {
    browser.notifications.create({
      type: 'basic',
      message: e.message,
      title: 'Payment error',
      iconUrl: '/icon64.png'
    })
  },
  'paste-invoice': ({bolt11}, [{pasteOn}]) => {
    if (pasteOn) {
      browser.tabs.sendMessage(pasteOn[0], {
        paste: true,
        elementId: pasteOn[1],
        bolt11
      })
    }
  },
  'return-invoice': ({bolt11}, [_, promise]) => {
    promise.resolve({paymentRequest: bolt11})
  },
  'notify-invoice-error': (e, _) => {
    browser.notifications.create({
      type: 'basic',
      message: e.message,
      title: 'Error generating invoice',
      iconUrl: '/icon64.png'
    })
  },
  'allow-enable-domain': (
    __,
    [
      {
        origin: {domain}
      },
      promise
    ]
  ) => {
    browser.storage.local
      .get('authorized')
      .then(({authorized}) => {
        return browser.storage.local.set({
          authorized: {...authorized, domain: true}
        })
      })
      .then(() => {
        promise.resolve(true)
      })
  },
  'reject-enable': (__, [_, promise]) => {
    promise.reject(new Error('Unauthorized.'))
  },
  'cleanup-browser-action': () => {
    cleanupBrowserAction()
  }
}

export function getBehavior(name) {
  return behaviors[name]
}

export default behaviors
