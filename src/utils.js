/** @format */

import browser from 'webextension-polyfill'

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
  endpoint: 'http://localhost:9737/rpc',
  username: '',
  password: ''
}

export function getRpcParams() {
  return browser.storage.local.get(defaultRpcParams)
}

export function rpcParamsAreSet() {
  return browser.storage.local.get(defaultRpcParams).then(rpcParams => {
    if (
      rpcParams.username !== '' &&
      rpcParams.password !== '' &&
      rpcParams.endpoint !== ''
    ) {
      return true
    }

    return false
  })
}

export function msatsFormat(msatoshis) {
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

export function sprint(o) {
  return Object.keys(o)
    .map(
      k => `${k}='${typeof o[k] === 'string' ? o[k] : JSON.stringify(o[k])}'`
    )
    .join(' ')
}

export function notify(params, notificationId = null) {
  notificationId = notificationId || 'n-' + Math.random()
  params = {type: 'basic', iconUrl: '/icon64.png', ...params}
  browser.notifications.create(notificationId, params)
  setTimeout(() => {
    browser.notifications.clear(notificationId)
  }, 3000)
}
