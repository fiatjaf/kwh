/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect, useContext, useRef} from 'react' // eslint-disable-line
import ContentEditable from 'react-contenteditable'
import cuid from 'cuid'

import {CurrentContext} from '../popup'
import ShowInvoice from './ShowInvoice'

export default function Invoice() {
  const contentEditable = useRef()

  let {action, tab} = useContext(CurrentContext)

  let defaultAmount =
    action.defaultAmount || action.maximumAmount || action.minimumAmount || 100
  let amountFixed = !!action.amount

  let [bolt11, setBolt11] = useState(action.invoice)
  let [satoshis, setSatoshis] = useState(action.amount || defaultAmount)
  let [desc, setDesc] = useState(
    action.defaultMemo || (action.origin ? action.origin.domain : `KwH invoice`)
  )
  let [invoicePaid, setInvoicePaid] = useState(false)

  useEffect(
    () => {
      if (!bolt11) return

      browser.runtime.onMessage.addListener(handleMessage)
      return () => {
        browser.runtime.onMessage.removeListener(handleMessage)
      }

      function handleMessage(message) {
        if (message.invoicePaid && message.bolt11 === bolt11) {
          setInvoicePaid(true)
        }
      }
    },
    [bolt11]
  )

  function makeInvoice(e) {
    e.preventDefault()

    browser.runtime
      .sendMessage({
        tab,
        rpc: {
          makeInvoice: [satoshis * 1000, desc.replace(/&nbsp;/g, '').trim()]
        },
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
    <div className="lh-copy wrap tl measure w5 pa2">
      {bolt11 ? (
        invoicePaid ? (
          <div className="flex justify-center items-center content-center pb6 pt6">
            <svg
              class="checkmark"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 52 52"
            >
              <circle
                class="checkmark__circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />
              <path
                class="checkmark__check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>
        ) : (
          <ShowInvoice invoice={bolt11} />
        )
      ) : (
        <form onSubmit={makeInvoice}>
          <div>
            Making an invoice of
            {amountFixed ? (
              <span className={inputClasses}>{action.amount}</span>
            ) : (
              <input
                className={inputClasses + ' ml1 mr1 bn bg-transparent w3'}
                value={satoshis}
                onChange={e => setSatoshis(e.target.value)}
                step="10"
                min={action.minimumAmount || 1}
                max={action.maximumAmount || Infinity}
              />
            )}
            satoshis described as{' '}
            <ContentEditable
              innerRef={contentEditable}
              html={desc}
              className={inputClasses + ' bn wrap'}
              onChange={e => setDesc(e.target.value)}
              tagName="span"
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
