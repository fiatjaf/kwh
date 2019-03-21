/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect, useContext} from 'react' // eslint-disable-line
import AutosizeInput from 'react-input-autosize'
import cuid from 'cuid'

import {CurrentContext} from '../popup'
import ShowInvoice from './ShowInvoice'

export default function Invoice() {
  let {action, tab} = useContext(CurrentContext)

  let defaultAmount =
    action.defaultAmount || action.maximumAmount || action.minimumAmount || 100
  let amountFixed = !!action.amount

  let [bolt11, setBolt11] = useState(action.invoice)
  let [satoshis, setSatoshis] = useState(action.amount || defaultAmount)
  let [desc, setDesc] = useState(
    action.defaultMemo || `KwH invoice on ${action.origin.domain}`
  )

  function makeInvoice(e) {
    e.preventDefault()

    browser.runtime
      .sendMessage({
        tab,
        rpc: true,
        method: 'invoice',
        params: [satoshis * 1000, `KwH.${cuid.slug()}`, desc],
        behaviors: {
          success: [
            'paste-invoice',
            'return-invoice',
            'cleanup-browser-action',
            'save-invoice-to-current-action'
          ],
          failure: ['notify-invoice-error', 'cleanup-browser-action']
        }
      })
      .then(({bolt11}) => {
        setBolt11(bolt11)
      })
  }

  let inputClasses = 'dark-pink hover-gold code b f6 bg-transparent pa1'

  return (
    <div className="w-100">
      {bolt11 ? (
        <ShowInvoice invoice={bolt11} />
      ) : (
        <form onSubmit={makeInvoice}>
          <div className="ln-copy">
            Generating an invoice of
            {amountFixed ? (
              <span className={inputClasses}>{action.amount}</span>
            ) : (
              <AutosizeInput
                type="number"
                className={inputClasses}
                value={satoshis}
                onChange={e => setSatoshis(e.target.value)}
                step="1"
                min={action.minimumAmount || 1}
                max={action.maximumAmount || Infinity}
              />
            )}
            satoshis described as{' '}
            <AutosizeInput
              className={inputClasses}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
            .
          </div>
          <div className="flex justify-end">
            <button className="db bg-animate bg-light-pink bn button-reset f6 hover-bg-gold ma2 p2 pa2 pointer white">
              Generate
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
