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
import {sprint} from './utils'

export const CurrentContext = React.createContext({action: null, tab: null})

function App() {
  let [currentAction, setAction] = useState(null)
  let [proxiedTab, setProxiedTab] = useState(null)

  useEffect(() => {
    // when this page is rendered, query the current action
    browser.runtime.sendMessage({getInit: true}).then(({action, tab}) => {
      console.log(`[action]: ${sprint(action)} tab=${tab.id}`)
      setAction(action)
      setProxiedTab(tab)
    })

    // if this page is already opened when a new action is set, react to it
    browser.runtime.onMessage.addListener(newActionListener)
    return () => browser.runtime.onMessage.removeListener(newActionListener)
    function newActionListener(message) {
      if (message.setAction) {
        console.log(`[action]: ${JSON.stringify(message.setAction)}`)
        setAction(message.setAction)
      }
    }
  }, [])

  if (!proxiedTab) return <div />

  function navigate(e) {
    e.preventDefault()
    navigateTo(e.target.dataset.action)
  }

  function navigateTo(type) {
    let action = {type}
    setAction(action)
    browser.runtime.sendMessage({setAction: action, tab: proxiedTab})
  }

  var selectedMenu
  var page = <div />
  switch (currentAction && currentAction.type) {
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
      page = <Payment />
      break
    case MAKE_INVOICE:
    case PROMPT_INVOICE:
      selectedMenu = MAKE_INVOICE
      page = <Invoice />
      break
    case PROMPT_ENABLE:
      page = <Enable />
      break
  }

  let navItemClasses = 'link dim f6 dib pointer ma2 pa2 bg-animate'
  let activeNavItemClasses = ' b green bg-light-yellow'

  return (
    <main className="bg-washed-green pb4 pr1 pl1 black-70 sans-serif">
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
      <CurrentContext.Provider value={{tab: proxiedTab, action: currentAction}}>
        <div className="w6">{page}</div>
      </CurrentContext.Provider>
    </main>
  )
}

render(<App />, document.getElementById('root'))
