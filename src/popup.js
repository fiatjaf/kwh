/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'

import {NOTHING, PROMPT_PAYMENT} from './constants'
import Nothing from './components/Nothing'
import Payment from './components/Payment'

function App() {
  let [currentAction, setAction] = useState({type: NOTHING})

  useEffect(() => {
    browser.runtime
      .sendMessage({getPopupAction: true})
      .then(({popupAction}) => {
        setAction(popupAction)
      })
  }, [])

  var page = <div />
  switch (currentAction.type) {
    case NOTHING:
      return <Nothing />
    case PROMPT_PAYMENT:
      return <Payment invoice={currentAction.args.invoice} />
  }
  return page
}

render(<App />, document.getElementById('root'))
