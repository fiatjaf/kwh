/** @format */

import React from 'react' // eslint-disable-line
import {QRCode} from 'react-qr-svg'

export default function ShowInvoice({invoice}) {
  return (
    <div className="pa2">
      <QRCode
        bgColor="transparent"
        fgColor="#000000"
        level="Q"
        value={invoice.toUpperCase()}
        className="w-100"
      />
      <p className="code tj wrap">{invoice}</p>
    </div>
  )
}
