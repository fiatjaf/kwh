/** @format */

import {
  PROMPT_PAYMENT,
  PROMPT_INVOICE,
  REQUEST_GETINFO
} from './constants'

class WebLNProvider {
  enable() {
    return this._sendMessage({getBlocked: true}).then(blocked => {
      if (blocked) {
        throw new Error('webln acess is blocked on this domain.')
      }

      return true
    })
  }

  getInfo() {
    return this.enable()
      .then(() => this._prompt(REQUEST_GETINFO))
      .then(info => ({
        node: {
          alias: info.alias,
          pubkey: info.id,
          color: info.color
        }
      }))
  }

  sendPayment(invoice) {
    return this.enable()
      .then(() => this._prompt(PROMPT_PAYMENT, {invoice}))
      .then(preimage => ({preimage}))
  }

  makeInvoice(args) {
    return this.enable().then(() => {
      if (typeof args !== 'object') {
        args = {amount: args}
      }
      return this._prompt(PROMPT_INVOICE, args).then(bolt11 => ({
        paymentRequest: bolt11
      }))
    })
  }

  signMessage(message) {
    return Promise.reject("Can't sign message.")
  }

  verifyMessage(signedMessage, rawMessage) {
    return Promise.reject("Can't verify message.")
  }

  _prompt(type, params) {
    return this._sendMessage({type, ...params})
  }

  _sendMessage(message) {
    return new Promise((resolve, reject) => {
      window.postMessage({...message, application: 'KwH'}, '*')

      function handleWindowMessage(ev) {
        if (!ev.data || ev.data.application !== 'KwH' || !ev.data.response) {
          return
        }

        if (ev.data.error) {
          reject(new Error(ev.data.error))
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
