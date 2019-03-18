/** @format */

import browser from 'webextension-polyfill'
import React, {useState, useEffect} from 'react' // eslint-disable-line
import {render} from 'react-dom'
import {useDebounce} from 'use-debounce'

const defaultOptions = {
  endpoint: '',
  username: '',
  password: ''
}

function App() {
  let [currentOptions, setOptions] = useState(defaultOptions)
  let [options] = useDebounce(currentOptions, 1500)

  useEffect(() => {
    browser.storage.local.get(defaultOptions).then(setOptions)
  }, [])

  useEffect(
    () => {
      browser.storage.local.set(options)
    },
    [options]
  )

  function handleChange(e) {
    let k = e.target.name
    let v = e.target.value
    setOptions({...options, [k]: v})
  }

  return (
    <div>
      <div>
        <label>
          Spark URL:{' '}
          <input
            value={currentOptions.endpoint}
            name="endpoint"
            onChange={handleChange}
          />
        </label>
      </div>
      <div>
        <label>
          Username:{' '}
          <input
            value={currentOptions.username}
            name="username"
            onChange={handleChange}
          />
        </label>
      </div>
      <div>
        <label>
          Password:{' '}
          <input
            value={currentOptions.password}
            name="password"
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  )
}

render(<App />, document.getElementById('root'))
