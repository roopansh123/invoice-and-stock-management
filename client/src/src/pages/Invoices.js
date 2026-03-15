import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const pages = Math.ceil(total / 25);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/invoices', { params: { search, paymentStatus, from, to, page, limit: 25 } });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [search, paymentStatus, from, to, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const cancelInvoice = async (id) => {
    if (!window.confirm('Cancel this invoice? Stock will NOT be automatically restored.')) return;
    try { await API.delete(`/invoices/${id}`); toast.success('Invoice cancelled'); fetchInvoices(); }
    catch { toast.error('Failed to cancel'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{total} total invoices</p>
        </div>
        <Link to="/billing/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search invoice #, customer name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input" style={{ width: '140px' }} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Paid</option><option>Partial</option><option>Unpaid</option>
        </select>
        <input className="input" type="date" style={{ width: '145px' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input className="input" type="date" style={{ width: '145px' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Paid</th><th>Due</th>
                  <th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={10}>
                    <div className="empty-state"><div className="empty-state-icon">📑</div><p>No invoices found</p></div>
                  </td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{inv.invoiceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customerSnapshot?.name || inv.customer?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{inv.customerSnapshot?.phone || inv.customer?.phone}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{inv.items?.length}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(inv.grandTotal)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{fmt(inv.paidAmount)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: inv.dueAmount > 0 ? 'var(--red)' : 'var(--muted)' }}>{fmt(inv.dueAmount)}</td>
                    <td><span className="chip">{inv.paymentMethod}</span></td>
                    <td>
                      <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-green' : inv.paymentStatus === 'Partial' ? 'badge-orange' : 'badge-red'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/billing/${inv._id}`} className="btn btn-ghost btn-sm">View</Link>
                        {inv.status !== 'Cancelled' && <button className="btn btn-danger btn-sm" onClick={() => cancelInvoice(inv._id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: '8px' }}>Page {page} of {pages}</span>
          </div>
        )}
      </div>
    </div>
  );
}
