/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect, useContext} from 'react' // eslint-disable-line
import friendlyTime from 'friendly-time'

import {CurrentContext} from '../popup'
import {formatmsat} from '../utils'

export default function Home() {
  let {tab} = useContext(CurrentContext)

  let [summary, setSummary] = useState({info: {}})
  let [blocked, setBlocked] = useState({})

  useEffect(() => {
    browser.runtime.sendMessage({tab, rpc: {summary: []}}).then(setSummary)
    browser.runtime.sendMessage({tab, getBlocked: true}).then(setBlocked)
  }, [])

  function unblock(e) {
    e.preventDefault()
    let domain = e.target.dataset.domain
    browser.storage.local.get('blocked').then(({blocked}) => {
      delete blocked[domain]
      return browser.storage.local.set({blocked}).then(() => {
        setBlocked(blocked)
      })
    })
  }

  return (
    <div>
      <h1 className="headlineH1">Balance</h1>
      <div className="f5 tc dark-pink b">{summary.balance || '~'} satoshi</div>
      <h1 className="headlineH1">Latest transactions</h1>
      <div className="flex justify-center">
        <table className="f">
          <tbody>
            {(summary.transactions || []).map((tx, i) => (
              <tr key={i} className="bg-light-yellow hover-bg-light-pink">
                <td className="pa1 f7">{formatDate(tx.date)}</td>
                <td
                  className={
                    'code tr pa1 f7 ' + (tx.amount < 0 ? 'dark-pink' : 'green')
                  }
                  title={
                    tx.fees !== undefined
                      ? `+ ${formatmsat(tx.fees)} (fees)`
                      : null
                  }
                >
                  {formatmsat(tx.amount)}
                </td>
                <td className="pa1 f7" title={tx.description}>
                  {tx.description.length > 17
                    ? tx.description.slice(0, 16) + '…'
                    : tx.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h1 className="headlineH1">Node</h1>
      <div
        style={{border: `5px solid #${summary.info.color || 'ffffff'}`}}
        className="infoNode"
      >
        <table>
          <tbody>
            {['alias', 'id', 'address', 'blockheight']
              .map(attr => [attr, summary.info[attr]])
              .filter(([_, v]) => v)
              .map(([attr, val]) => (
                <tr key={attr}>
                  <td className="lh-title b tr dark-pink">{attr}</td>
                  <td className="wrap code lh-copy measure-narrow">
                    {summary.info[attr]}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {Object.keys(blocked).length > 0 && (
        <>
          <h1 className="headlineH1">Blacklist</h1>
          <div>
            <table>
              <tbody>
                {Object.keys(blocked)
                  .map(domain => [domain, blocked[domain]])
                  .map(([domain, _]) => (
                    <tr key={domain}>
                      <td className="lh-title b tr dark-pink">{domain}</td>
                      <td>
                        <button
                          className="di bg-animate bg-light-gray bn button-reset f7 hover-bg-dark-gray pa1 pointer gray hover-white"
                          onClick={unblock}
                          data-domain={domain}
                        >
                          allow
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const now = Date.now()
function formatDate(timestamp) {
  let date = new Date(timestamp * 1000)
  if (timestamp * 1000 + 86400 * 1000 * 2 < now) {
    return date.toISOString().split('T')[0]
  }

  return friendlyTime(date)
}
