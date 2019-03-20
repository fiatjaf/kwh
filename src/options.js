/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'
import {useDebounce} from 'use-debounce'

const defaultOptions = {
  endpoint: 'http://localhost:9737/rpc',
  username: '',
  password: ''
}

function App() {
  let [currentOptions, setOptions] = useState(defaultOptions)
  let [options] = useDebounce(currentOptions, 1500)
  let [saved, setSaved] = useState(false)

  useEffect(() => {
    browser.storage.local.get(defaultOptions).then(setOptions)
  }, [])

  useEffect(
    () => {
      var proceed = false
      for (let k in defaultOptions) {
        if (options[k] !== defaultOptions[k]) {
          proceed = true
          break
        }
      }
      if (!proceed) return

      browser.storage.local.set(options).then(() => {
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
        }, 2500)
      })
    },
    [options]
  )

  function handleChange(e) {
    let k = e.target.name
    let v = e.target.value.trim()
    setOptions({...options, [k]: v})
  }

  return (
    <div className="flex flex-column ma2 lh-copy f5 sans-serif black-70">
      {[
        ['Spark URL', 'endpoint'],
        ['Spark username', 'username'],
        ['Spark password', 'password']
      ].map(([label, attr]) => (
        <div className="ma1 pa1">
          <label className="flex align-center items-center justify-between">
            <span className="w4 pa1 tr">{label}: </span>
            <input
              className="pa1 flex-auto black-70"
              value={currentOptions[attr]}
              name={attr}
              onChange={handleChange}
            />
          </label>
        </div>
      ))}
      <div className={'pa2 di tr hide ' + (saved ? 'show' : '')}>saved!</div>
    </div>
  )
}

render(<App />, document.getElementById('root'))
