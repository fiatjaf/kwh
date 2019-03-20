/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line

export default function Enable({origin}) {
  function authorize(e) {
    e.preventDefault()
    browser.runtime.sendMessage({
      triggerBehaviors: true,
      behaviors: ['allow-enable-domain', 'navigate-home']
    })
    window.close()
  }

  function cancel(e) {
    e.preventDefault()
    browser.runtime.sendMessage({
      triggerBehaviors: true,
      behaviors: ['reject-enable', 'navigate-home']
    })
    window.close()
  }

  return (
    <div>
      <div className="flex justify-center pa2">
        <img src={origin.icon || ''} className="ma1 w-25 h-25" />
        <div className="ma1 h-25 w-25 flex justify-center items-center content-center f2 light-pink">
          ⇄
        </div>
        <img
          src={browser.runtime.getURL('icon128-active.png')}
          className="ma1 w-25 h-25"
        />
      </div>
      <p className="f4 tc pa2">
        <span className="b">{origin.name || origin.domain}</span> wants to
        connect.
      </p>
      <div className="flex justify-between">
        <button
          onClick={cancel}
          className="db bg-animate bg-light-gray bn button-reset f6 hover-bg-dark-gray ma2 p2 pa2 pointer gray hover-white"
        >
          Reject
        </button>
        <button
          onClick={authorize}
          className="db bg-animate bg-light-pink bn button-reset f6 hover-bg-gold ma2 p2 pa2 pointer white"
        >
          Authorize
        </button>
      </div>
    </div>
  )
}
