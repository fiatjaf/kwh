/** @format */

import browser from 'webextension-polyfill'
import {defs as kindDefs} from './interfaces'

export function getOriginData() {
  return {
    domain: getDomain(),
    name: getName().split(/\W[^\w ]\W/)[0],
    icon: getIcon()
  }

  function getDomain() {
    var domain = window.location.host
    if (domain.slice(0, 4) === 'www.') {
      domain = domain.slice(4)
    }
    return domain
  }

  function getName() {
    let nameMeta = document.querySelector(
      'head > meta[property="og:site_name"]'
    )
    if (nameMeta) return nameMeta.content

    let titleMeta = document.querySelector('head > meta[name="title"]')
    if (titleMeta) return titleMeta.content

    return document.title
  }

  function getIcon() {
    let allIcons = Array.from(
      document.querySelectorAll('head > link[rel="icon"]')
    ).filter(icon => !!icon.href)

    if (allIcons.length) {
      let href = allIcons.sort((a, b) => {
        let aSize = parseInt(a.getAttribute('sizes') || '0', 10)
        let bSize = parseInt(b.getAttribute('sizes') || '0', 10)
        return bSize - aSize
      })[0].href
      return makeAbsoluteUrl(href)
    }

    // Try for favicon
    let favicon = document.querySelector('head > link[rel="shortcut icon"]')
    if (favicon) return makeAbsoluteUrl(favicon.href)

    // fallback to default favicon path, let it be replaced in view if it fails
    return `${window.location.origin}/favicon.ico`
  }

  function makeAbsoluteUrl(path) {
    return new URL(path, window.location.origin).href
  }
}

export const defaultRpcParams = {
  kind: 'lightningd_spark',
  endpoint: 'http://localhost:9737/',
  username: '',
  password: ''
}

export function getRpcParams() {
  return browser.storage.local.get(defaultRpcParams)
}

export function normalizeURL(endpoint) {
  let url = new URL(endpoint.trim(), 'http://localhost:9737/')
  return url.protocol + '//' + url.host
}

export function rpcParamsAreSet() {
  return browser.storage.local.get(defaultRpcParams).then(rpcParams => {
    var currentKindDef = null

    for (let i = 0; i < kindDefs.length; i++) {
      if (kindDefs[i].value === rpcParams.kind) {
        currentKindDef = kindDefs[i]
      }
    }

    // check if for the current kind (eclair, lightningd_spark etc.)
    // all the required options are set.
    for (let i = 0; i < currentKindDef.fields.length; i++) {
      let field = currentKindDef.fields[i]
      if (!rpcParams[field] || rpcParams[field] === '') {
        return false
      }
    }

    return true
  })
}

export function formatmsat(msatoshis) {
  if (Math.abs(msatoshis) < 1000) {
    return `${msatoshis} msat`
  }

  if (msatoshis === 1000) return '1 satoshi'

  for (let prec = 3; prec >= 0; prec--) {
    let dec = 10 ** prec
    if (msatoshis / dec === parseInt(msatoshis / dec)) {
      return `${(msatoshis / 1000).toFixed(3 - prec)} sat`
    }
  }
}

export function structuredprint(o) {
  return Object.keys(o)
    .map(
      k => `${k}='${typeof o[k] === 'string' ? o[k] : JSON.stringify(o[k])}'`
    )
    .join(' ')
}

export function abbreviate(longstring) {
  return `${longstring.slice(0, 4)}…${longstring.slice(-4)}`
}

export function notify(params, notificationId = null) {
  notificationId = notificationId || 'n-' + Math.random()
  params = {type: 'basic', iconUrl: '/icon64.png', ...params}
  browser.notifications.create(notificationId, params)
  setTimeout(() => {
    browser.notifications.clear(notificationId)
  }, 3000)
}

export function backoff(fn, nattempts = 10, multiplier = 1) {
  // fibonacci because why not?
  var currv = 1
  var prevv = 1

  var res = Promise.reject()

  for (let attempt = 0; attempt < nattempts; attempt++) {
    let newv = prevv + currv
    prevv = currv
    currv = newv
    ;((attempt, wait) => {
      res = res.catch(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fn(attempt, wait)
              .then(resolve)
              .catch(reject)
          }, wait * 1000)
        })
      })
    })(attempt, currv * multiplier)
  }

  return res
}
