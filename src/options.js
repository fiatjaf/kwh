/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'
import debounce from 'debounce-with-args'

import {getRpcParams, defaultRpcParams} from './utils'
import {defs} from './interfaces'

export function RPCParams() {
  let [options, setOptions] = useState(defaultRpcParams)
  let [initialValues, setInitialValues] = useState(defaultRpcParams)
  let [saved, setSaved] = useState(false)

  useEffect(() => {
    getRpcParams().then(values => {
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

  var currentInterface
  for (let i = 0; i < defs.length; i++) {
    if (defs[i].value === options.kind) {
      currentInterface = defs[i]
      break
    }
  }

  return (
    <div className="flex flex-column items-center pa2 lh-copy f5 black-70">
      <div className="flex">
        {defs.map(({label: labelName, value}) => (
          <label className="flex flex-column items-center mh3" key={labelName}>
            {labelName}{' '}
            <input
              type="checkbox"
              name="kind"
              value={value}
              onChange={handleChange}
              checked={currentInterface.value === value}
            />
          </label>
        ))}
      </div>

      <header className="measure-narrow tc">
        <h1 className="f6 ma3 tc">{currentInterface.title}</h1>
        <p className="f7 ma0 mb2 dark-pink">{currentInterface.subtitle}</p>
      </header>
      <div>
        {currentInterface.fields.map(attr => (
          <div className="ma1 pa1" key={attr}>
            <label className="flex align-center items-center justify-between">
              <span className="pa1 tr">{attr}: </span>
              <input
                type={
                  options[attr] !== initialValues[attr]
                    ? 'text'
                    : attr === 'password'
                      ? 'password'
                      : 'text'
                }
                className="input-reset bn pa1 flex-auto black-70 bg-light-yellow"
                value={options[attr]}
                name={attr}
                onChange={handleChange}
              />
            </label>
          </div>
        ))}
        <div className={'pa2 di fr hide dark-pink ' + (saved ? 'show' : '')}>
          saved!
        </div>
      </div>
    </div>
  )
}

function App() {
  return <RPCParams />
}

render(<App />, document.getElementById('root'))
