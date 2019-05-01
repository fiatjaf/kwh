/** @format */

import {getRpcParams, normalizeURL} from '../utils'

const fetch = window.fetch

export function summary() {
  return Promise.all([
    rpcCall('getinfo'),
    rpcCall('listpayments').then(pmts =>
      pmts.filter(pmt => pmt.state === 'succeeded').slice(-15)
    )
  ])
    .then(([info, payments]) =>
      Promise.all([
        info,
        payments,
        Promise.all(payments.map(pmt => pmt.invoice).map(decode))
      ])
    )
    .then(([{node_id, total_local_msat}, payments, decodedpayments]) => ({
      info: {
        id: node_id
      },
      balance: total_local_msat / 1000,
      transactions: payments
        .map((pmt, i) => ({
          date: decodedpayments[i].creation,
          amount: -decodedpayments[i].msatoshi,
          fees: pmt.additional_amount_msat,
          description: decodedpayments[i].description
        }))
        .sort((a, b) => b.date - a.date)
        .slice(0, 15)
    }))
}

export function pay(bolt11, msatoshi = undefined, description = undefined) {
  return rpcCall('sendpayment', {bolt11}).then(() => {
    /* missing something, this API returns no result */
  })
}

export function decode(bolt11) {
  return rpcCall('decodeinvoice', {bolt11}).then(
    ({
      description_string,
      payment_hash,
      pubkey,
      amount_msat,
      expiry,
      timestamp
    }) => ({
      description: description_string,
      msatoshi: amount_msat,
      nodeid: pubkey,
      hash: payment_hash,
      creation: Date.parse(timestamp) / 1000,
      expiry
    })
  )
}

export function makeInvoice(msatoshi, description) {
  return rpcCall('createinvoice', {amountMsat: msatoshi}).then(
    ({bolt11, hash}) => ({bolt11, hash})
  )
}

export function listenForEvents() {
  /* not yet supported by ptarmigan rest api */
}

function rpcCall(method, params = {}) {
  return getRpcParams().then(({endpoint, username, password}) => {
    return fetch(normalizeURL(endpoint) + '/' + method, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(params)
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) {
          throw new Error(res.error.message || res.error.code)
        }

        return res.result
      })
  })
}
