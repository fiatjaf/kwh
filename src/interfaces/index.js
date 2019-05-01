/** @format */

import * as lightningd_spark from './lightningd_spark'
import * as eclair from './eclair'
import * as ptarmigan from './ptarmigan'
import {getRpcParams} from '../utils'

const kinds = {
  lightningd_spark,
  eclair,
  ptarmigan
}

export function handleRPC(rpcField = {}) {
  return getRpcParams().then(({kind}) => {
    for (let method in rpcField) {
      let args = rpcField[method]
      console.log(kind, method, args)
      return kinds[kind][method].apply(null, args)
    }
  })
}

export function listenForEvents(callback) {
  return getRpcParams().then(({kind}) => {
    kinds[kind].listenForEvents(callback)
  })
}
