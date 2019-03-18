/** @format */

import browser from 'webextension-polyfill'
import createHmac from 'create-hmac'

const fetch = window.fetch

export function getOriginData() {
  return {}
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
