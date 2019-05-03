/** @format */

import * as lightningd_spark from './lightningd_spark'
import * as eclair from './eclair'
import * as ptarmigan from './ptarmigan'
import {getRpcParams, structuredprint} from '../utils'

const kinds = {
  lightningd_spark,
  eclair,
  ptarmigan
}

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
