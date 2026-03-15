import React from 'react';
import CashBillPrint from './CashBillPrint';

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
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

function getHSNSummary(items, saleType) {
  const map = {};
  items.forEach(item => {
    const hsn = item.hsn || '6403';
    const rate = item.gstRate || 5;
    const key = hsn + '_' + rate;
    if (!map[key]) map[key] = { hsn, rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    map[key].taxable += item.taxableAmount || 0;
    map[key].cgst    += item.cgst || 0;
    map[key].sgst    += item.sgst || 0;
    map[key].igst    += item.igst || 0;
    map[key].total   += (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
  });
  return Object.values(map);
}

// Display unit label for print
function unitLabel(item) {
  if (item.unit === 'dzn') return 'DZN';
  return 'PCS';
}

// Display qty in the unit used (not always pcs)
function displayQty(item) {
  if (item.unit === 'dzn' && item.unitQty) return Number(item.unitQty).toFixed(0);
  return Number(item.quantity || 0).toFixed(0);
}

export default function InvoicePrint({ invoice }) {
  if (!invoice) return null;

  // Non-GST / Cash bill → simple format
  if (invoice.invoiceType === 'Non-GST' || invoice.invoiceType === 'Cash') {
    return <CashBillPrint invoice={invoice} />;
  }

  let company = {};
  try { company = JSON.parse(localStorage.getItem('rfi_company') || '{}'); } catch {}

  const co = {
    name:    company.name    || 'Ram Footware Industries',
    address: company.address || '313/13E, Ground Floor, Inder Lok, New Delhi - 110035',
    phone:   company.phone   || '9810000000',
    email:   company.email   || 'info@rfi.com',
    gstin:   company.gstin   || '07XXXXXXXXXXXXXXX',
    state:   company.state   || 'Delhi (07)',
    bank:    company.bank    || 'Punjab National Bank',
    branch:  company.branch  || 'Shahzada Bagh, Delhi',
    account: company.account || '0000000000000',
    ifsc:    company.ifsc    || 'PUNB0000000',
  };

  const c         = invoice.customerSnapshot || {};
  const isIntra   = invoice.saleType === 'intrastate';
  const hsnSummary = getHSNSummary(invoice.items || [], invoice.saleType);
  const totalQty  = (invoice.items || []).reduce((s, i) => s + i.quantity, 0);
  const totalBags = (invoice.items || []).reduce((s, i) => s + (Number(i.bags) || 0), 0);
  const dateStr   = new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const cell = { border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top', fontSize: '11px' };
  const th   = { border: '1px solid #000', padding: '5px 6px', background: '#f0f0f0', fontWeight: 'bold', textAlign: 'center', fontSize: '10px' };
  const tbl  = { width: '100%', borderCollapse: 'collapse' };

  const subtotalAfterDisc = (invoice.subtotal || 0) - (invoice.totalDiscount || 0);
  const halfRate = invoice.items && invoice.items[0] ? (invoice.items[0].gstRate || 5) / 2 : 2.5;
  const fullRate = invoice.items && invoice.items[0] ? (invoice.items[0].gstRate || 5) : 5;

  // Check if any item has bags
  const hasBags = (invoice.items || []).some(i => Number(i.unitQty) > 0 && i.unit === 'bag');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', background: '#fff', padding: '18px', maxWidth: '820px', margin: '0 auto' }}>

      {/* GSTIN + Original Copy */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, width: '60%' }}><strong>GSTIN : {co.gstin}</strong></td>
        <td style={{ ...cell, textAlign: 'right' }}><em>Original Copy</em></td>
      </tr></tbody></table>

      {/* Company Header */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, textAlign: 'center', padding: '10px 6px' }}>
          <div style={{ fontSize: '10px', marginBottom: '2px', letterSpacing: '2px' }}>TAX INVOICE</div>
          <div style={{ fontSize: '24px', fontWeight: '900' }}>{co.name}</div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>{co.address}</div>
          <div style={{ fontSize: '10px' }}>Tel. : {co.phone} &nbsp;&nbsp; email : {co.email}</div>
        </td>
      </tr></tbody></table>

      {/* Invoice Meta */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, width: '50%', lineHeight: '1.75' }}>
          <div><strong>Invoice No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {invoice.invoiceNumber}</div>
          <div><strong>Dated &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {dateStr}</div>
          <div><strong>Place of Supply &nbsp;:</strong> {co.state}</div>
          <div><strong>Reverse Charge &nbsp;&nbsp;:</strong> N</div>
          <div><strong>GR/RR No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;</div>
        </td>
        <td style={{ ...cell, width: '50%', lineHeight: '1.75' }}>
          <div><strong>Transport &nbsp;&nbsp;&nbsp;&nbsp;:</strong> Self</div>
          <div><strong>Vehicle No. &nbsp;&nbsp;:</strong> &nbsp;</div>
          <div><strong>Station &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;</div>
          <div><strong>E-Way Bill No.:</strong> &nbsp;</div>
          <div><strong>Pay. Nature &nbsp;&nbsp;:</strong> {invoice.paymentMethod}</div>
        </td>
      </tr></tbody></table>

      {/* Billed To / Shipped To */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, width: '50%', lineHeight: '1.75' }}>
          <div><strong>Billed to :</strong></div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{c.name || '—'}</div>
          {c.address?.street && <div>{c.address.street}</div>}
          {c.address?.city && <div>{c.address.city}{c.address.state ? ', ' + c.address.state : ''}{c.address.pincode ? ', ' + c.address.pincode : ''}</div>}
          <br />
          <div><strong>Party Mobile No :</strong> {c.phone || '—'}</div>
          {c.gstin && <div><strong>GSTIN / UIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {c.gstin}</div>}
        </td>
        <td style={{ ...cell, width: '50%', lineHeight: '1.75' }}>
          <div><strong>Shipped to :</strong></div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{c.name || '—'}</div>
          {c.address?.street && <div>{c.address.street}</div>}
          {c.address?.city && <div>{c.address.city}{c.address.state ? ', ' + c.address.state : ''}{c.address.pincode ? ', ' + c.address.pincode : ''}</div>}
          <br />
          <div><strong>Party Mobile No :</strong> {c.phone || '—'}</div>
          {c.gstin && <div><strong>GSTIN / UIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {c.gstin}</div>}
        </td>
      </tr></tbody></table>

      {/* Items Table */}
      <table style={tbl}>
        <thead>
          <tr>
            <th style={{ ...th, width: '4%' }}>S.N.</th>
            <th style={{ ...th, textAlign: 'left', width: '28%' }}>Description of Goods</th>
            <th style={{ ...th, width: '9%' }}>HSN/SAC<br/>Code</th>
            <th style={{ ...th, width: '8%' }}>Bags</th>
            <th style={{ ...th, width: '8%' }}>Qty.</th>
            <th style={{ ...th, width: '7%' }}>Unit</th>
            <th style={{ ...th, width: '10%' }}>Price</th>
            <th style={{ ...th, width: '12%' }}>Amount(Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, i) => {
            const bags = item.unit === 'bag' ? (item.unitQty || 0) : 
                         (item.bagQty && item.quantity ? Math.floor(item.quantity / item.bagQty) : 0);
            const remainingPcs = item.unit === 'bag' ? 0 : item.quantity;
            return (
              <tr key={i}>
                <td style={{ ...cell, textAlign: 'center' }}>{i + 1}.</td>
                <td style={cell}>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>
                    {item.size && 'Size: ' + item.size}
                    {item.size && item.sku && ' | '}
                    {item.sku && 'SKU: ' + item.sku}
                  </div>
                </td>
                <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{item.hsn || '6403'}</td>
                {/* Bags column */}
                <td style={{ ...cell, textAlign: 'center', background: (item.bags > 0) ? '#fffbeb' : 'transparent' }}>
                  {item.bags > 0 ? item.bags : '—'}
                </td>
                {/* Qty column */}
                <td style={{ ...cell, textAlign: 'center' }}>
                  {item.unit === 'dzn' && item.unitQty > 0 ? item.unitQty : item.quantity}
                </td>
                {/* Unit column */}
                <td style={{ ...cell, textAlign: 'center' }}>
                  {item.unit === 'dzn' ? 'DZN' : 'PCS'}
                </td>
                <td style={{ ...cell, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: '600' }}>{fmt(item.taxableAmount)}</td>
              </tr>
            );
          })}
          {/* Empty padding rows */}
          {Array.from({ length: Math.max(0, 5 - (invoice.items || []).length) }).map((_, i) => (
            <tr key={'e' + i}>
              <td style={{ ...cell, height: '22px' }}>&nbsp;</td>
              {[1,2,3,4,5,6,7].map(x => <td key={x} style={cell}></td>)}
            </tr>
          ))}
          {/* Subtotal */}
          <tr>
            <td colSpan={7} style={{ ...cell, textAlign: 'right', borderRight: '1px solid #000' }}></td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>{fmt(subtotalAfterDisc)}</td>
          </tr>
          {/* GST rows */}
          <tr>
            <td colSpan={6} style={{ ...cell, textAlign: 'right' }}>{isIntra ? 'Add : CGST' : 'Add : IGST'}</td>
            <td style={{ ...cell, textAlign: 'right' }}>@ {isIntra ? halfRate : fullRate} %</td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(isIntra ? invoice.totalCGST : invoice.totalIGST)}</td>
          </tr>
          {isIntra && (
            <tr>
              <td colSpan={6} style={{ ...cell, textAlign: 'right' }}>Add : SGST</td>
              <td style={{ ...cell, textAlign: 'right' }}>@ {halfRate} %</td>
              <td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalSGST)}</td>
            </tr>
          )}
          {invoice.roundOff !== 0 && invoice.roundOff !== undefined && (
            <tr>
              <td colSpan={7} style={{ ...cell, textAlign: 'right' }}>
                Add : Rounded Off ({(invoice.roundOff || 0) >= 0 ? '+' : '-'})
              </td>
              <td style={{ ...cell, textAlign: 'right' }}>{Math.abs(invoice.roundOff || 0).toFixed(2)}</td>
            </tr>
          )}
          {/* Grand Total */}
          <tr style={{ background: '#f0f0f0' }}>
            <td colSpan={3} style={{ ...cell, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>Grand Total</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 'bold' }}>{totalBags > 0 ? totalBags + ' Bags' : '—'}</td>
            <td colSpan={2} style={{ ...cell, textAlign: 'center', fontWeight: 'bold' }}>{totalQty} PCS</td>
            <td style={cell}></td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{fmt(invoice.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* HSN Summary */}
      <table style={tbl}>
        <thead>
          <tr>
            <th style={th}>HSN/SAC</th>
            <th style={th}>Tax Rate</th>
            <th style={th}>Taxable Amt.</th>
            {isIntra ? <><th style={th}>CGST Amt.</th><th style={th}>SGST Amt.</th></> : <th style={th}>IGST Amt.</th>}
            <th style={th}>Total Tax</th>
          </tr>
        </thead>
        <tbody>
          {hsnSummary.map((row, i) => (
            <tr key={i}>
              <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{row.hsn}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{row.rate}%</td>
              <td style={{ ...cell, textAlign: 'right' }}>{fmt(row.taxable)}</td>
              {isIntra
                ? <><td style={{ ...cell, textAlign: 'right' }}>{fmt(row.cgst)}</td><td style={{ ...cell, textAlign: 'right' }}>{fmt(row.sgst)}</td></>
                : <td style={{ ...cell, textAlign: 'right' }}>{fmt(row.igst)}</td>}
              <td style={{ ...cell, textAlign: 'right', fontWeight: '600' }}>{fmt(row.total)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#f8f8f8' }}>
            <td style={cell}>Total</td>
            <td style={cell}></td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalTaxable)}</td>
            {isIntra
              ? <><td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalCGST)}</td><td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalSGST)}</td></>
              : <td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalIGST)}</td>}
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(invoice.totalGST)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, fontStyle: 'italic' }}>
          <strong>{numberToWords(invoice.grandTotal)}</strong>
        </td>
      </tr></tbody></table>

      {/* Bank Details */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, lineHeight: '1.8' }}>
          <strong>Bank Details : {co.bank} – {co.branch}</strong><br />
          A/C NO. - {co.account} &nbsp;&nbsp;&nbsp; IFSC - {co.ifsc}
        </td>
        <td style={{ ...cell, textAlign: 'right', lineHeight: '1.8' }}>
          <div><strong>Payment: </strong>{invoice.paymentStatus}</div>
          {invoice.paidAmount > 0 && <div><strong>Paid ({invoice.paymentMethod}):</strong> ₹{fmt(invoice.paidAmount)}</div>}
          {(invoice.dueAmount || 0) > 0 && <div style={{ color: 'red' }}><strong>Balance Due:</strong> ₹{fmt(invoice.dueAmount)}</div>}
        </td>
      </tr></tbody></table>

      {/* Terms + Signature */}
      <table style={tbl}><tbody><tr>
        <td style={{ ...cell, width: '55%', lineHeight: '1.7', verticalAlign: 'top' }}>
          <strong>Terms &amp; Conditions</strong><br />
          E &amp; O.E.<br />
          1. Goods once sold will not be taken back.<br />
          2. Interest @ 18% p.a. will be charged if payment is not made within stipulated time.<br />
          3. Subject to Delhi Jurisdiction only.
        </td>
        <td style={{ ...cell, width: '22%', textAlign: 'center', verticalAlign: 'bottom' }}>
          <div style={{ marginBottom: '4px' }}><strong>Receiver's Signature :</strong></div>
          <div style={{ height: '50px' }}></div>
        </td>
        <td style={{ ...cell, width: '23%', textAlign: 'center', verticalAlign: 'bottom' }}>
          <div style={{ height: '50px' }}></div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
            <strong>For {co.name}</strong><br />
            <em>Authorised Signatory</em>
          </div>
        </td>
      </tr></tbody></table>
    </div>
  );
}
