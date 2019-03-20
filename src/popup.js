/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'

import {
  BLANK,
  HOME,
  PROMPT_PAYMENT,
  MAKE_INVOICE,
  PROMPT_INVOICE,
  MAKE_PAYMENT,
  PROMPT_ENABLE
} from './constants'
import Home from './components/Home'
import Payment from './components/Payment'
import Invoice from './components/Invoice'
import Enable from './components/Enable'

function App() {
  let [currentAction, setAction] = useState({type: BLANK})

  useEffect(() => {
    // when this page is rendered, query the current action
    browser.runtime.sendMessage({getCurrentAction: true}).then(({action}) => {
      setAction(action)
    })

    // if this page is already opened when a new action is set, react to it
    browser.runtime.onMessage.addListener(newActionListener)
    return () => browser.runtime.onMessage.removeListener(newActionListener)
    function newActionListener(message) {
      if (message.setAction) {
        setAction(message.setAction)
      }
    }
  }, [])

  function navigate(e) {
    e.preventDefault()
    navigateTo(e.target.dataset.action)
  }

  function navigateTo(type) {
    let action = {type}
    setAction(action)
    browser.runtime.sendMessage({setAction: action})
  }

  var selectedMenu
  var page = <div />
  switch (currentAction.type) {
    case BLANK:
      page = <div />
      break
    case HOME:
      selectedMenu = HOME
      page = <Home />
      break
    case MAKE_PAYMENT:
    case PROMPT_PAYMENT:
      selectedMenu = MAKE_PAYMENT
      page = (
        <Payment
          origin={currentAction.origin}
          invoice={currentAction.invoice}
        />
      )
      break
    case MAKE_INVOICE:
    case PROMPT_INVOICE:
      selectedMenu = MAKE_INVOICE
      page = (
        <Invoice
          invoice={currentAction.invoice}
          pasteOn={currentAction.pasteOn}
          amount={currentAction.amount}
          defaultAmount={currentAction.defaultAmount}
          minimumAmount={currentAction.minimumAmount}
          maximumAmount={currentAction.maximumAmount}
          defaultMemo={currentAction.defaultMemo}
        />
      )
      break
    case PROMPT_ENABLE:
      page = <Enable origin={currentAction.origin} />
      break
  }

  let navItemClasses = 'link dim f6 dib pointer ma2 pa2'
  let activeNavItemClasses = ' b white bg-gold'

  return (
    <main className="bg-washed-green pa4 black-70">
      <nav className="pa1 flex justify-between">
        <a
          className={
            navItemClasses + (selectedMenu === HOME ? activeNavItemClasses : '')
          }
          data-action={HOME}
          onClick={navigate}
        >
          Home
        </a>
        <a
          className={
            navItemClasses +
            (selectedMenu === MAKE_INVOICE ? activeNavItemClasses : '')
          }
          data-action={MAKE_INVOICE}
          onClick={navigate}
        >
          Invoice
        </a>
        <a
          className={
            navItemClasses +
            (selectedMenu === MAKE_PAYMENT ? activeNavItemClasses : '')
          }
          data-action={MAKE_PAYMENT}
          onClick={navigate}
        >
          Pay
        </a>
      </nav>
      <div className="w6">{page}</div>
    </main>
  )
}

render(<App />, document.getElementById('root'))
