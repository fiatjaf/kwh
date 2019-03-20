/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import AutosizeInput from 'react-input-autosize'
import cuid from 'cuid'

import ShowInvoice from './ShowInvoice'

export default function Invoice({invoice, pasteOn}) {
  let [bolt11, setBolt11] = useState(invoice)
  let [satoshis, setSatoshis] = useState(100)
  let [desc, setDesc] = useState('Generated on KwH')

  function makeInvoice(e) {
    e.preventDefault()

    browser.runtime
      .sendMessage({
        rpc: true,
        method: 'invoice',
        params: [satoshis * 1000, `KwH.${cuid.slug()}`, desc],
        behaviors: {
          success: [
            'paste-invoice',
            'return-invoice',
            'cleanup-browser-action'
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
            <AutosizeInput
              type="number"
              className={inputClasses}
              value={satoshis}
              onChange={e => setSatoshis(e.target.value)}
              step="1"
              min="1"
              max={Infinity}
            />
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
