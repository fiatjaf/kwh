/** @format */

import {PROMPT_ENABLE, PROMPT_PAYMENT, PROMPT_INVOICE} from './constants'

class WebLNProvider {
  constructor() {
    this._enabled = false
    this._promptActive = false
  }

  enable() {
    if (this._enabled) return Promise.resolve(true)

    return this._prompt(PROMPT_ENABLE)
      .then(() => {
        this._enabled = true
        return true
      })
      .catch(() => {})
  }

  getInfo() {
    if (!this._enabled) {
      return Promise.reject('Please call webln.enable() first.')
    }

    return this._sendMessage({rpc: true, method: 'getinfo'}).then(info => ({
      alias: info.alias,
      pubkey: info.id,
      color: info.color
    }))
  }

  sendPayment(invoice) {
    if (!this._enabled) {
      return Promise.reject('Please call webln.enable() first.')
    }

    return this._prompt(PROMPT_PAYMENT, {invoice})
  }

  makeInvoice(args) {
    if (!this._enabled) {
      return Promise.reject('Please call webln.enable() first.')
    }

    if (typeof args !== 'object') {
      args = {amount: args}
    }

    return this._prompt(PROMPT_INVOICE, args)
  }

  signMessage(message) {
    return Promise.reject("Can't sign message.")
  }

  verifyMessage(signedMessage, rawMessage) {
    return Promise.reject("Can't verify message.")
  }

  _prompt(type, params) {
    if (this._promptActive) return Promise.reject('A prompt is already active.')
    return this._sendMessage({type, ...params})
  }

  _sendMessage(message) {
    return new Promise((resolve, reject) => {
      window.postMessage({...message, application: 'KwH'}, '*')

      function handleWindowMessage(ev) {
        if (!ev.data || ev.data.application !== 'KwH') return

        if (ev.data.error) {
          reject(ev.data.error)
        } else {
          resolve(ev.data.data)
        }

        window.removeEventListener('message', handleWindowMessage)
      }

      window.addEventListener('message', handleWindowMessage)
    })
  }
}

window.webln = new WebLNProvider()
