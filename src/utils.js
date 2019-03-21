/** @format */

import browser from 'webextension-polyfill'
import createHmac from 'create-hmac'

const fetch = window.fetch

export function getOriginData() {
  return {
    domain: getDomain(),
    name: getName(),
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

export function rpcCall(method, params = []) {
  return browser.storage.local
    .get(['endpoint', 'username', 'password'])
    .then(({endpoint, username, password}) => {
      let accessKey = createHmac('sha256', `${username}:${password}`)
        .update('access-key')
        .digest('base64')
        .replace(/\W+/g, '')

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'kwh-extension',
          'X-Access': accessKey
        },
        body: JSON.stringify({method, params})
      }).then(r => r.json())
    })
}

export function msatsFormat(msatoshis) {
  if (Math.abs(msatoshis) < 1000) {
    return `${msatoshis} msat${msatoshis === 1 || msatoshis === -1 ? '' : 's'}`
  }

  if (msatoshis === 1000) return '1 sat'

  for (let prec = 3; prec >= 0; prec--) {
    let dec = 10 ** prec
    if (msatoshis / dec === parseInt(msatoshis / dec)) {
      return `${(msatoshis / 1000).toFixed(3 - prec)} sats`
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
