import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from '../components/Billing/InvoicePrint';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const printRef = useRef();
  const print = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    API.get(`/invoices/${id}`).then(r => { setInvoice(r.data); setLoading(false); });
  }, [id]);

  const handlePayment = async () => {
    if (!payAmount || isNaN(payAmount)) return;
    try {
      const res = await API.patch(`/invoices/${id}/payment`, { amount: Number(payAmount), method: payMethod });
      setInvoice(res.data);
      toast.success('Payment recorded!');
      setPayAmount('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!invoice) return <div className="empty-state"><p>Invoice not found</p></div>;

  const c = invoice.customerSnapshot || {};
  const statusColor = invoice.paymentStatus === 'Paid' ? 'var(--green)' : invoice.paymentStatus === 'Partial' ? 'var(--orange)' : 'var(--red)';

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/billing" className="btn btn-ghost btn-sm">← Back</Link>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '22px' }}>{invoice.invoiceNumber}</h1>
            <span className={`badge ${invoice.paymentStatus === 'Paid' ? 'badge-green' : invoice.paymentStatus === 'Partial' ? 'badge-orange' : 'badge-red'}`}>
              {invoice.paymentStatus}
            </span>
            {invoice.status === 'Cancelled' && <span className="badge badge-muted">Cancelled</span>}
          </div>
          <p className="page-subtitle">{new Date(invoice.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={print}>🖨️ Print Invoice</button>
        </div>
      </div>

      <div style={{ display: 'none' }}><div ref={printRef}><InvoicePrint invoice={invoice} /></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        <div>
          {/* Customer Info */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">Customer Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{c.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{c.phone}</div>
                {c.email && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{c.email}</div>}
                {c.gstin && <div style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>GSTIN: {c.gstin}</div>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {c.address?.city && <div>{c.address.city}, {c.address.state}</div>}
                {c.address?.pincode && <div>{c.address.pincode}</div>}
                <div style={{ marginTop: '8px' }}><strong style={{ color: 'var(--text)' }}>Sale:</strong> {invoice.saleType === 'intrastate' ? 'Intrastate' : 'Interstate'}</div>
                <div><strong style={{ color: 'var(--text)' }}>Type:</strong> {invoice.invoiceType}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="table-container">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Order Items ({invoice.items?.length})</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Product</th><th>Size</th><th>Qty</th>
                    <th>Rate</th><th>Discount</th><th>Taxable</th>
                    {invoice.saleType === 'intrastate' ? <><th>CGST</th><th>SGST</th></> : <th>IGST</th>}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{item.sku}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.size}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                        {item.discount > 0 ? (item.discountType === 'percent' ? `${item.discount}%` : fmt(item.discount)) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.taxableAmount)}</td>
                      {invoice.saleType === 'intrastate' ? <>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.cgst)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.sgst)}</td>
                      </> : <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.igst)}</td>}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Totals */}
          <div className="card">
            <div className="card-title">Amount Summary</div>
            {[
              { label: 'Subtotal', val: invoice.subtotal },
              invoice.totalDiscount > 0 && { label: 'Discount', val: -invoice.totalDiscount, color: 'var(--red)' },
              { label: 'Taxable', val: invoice.totalTaxable },
              invoice.saleType === 'intrastate' && { label: 'CGST', val: invoice.totalCGST },
              invoice.saleType === 'intrastate' && { label: 'SGST', val: invoice.totalSGST },
              invoice.saleType === 'interstate' && { label: 'IGST', val: invoice.totalIGST },
              invoice.roundOff !== 0 && { label: 'Round Off', val: invoice.roundOff },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="invoice-line" style={{ color: row.color || 'var(--text2)' }}>
                <span>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(row.val)}</span>
              </div>
            ))}
            <div className="invoice-line total">
              <span>Grand Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{fmt(invoice.grandTotal)}</span>
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Paid ({invoice.paymentMethod})</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 700 }}>{fmt(invoice.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Balance Due</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: statusColor, fontWeight: 800, fontSize: '16px' }}>{fmt(invoice.dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Record Payment */}
          {invoice.dueAmount > 0 && invoice.status !== 'Cancelled' && (
            <div className="card">
              <div className="card-title">Record Payment</div>
              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input className="input" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder={invoice.dueAmount} min="1" max={invoice.dueAmount} />
              </div>
              <div className="input-group">
                <label className="input-label">Method</label>
                <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handlePayment} style={{ width: '100%', justifyContent: 'center' }}>
                ✅ Record Payment
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={print} style={{ justifyContent: 'center' }}>🖨️ Print Invoice</button>
              <Link to="/billing/new" className="btn btn-ghost" style={{ justifyContent: 'center', textDecoration: 'none' }}>+ New Invoice</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
