/** @format */

import {getRpcParams, backoff, normalizeURL} from '../utils'

const fetch = window.fetch

export function getInfo() {
  return rpcCall('getinfo').then(info => ({id: info.node_id}))
}

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

export function pay(bolt11, msatoshi = undefined) {
  if (!msatoshi) msatoshi = 0

  return rpcCall(
    'sendpayment',
    {bolt11, addAmountMsat: msatoshi} /* returns just a payment id */
  )
    .then((
      {payment_id} /* queyr listpayments until we get a success or error */
    ) =>
      backoff(() =>
        rpcCall('listpayments').then(payments => {
          for (let i = 0; i < payments.length; i++) {
            let payment = payments[i]
            if (payment.payment_id !== payment_id) continue

            // if still processing, reject promise so backoff continues trying
            if (payment.state === 'processing') {
              return Promise.reject(payment)
            }

            // finished processing, return, but payment may have failed
            return Promise.resolve(payment)
          }

          // payment not found, return null
          return Promise.resolve(null)
        })
      )
    )
    .then(payment => {
      // post process
      if (payment === null) throw new Error('Payment not found.')
      if (payment.state === 'failed') throw new Error('Payment failed.')
      return Promise.all([payment, decode(payment.invoice)])
    })
    .then(([payment, decoded]) => ({
      msatoshi_paid: decoded.msatoshi,
      msatoshi_fees: payment.additional_amount_msat,
      preimage: payment.preimage
    }))
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

// not yet supported on ptarmigan
export function eventsCleanup() {}
export function listenForEvents() {}

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
