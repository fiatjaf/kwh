/** @format */

import cuid from 'cuid'

import {getRpcParams} from '../utils'

export function summary() {
  return Promise.all([
    rpcCall('getinfo').then(({blockheight, id, alias, color, address}) => {
      address =
        address.length === 0 ? null : `${address[0].address}:${address[0].port}`

      return {blockheight, id, alias, color, address}
    }),
    rpcCall('listfunds').then(({channels}) => {
      return channels.reduce((acc, ch) => acc + ch.channel_sat, 0)
    }),
    rpcCall('listinvoices').then(({channels}) => {
      return resp.invoices.filter(inv => inv.status === 'paid')
    }),
    rpcCall('listpayments').then(resp => {
      return resp.payments.filter(pay => pay.status === 'complete')
    })
  ]).then(([info, balance, invoices, payments]) => {
    let transactions = invoices
      .map(({paid_at, expires_at, msatoshi, description = ''}) => ({
        date: paid_at || expires_at,
        amount: msatoshi,
        description
      }))
      .slice(-15)
      .concat(
        payments
          .map(({created_at, msatoshi, description, payment_preimage}) => ({
            date: created_at,
            amount: -msatoshi,
            description: description || payment_preimage
          }))
          .slice(-15)
      )
      .sort((a, b) => a.date - b.date)
      .slice(-15)
      .reverse()

    return {info, balance, transactions}
  })
}

export function pay(bolt11, msatoshi = undefined, description = undefined) {
  return rpcCall('pay', {
    bolt11,
    msatoshi,
    label: description
  }).then(({payment_preimage, msatoshi, msatoshi_sent}) => ({
    msatoshi_paid: msatoshi_sent,
    msatoshi_fees: msatoshi_sent - msatoshi,
    preimage: payment_preimage
  }))
}

export function decode(bolt11) {
  return rpcCall('decodepay', [bolt11]).then(
    ({description, msatoshi, payee, payment_hash, expiry, created_at}) => ({
      description,
      msatoshi,
      nodeid: payee,
      hash: payment_hash,
      creation: created_at,
      expiry
    })
  )
}

export function makeInvoice(msatoshi = 'any', description, label = undefined) {
  if (!label) label = `kWh.${cuid.slug()}`
  return rpcCall('invoice', {msatoshi, label, description}).then(
    ({bolt11}) => bolt11
  )
}

export function listenForEvents(defaultCallback) {
  return getRpcParams().then(({endpoint, username, password}) => {
    const es = new EventSource(
      normalizeURL(endpoint) +
        '/stream?access-key=' +
        makeAccessKey(username, password)
    )
    es.onmessage = ev => {
      console.log('got message', ev, ev.data)

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
      }

      // here we send normalized data, not the raw event
      switch (event.type) {
        case 'payment-received':
          defaultCallback({})
      }
    }

    es.onerror = err => {
      console.log('error on eventsource', err)
      listenForEvents(defaultCallback)
    }
  })
}

function rpcCall(method, params = []) {
  return getRpcParams().then(({endpoint, username, password}) => {
    return fetch(normalizeURL(endpoint) + '/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'kwh-extension',
        'X-Access': makeAccessKey(username, password)
      },
      body: JSON.stringify({method, params})
    })
      .then(r => r.json())
      .then(res => {
        if (res.code) {
          throw new Error(res.message || res.code)
        }

        return res
      })
  })
}

function normalizeURL(endpoint) {
  endpoint = endpoint.trim()

  if (endpoint.slice(-4) === '/rpc') {
    return endpoint.slice(0, -4)
  } else {
    return endpoint
  }
}

function makeAccessKey(username, password) {
  return createHmac('sha256', `${username}:${password}`)
    .update('access-key')
    .digest('base64')
    .replace(/\W+/g, '')
}
