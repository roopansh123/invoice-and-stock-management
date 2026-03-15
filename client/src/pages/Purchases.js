import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [] });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/purchases', { params: { limit: 50 } });
      setPurchases(res.data.purchases); setTotal(res.data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);
  useEffect(() => {
    API.get('/suppliers').then(r => setSuppliers(r.data));
  }, []);

  useEffect(() => {
    if (productSearch.length >= 2) {
      API.get('/products', { params: { search: productSearch, limit: 8 } }).then(r => setProducts(r.data.products));
    } else setProducts([]);
  }, [productSearch]);

  const addItem = (product, size) => {
    setForm(f => {
      const exist = f.items.findIndex(i => i.productId === product._id && i.size === size);
      if (exist >= 0) {
        const items = [...f.items]; items[exist].quantity++; return { ...f, items };
      }
      return { ...f, items: [...f.items, { productId: product._id, sku: product.sku, name: product.name, size, quantity: 1, costPrice: product.costPrice }] };
    });
    setProductSearch(''); setProducts([]);
  };

  const updateItem = (idx, field, val) => {
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], [field]: Number(val) }; return { ...f, items }; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return toast.error('Select a supplier');
    if (form.items.length === 0) return toast.error('Add at least one item');
    try {
      await API.post('/purchases', { supplierId: form.supplierId, items: form.items, notes: form.notes });
      toast.success('Purchase order created!');
      setShowModal(false); setForm({ supplierId: '', notes: '', items: [] });
      fetchPurchases();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const receive = async (id) => {
    if (!window.confirm('Mark as received? This will update inventory stock.')) return;
    try {
      await API.patch(`/purchases/${id}/receive`);
      toast.success('Stock updated!'); fetchPurchases();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const grandTotal = form.items.reduce((s, i) => s + (i.costPrice * i.quantity), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{total} orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Purchase Order</button>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>PO Number</th><th>Supplier</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📦</div><p>No purchase orders yet</p></div></td></tr>
                ) : purchases.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '12px' }}>{p.purchaseNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.supplier?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.supplier?.phone}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.items?.length}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(p.grandTotal)}</td>
                    <td><span className={`badge ${p.paymentStatus === 'Paid' ? 'badge-green' : p.paymentStatus === 'Partial' ? 'badge-orange' : 'badge-red'}`}>{p.paymentStatus}</span></td>
                    <td><span className={`badge ${p.status === 'Received' ? 'badge-green' : p.status === 'Draft' ? 'badge-muted' : 'badge-red'}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      {p.status === 'Draft' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => receive(p._id)}>📦 Receive</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Purchase Order</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Supplier *</label>
                  <select className="input" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} — {s.phone}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="input-label">Search & Add Products</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" placeholder="Search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    {products.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
                        {products.map(p => (
                          <div key={p._id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '6px' }}>{p.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{p.sku}</span></div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(['4','5','6','7','8','9','10','11','12']).map(s => (
                                <button key={s} type="button" onClick={() => addItem(p, s)}
                                  style={{ padding: '3px 9px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', cursor: 'pointer', fontSize: '12px' }}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {form.items.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>PRODUCT</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>SIZE</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>QTY</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>COST</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>TOTAL</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}>{item.name}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{item.size}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                                style={{ width: '55px', background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px', borderRadius: '4px', textAlign: 'center' }} />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <input type="number" min="0" value={item.costPrice} onChange={e => updateItem(i, 'costPrice', e.target.value)}
                                style={{ width: '80px', background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px', borderRadius: '4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }} />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                              {fmt(item.costPrice * item.quantity)}
                            </td>
                            <td><button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '8px' }}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '10px 12px', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Subtotal (excl. GST)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{fmt(grandTotal)}</span>
                    </div>
                  </div>
                )}

                <div className="input-group"><label className="input-label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
