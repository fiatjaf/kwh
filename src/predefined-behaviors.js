/** @format */

import browser from 'webextension-polyfill'

import {HOME} from './constants'
import {setCurrentAction} from './background'

const behaviors = {
  'navigate-home': () => {
    setCurrentAction({type: HOME})
  },
  'notify-payment-success': ({msatoshi, msatoshi_sent}) => {
    browser.notifications.create({
      type: 'basic',
      message: `${parseInt(
        msatoshi / 1000
      )} satoshis paid with a fee of ${msatoshi_sent - msatoshi}msats.`,
      title: 'Payment succeeded',
      iconUrl: '/icon64-active.png'
    })
  },
  'notify-payment-error': e => {
    browser.notifications.create({
      type: 'basic',
      message: e.message,
      title: 'Payment error',
      iconUrl: '/icon64.png'
    })
  },
  'paste-invoice': ({bolt11}, {pasteOn}) => {
    if (pasteOn) {
      browser.tabs.sendMessage(pasteOn[0], {
        paste: true,
        elementId: pasteOn[1],
        bolt11
      })
    }
  },
  'notify-invoice-error': e => {
    browser.notifications.create({
      type: 'basic',
      message: e.message,
      title: 'Error generating invoice',
      iconUrl: '/icon64.png'
    })
  }
}

export function getBehavior(name) {
  return behaviors[name]
}

export default behaviors
