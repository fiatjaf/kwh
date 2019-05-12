/** @format */

import React from 'react' // eslint-disable-line

import * as lightningd_spark from './lightningd_spark'
import * as eclair from './eclair'
import * as ptarmigan from './ptarmigan'
import {getRpcParams, structuredprint} from '../utils'

const kinds = {
  lightningd_spark,
  eclair,
  ptarmigan
}

export const defs = [
  {
    label: 'lightningd',
    value: 'lightningd_spark',
    title: 'Spark RPC Server',
    subtitle: (
      <>
        Set up a <a href="https://github.com/shesek/spark-wallet">Spark</a>{' '}
        <a href="https://github.com/fiatjaf/sparko">RPC endpoint</a> server tied
        to your c-lightning node.
      </>
    ),
    fields: ['endpoint', 'username', 'password']
  },
  {
    label: 'Eclair',
    value: 'eclair',
    title: 'Eclair HTTP API',
    subtitle: (
      <>
        Use Eclair >=0.3 and{' '}
        <a href="https://github.com/ACINQ/eclair#configuring-eclair">
          enable the API in the configuration
        </a>{' '}
        so kWh can talk to it.
      </>
    ),
    fields: ['endpoint', 'password']
  },
  {
    label: 'Ptarmigan',
    value: 'ptarmigan',
    title: 'Ptarmigan REST API',
    subtitle: (
      <>
        Start the{' '}
        <a href="https://github.com/nayutaco/ptarmigan/blob/master/docs/howtouse_rest_api.md">
          REST API application
        </a>{' '}
        for your Ptarmigan node and paste the URL here.
      </>
    ),
    fields: ['endpoint']
  }
]

export function handleRPC(rpcField = {}) {
  return getRpcParams().then(({kind}) => {
    for (let method in rpcField) {
      let args = rpcField[method]
      console.log(`[rpc][${kind}]: ${method} ${structuredprint(args)}`)
      return kinds[kind][method].apply(null, args)
    }
  })
}

var currentListener

export function listenForEvents(callback) {
  return getRpcParams().then(({kind}) => {
    if (currentListener) {
      console.log(`[stop-listening][${currentListener}]`)
      kinds[currentListener].cleanupListener()
    }

    console.log(`[listening][${kind}]`)
    let startListening = kinds[kind].listenForEvents(callback)
    Promise.all([startListening, kind]).then(([ok, kind]) => {
      if (ok) {
        currentListener = kind
      }
    })
  })
}
