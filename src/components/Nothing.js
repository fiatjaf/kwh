/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line

export default function Nothing() {
  let [invoices, setInvoices] = useState([])
  let [payments, setPayments] = useState([])

  useEffect(() => {
    browser.runtime
      .sendMessage({rpc: true, method: 'listinvoices'})
      .then(resp => {
        setInvoices(resp.invoices)
      })
    browser.runtime
      .sendMessage({rpc: true, method: 'listpayments'})
      .then(resp => {
        setPayments(resp.payments)
      })
  }, [])

  let transactions = invoices
    .map(({paid_at, expires_at, msatoshi}) => ({
      date: paid_at || expires_at,
      amount: msatoshi
    }))
    .concat(
      payments.map(({created_at, msatoshi}) => ({
        date: created_at,
        amount: -msatoshi
      }))
    )

  return (
    <div>
      <h1>Latest transactions</h1>
      <table>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={i}>
              <td>{tx.date}</td>
              <td>{tx.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
