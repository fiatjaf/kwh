/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'

function App() {
  let [currentAction, setAction] = useState(null)

  useEffect(() => {
    browser.runtime
      .sendMessage({getPopupAction: true})
      .then(({popupAction}) => {
        setAction(popupAction)
      })
  }, [])

  return <div>Hello {JSON.stringify(currentAction)}</div>
}

render(<App />, document.getElementById('root'))
