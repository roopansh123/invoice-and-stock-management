import React from 'react';

const fmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  const rupees = Math.floor(num);
  const paise  = Math.round((num - rupees) * 100);
  let result   = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

export default function CashBillPrint({ invoice }) {
  if (!invoice) return null;

  let company = {};
  try { company = JSON.parse(localStorage.getItem('rfi_company') || '{}'); } catch {}
  const co = {
    name:    company.name    || 'Ram Footware Industries',
    address: company.address || '313/13E, Ground Floor, Inder Lok, New Delhi - 110035',
    phone:   company.phone   || '9810000000',
    gstin:   company.gstin   || '07XXXXXXXXXXXXXXX',
  };

  const c       = invoice.customerSnapshot || {};
  const dateStr = new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const items   = invoice.items || [];
  const totalCrtn = items.reduce((s, i) => s + (Number(i.bags) || 0), 0);
  const totalPkg  = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  const border = '1px solid #000';
  const cell   = { border, padding: '4px 6px', fontSize: '11px', verticalAlign: 'middle' };
  const th     = { border, padding: '5px 6px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', background: '#f5f5f5' };
  const tbl    = { width: '100%', borderCollapse: 'collapse' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', background: '#fff', padding: '20px', maxWidth: '780px', margin: '0 auto' }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>BILL (CASH)</div>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>{co.name}</div>
        <div style={{ fontSize: '10px', color: '#444' }}>{co.address} | Tel: {co.phone}</div>
      </div>

      {/* Invoice meta */}
      <table style={tbl}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: '50%', lineHeight: '1.9' }}>
              <div><strong>Invoice No. :</strong> {invoice.invoiceNumber}</div>
              <div><strong>Party Name &nbsp;:</strong> {c.name || '—'}</div>
              <div><strong>Address &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {c.address?.city || c.address?.state || 'Delhi'}</div>
            </td>
            <td style={{ ...cell, width: '50%', lineHeight: '1.9' }}>
              <div><strong>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {dateStr}</div>
              <div><strong>GR No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;</div>
              <div><strong>Transporter :</strong> Self</div>
              <div><strong>Remarks &nbsp;&nbsp;&nbsp;&nbsp;:</strong> {invoice.notes || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items table */}
      <table style={{ ...tbl, marginTop: '0' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '5%' }}>SN</th>
            <th style={{ ...th, textAlign: 'left', width: '35%' }}>DESCRIPTION OF GOODS</th>
            <th style={{ ...th, width: '10%' }}>CRTN</th>
            <th style={{ ...th, width: '10%' }}>PKG</th>
            <th style={{ ...th, width: '10%' }}>QTY.</th>
            <th style={{ ...th, width: '15%' }}>RATE</th>
            <th style={{ ...th, width: '15%' }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const crtn = Number(item.bags) || 0;
            const pkg  = Number(item.quantity) || 0;
            const qty  = pkg;
            const amt  = item.taxableAmount || (item.unitPrice * qty);
            return (
              <tr key={i}>
                <td style={{ ...cell, textAlign: 'center' }}>{i + 1}</td>
                <td style={cell}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  {item.size && <div style={{ fontSize: '10px', color: '#555' }}>Size: {item.size}{item.sku ? ' | SKU: ' + item.sku : ''}</div>}
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>{crtn > 0 ? crtn : '—'}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{pkg}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{qty}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{fmt(amt)}</td>
              </tr>
            );
          })}
          {/* Padding rows */}
          {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
            <tr key={'e' + i}>
              <td style={{ ...cell, height: '24px' }}>&nbsp;</td>
              {[1,2,3,4,5,6].map(x => <td key={x} style={cell}></td>)}
            </tr>
          ))}
          {/* Grand Total */}
          <tr style={{ background: '#f0f0f0' }}>
            <td colSpan={2} style={{ ...cell, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>GRAND TOTAL</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 'bold' }}>{totalCrtn > 0 ? totalCrtn : '—'}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 'bold' }}>{totalPkg}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 'bold' }}>{totalPkg}</td>
            <td style={cell}></td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{fmt(invoice.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <table style={tbl}>
        <tbody>
          <tr>
            <td style={{ ...cell, fontStyle: 'italic' }}>
              <strong>{numberToWords(invoice.grandTotal)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <table style={{ ...tbl, marginTop: '0' }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: '60%', lineHeight: '1.8' }}>
              <strong>Terms &amp; Conditions</strong><br />
              1. Goods once sold will not be taken back.<br />
              2. Subject to Delhi Jurisdiction only.
            </td>
            <td style={{ ...cell, width: '20%', textAlign: 'center', height: '60px', verticalAlign: 'bottom' }}>
              <div><strong>Receiver's Signature</strong></div>
            </td>
            <td style={{ ...cell, width: '20%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
                <strong>For {co.name}</strong><br />
                <em>Auth. Signatory</em>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
