/** @format */

import browser from 'webextension-polyfill'

import {NOTHING} from './constants'

export function getOriginData() {
  return {}
}

var action = {type: NOTHING}

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
