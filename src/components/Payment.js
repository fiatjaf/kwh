/** @format */

import React from 'react' // eslint-disable-line
import {QRCode} from 'react-qr-svg'

export default function Payment({invoice}) {
  return (
    <div>
      <QRCode
        bgColor="transparent"
        fgColor="#000000"
        level="Q"
        style={{width: 256}}
        value={invoice}
      />
      <p>{invoice}</p>
    </div>
  )
}
