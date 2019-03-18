/** @format */

import browser from 'webextension-polyfill'

const Keysim = require('keysim')

import {PROMPT_PAYMENT} from './constants'
import {getOriginData} from './utils'

if (document) {
  // intercept any `lightning:` links
  document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', ev => {
      let target = ev.target
      if (!target || !target.closest) {
        return
      }

      let lightningLink = target.closest('[href^="lightning:"]')
      if (lightningLink) {
        let href = lightningLink.getAttribute('href')
        let invoice = href.replace('lightning:', '')
        browser.runtime.sendMessage({
          setAction: {
            type: PROMPT_PAYMENT,
            origin: getOriginData(),
            invoice
          }
        })
        ev.preventDefault()
      }
    })
  })

  // listen for right-click events to show the context menu item
  // when a potential lightning invoice is selected
  document.addEventListener(
    'mousedown',
    event => {
      // 2 = right mouse button
      if (event.button === 2) {
        var invoice = window.getSelection().toString()
        // if nothing selected, try to get the text of the right-clicked element.
        if (!invoice && event.target) {
          let target = event.target
          invoice = target.innerText || target.value
        }
        if (invoice) {
          // send message to background script to toggle the context menu item
          // based on the content of the right-clicked text
          browser.runtime.sendMessage({
            contextMenu: true,
            invoice
          })
        }
      }
    },
    true
  )

  // paste invoices on specific input fields
  browser.runtime.onMessage.addListener(({paste, elementId, bolt11}) => {
    if (!paste) return

    let el = elementId
      ? browser.contextMenu.getTargetElement(elementId)
      : document.activeElement

    el.focus()

    let keyboard = Keysim.Keyboard.US_ENGLISH
    el.value = bolt11
    keyboard.dispatchEventsForInput(bolt11, el)
  })
}
