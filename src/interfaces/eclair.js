/** @format */

import {getRpcParams, normalizeURL} from '../utils'

const fetch = window.fetch
const WebSocket = window.WebSocket
const URLSearchParams = window.URLSearchParams

export function summary() {
  return Promise.all([
    rpcCall('getinfo').then(
      ({nodeId, alias, blockHeight, publicAddresses}) => ({
        blockheight: blockHeight,
        id: nodeId,
        alias,
        address: publicAddresses.length === 0 ? null : publicAddresses[0]
      })
    ),
    rpcCall('listpendinginvoices'),
    rpcCall('listinvoices'),
    rpcCall('audit').then(({sent}) => sent),
    rpcCall('channels').then(
      channels =>
        channels.reduce(
          (acc, ch) => acc + ch.data.commitments.localCommit.spec.toLocalMsat,
          0
        ) / 1000
    )
  ]).then(([info, pendingInvoices, allInvoices, payments, balance]) => {
    let invoices = allInvoices
      .filter(inv => {
        for (let i = 0; i < pendingInvoices.length; i++) {
          let pinv = pendingInvoices[i]
          if (inv.paymentHash === pinv.paymentHash) {
            return false
          }
        }
        return true
      })
      .slice(0, 15)
      .map(({amount, timestamp, description}) => ({
        amount,
        description,
        date: timestamp
      }))

    payments = payments.map(({amount, feesPaid, paymentHash, timestamp}) => ({
      date: timestamp / 1000,
      amount: -amount,
      description: paymentHash,
      fees: feesPaid
    }))

    return {
      info,
      balance,
      transactions: invoices
        .concat(payments)
        .sort((a, b) => b.date - a.date)
        .slice(0, 15)
    }
  })
}

export function pay(bolt11, msatoshi) {
  if (!msatoshi) {
    msatoshi = undefined
  }

  return rpcCall('payinvoice', {invoice: bolt11, amountMsat: msatoshi}).then(
    callId => {
      return new Promise(resolve => {
        eventCallbacks[callId] = ({amount, feesPaid, paymentPreimage}) =>
          resolve({
            msatoshi_paid: amount,
            msatoshi_fees: feesPaid,
            preimage: paymentPreimage
          })
      })
    }
  )
}

export function decode(bolt11) {
  return rpcCall('parseinvoice', {invoice: bolt11}).then(
    ({description, amount, nodeId, paymentHash, expiry, timestamp}) => ({
      description,
      msatoshi: amount,
      nodeid: nodeId,
      hash: paymentHash,
      creation: timestamp,
      expiry
    })
  )
}

export function makeInvoice(msatoshi, description) {
  return rpcCall('createinvoice', {
    amountMsat: msatoshi,
    description
  }).then(({serialized, paymentHash}) => ({
    bolt11: serialized,
    hash: paymentHash
  }))
}

var eventCallbacks = {}

export function listenForEvents(defaultCallback) {
  return getRpcParams().then(({endpoint, password}) => {
    const ws = new WebSocket(
      normalizeURL(endpoint)
        .replace('://', '://:' + password + '@')
        .replace('http', 'ws') + '/ws'
    )

    ws.onmessage = ev => {
      var event
      try {
        event = JSON.parse(ev.data)
      } catch (e) {
        console.log('failed to parse websocket event', ev)
        return
      }

      // specific callbacks registered for this event
      if (eventCallbacks[event.id]) {
        eventCallbacks[event.id](event)
        delete eventCallbacks[event.id]
      }

      // here we send normalized data, not the raw event
      switch (event.type) {
        case 'payment-received':
          defaultCallback('payment-received', {
            amount: event.amount,
            description: event.description,
            hash: event.paymentHash
          })
      }
    }

    ws.onclose = ev => {
      console.log('websocket closed', ev)
      setTimeout(() => {
        listenForEvents(defaultCallback)
      }, 5000)
    }

    ws.onerror = ev => {
      console.log('error on websocket', ev)
    }
  })
}

function rpcCall(method, params = {}) {
  return getRpcParams().then(({endpoint, password}) => {
    let urlparams = new URLSearchParams()

    for (let k in params) {
      if (typeof params[k] === 'undefined') continue
      urlparams.append(k, params[k])
    }

    return fetch(normalizeURL(endpoint) + '/' + method, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: 'Basic ' + window.btoa(':' + password)
      },
      body: urlparams.toString()
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) {
          throw new Error(res.error)
        }

        return res
      })
  })
}
