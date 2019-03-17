/** @format */

import browser from 'webextension-polyfill'

export const PROMPT_PAYMENT = 'pay'

export function getOriginData() {
  return {}
}

var action = null

export default function openPrompt({type, args, origin}) {
  action = {type, args, origin}
  browser.browserAction.setBadgeText({text: type})

  if (browser.browserAction.openPopup) {
    browser.browserAction.openPopup()
  }
}

browser.runtime.onMessage.addListener(({getPopupAction}) => {
  if (!getPopupAction) return

  return Promise.resolve({popupAction: action})
})
