/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'
import debounce from 'debounce-with-args'

const defaultOptions = {
  endpoint: 'http://localhost:9737/rpc',
  username: '',
  password: ''
}

function App() {
  let [options, setOptions] = useState(defaultOptions)
  let [initialValues, setInitialValues] = useState(defaultOptions)
  let [saved, setSaved] = useState(false)

  useEffect(() => {
    browser.storage.local.get(defaultOptions).then(values => {
      setOptions(values)
      setInitialValues(values)
    })
  }, [])

  const saveOptions = debounce(
    function(newValues) {
      browser.storage.local.set(newValues).then(() => {
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
        }, 2500)
      })
    },
    900,
    () => 'options'
  )

  function handleChange(e) {
    let k = e.target.name
    let v = e.target.value.trim()
    let newValues = {...options, [k]: v}
    setOptions(newValues)
    saveOptions(newValues)
  }

  return (
    <div className="flex flex-column ma2 lh-copy f5 sans-serif black-70">
      {[
        ['Spark URL', 'endpoint', 'text'],
        ['Spark username', 'username', 'text'],
        ['Spark password', 'password', 'password']
      ].map(([label, attr, type]) => (
        <div className="ma1 pa1" key={attr}>
          <label className="flex align-center items-center justify-between">
            <span className="w4 pa1 tr">{label}: </span>
            <input
              type={options[attr] !== initialValues[attr] ? 'text' : type}
              className="pa1 flex-auto black-70"
              value={options[attr]}
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
