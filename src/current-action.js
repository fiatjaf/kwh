/** @format */

import {browser} from './browser'
import {HOME, PROMPT_PAYMENT, PROMPT_INVOICE} from './constants'

const blankAction = {type: HOME}

var currentActions = {}
var actionIdNext = 1

export function get(tabId) {
  if (tabId in currentActions) {
    return currentActions[tabId]
  }
  return [{...blankAction, id: actionIdNext++}, null]
}

export function set(tabId, action) {
  if (action.type === PROMPT_PAYMENT || action.type === PROMPT_INVOICE) {
    emphasizeBrowserAction(tabId, action.type)
  } else {
    cleanupBrowserAction(tabId)
  }

  // schedule cleanup
  setTimeout(() => {
    delete currentActions[tabId]
    cleanupBrowserAction(tabId)
  }, 1000 * 60 * 4 /* 4 minutes */)

  let promise = new Promise((resolve, reject) => {
    currentActions[tabId] = [{...action, id: actionIdNext++}, {resolve, reject}]
  })
  return [currentActions[tabId][0], promise]
}

export const prompt_defs = {
  PROMPT_PAYMENT: ['pay', '#d5008f'],
  PROMPT_INVOICE: ['req', '#357edd']
}

export function emphasizeBrowserAction(tabId, type) {
  let [label, bg] = prompt_defs[type]

  browser.browserAction.setBadgeText({text: label, tabId})
  browser.browserAction.setIcon({
    path: {16: 'icon16-active.png', 64: 'icon64-active.png'},
    tabId
  })
  browser.browserAction.setBadgeBackgroundColor({color: bg, tabId})

  try {
    browser.browserAction.setBadgeTextColor({color: '#ffffff'})
  } catch (e) {}
}

export function cleanupBrowserAction(tabId) {
  browser.browserAction.setBadgeText({text: '', tabId})
  browser.browserAction.setIcon({
    path: {16: 'icon16.png', 64: 'icon64.png'},
    tabId
  })
}
