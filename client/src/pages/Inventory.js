import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GST_RATES = [0, 5, 12, 18, 28];
const emptyProduct = {
  sku: '', name: '', costPrice: '', sellingPrice: '', mrp: '',
  gstRate: 5, hsn: '6403', bagQty: 12, description: '', lowStockThreshold: 5,
  sizeStock: ['6','7','8','9','10'].map(s => ({ size: s, stock: 0 }))
};

export default function Inventory() {
  const [products, setProducts]             = useState([]);
  const [total, setTotal]                   = useState(0);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [showModal, setShowModal]           = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showLogModal, setShowLogModal]     = useState(false);
  const [editProduct, setEditProduct]       = useState(null);
  const [quickProduct, setQuickProduct]     = useState(null);
  const [form, setForm]                     = useState(emptyProduct);
  const [stockForm, setStockForm]           = useState({ size: '', bags: '', qtyToAdd: '', note: '', inputMode: 'bags' });
  const [page, setPage]                     = useState(1);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [stockLogs, setStockLogs]           = useState([]);
  const [logDate, setLogDate]               = useState(new Date().toISOString().slice(0, 10));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, search };
      if (lowStockFilter) params.lowStock = true;
      const res = await API.get('/products', { params });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search, lowStockFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchLogs = async (date) => {
    try {
      const res = await API.get('/products/logs/stock', { params: { date } });
      setStockLogs(res.data);
    } catch { toast.error('Failed to load stock logs'); }
  };

  const openAdd = () => { setForm({ ...emptyProduct }); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p, mrp: p.mrp || '' }); setEditProduct(p._id); setShowModal(true); };
  const openQuickStock = (p) => {
    setQuickProduct(p);
    setStockForm({ size: p.sizeStock?.[0]?.size || '', bags: '', qtyToAdd: '', note: '', inputMode: 'bags' });
    setShowStockModal(true);
  };
  const openLogs = () => { fetchLogs(logDate); setShowLogModal(true); };

  const handleSizeStockChange = (size, val) =>
    setForm(f => ({ ...f, sizeStock: f.sizeStock.map(s => s.size === size ? { ...s, stock: Number(val) } : s) }));

  const addSize = () => {
    const size = prompt('Enter size (e.g. 9, UK9):');
    if (size && !form.sizeStock.find(s => s.size === size))
      setForm(f => ({ ...f, sizeStock: [...f.sizeStock, { size, stock: 0 }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.mrp) delete data.mrp;
      if (editProduct) { await API.put('/products/' + editProduct, data); toast.success('Updated!'); }
      else { await API.post('/products', data); toast.success('Product added!'); }
      setShowModal(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const handleQuickStock = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        size: stockForm.size, note: stockForm.note,
        bags: stockForm.inputMode === 'bags' ? Number(stockForm.bags) : 0,
        qtyToAdd: stockForm.inputMode === 'qty' ? Number(stockForm.qtyToAdd) : 0,
      };
      await API.post('/products/' + quickProduct._id + '/stock', payload);
      const qty = stockForm.inputMode === 'bags'
        ? Number(stockForm.bags) * (quickProduct.bagQty || 12)
        : Number(stockForm.qtyToAdd);
      toast.success('Added ' + qty + ' pcs to ' + quickProduct.name);
      setShowStockModal(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try { await API.delete('/products/' + id); toast.success('Deactivated'); fetchProducts(); }
    catch { toast.error('Failed'); }
  };

  const fmt = (n) => (n != null && n !== '') ? '₹' + Number(n).toLocaleString('en-IN') : '—';
  const previewQty = quickProduct
    ? (stockForm.inputMode === 'bags' ? (Number(stockForm.bags) || 0) * (quickProduct.bagQty || 12) : Number(stockForm.qtyToAdd) || 0)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{total} products</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={openLogs}>📋 Stock Log</button>
          <button className={'btn ' + (lowStockFilter ? 'btn-danger' : 'btn-ghost') + ' btn-sm'} onClick={() => setLowStockFilter(!lowStockFilter)}>⚠️ Low Stock</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search SKU or product name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>SKU</th><th>Product</th><th>Cost</th><th>Sell Price</th><th>MRP</th>
                  <th>Bag Qty</th><th>GST</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={10}>
                    <div className="empty-state"><div className="empty-state-icon">👟</div><p>No products found</p></div>
                  </td></tr>
                ) : products.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{p.sku}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.sizeStock?.filter(s => s.stock > 0).length} sizes in stock</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(p.costPrice)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt(p.sellingPrice)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmt(p.mrp)}</td>
                    <td style={{ textAlign: 'center' }}>{p.bagQty} pcs</td>
                    <td>{p.gstRate}%</td>
                    <td><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.totalStock}</div></td>
                    <td>
                      {p.totalStock === 0 ? <span className="badge badge-red">Out of Stock</span>
                        : p.isLowStock ? <span className="badge badge-orange">Low Stock</span>
                        : <span className="badge badge-green">In Stock</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openQuickStock(p)} title="Quick Stock Update">+📦</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-row cols-2">
                  <div className="input-group">
                    <label className="input-label">SKU <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '11px' }}>(auto if blank)</span></label>
                    <input className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Auto e.g. RFI-0001" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Product Name *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                </div>
                <div className="input-row cols-3">
                  <div className="input-group">
                    <label className="input-label">Cost Price (₹) *</label>
                    <input className="input" type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} required min="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Selling Price (₹) *</label>
                    <input className="input" type="number" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} required min="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">MRP (₹) <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '11px' }}>(optional)</span></label>
                    <input className="input" type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} min="0" placeholder="Optional" />
                  </div>
                </div>
                <div className="input-row cols-3">
                  <div className="input-group">
                    <label className="input-label">GST Rate (%)</label>
                    <select className="input" value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: Number(e.target.value) }))}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">HSN Code</label>
                    <input className="input" value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Pcs per Bag</label>
                    <input className="input" type="number" min="1" value={form.bagQty} onChange={e => setForm(f => ({ ...f, bagQty: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group">
                    <label className="input-label">Low Stock Alert (pcs)</label>
                    <input className="input" type="number" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: Number(e.target.value) }))} min="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Size-wise Opening Stock</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addSize}>+ Add Size</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                    {form.sizeStock.map(s => (
                      <div key={s.size} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px', position: 'relative' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Size {s.size}</div>
                        <input type="number" min="0" value={s.stock} onChange={e => handleSizeStockChange(s.size, e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '16px', fontWeight: 700, outline: 'none' }} />
                        <button type="button" onClick={() => setForm(f => ({ ...f, sizeStock: f.sizeStock.filter(x => x.size !== s.size) }))}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                    Total: <strong style={{ color: 'var(--text)' }}>{form.sizeStock.reduce((s, x) => s + (Number(x.stock) || 0), 0)} pcs</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Modal */}
      {showStockModal && quickProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Quick Stock Update</h2>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{quickProduct.name} · {quickProduct.sku}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleQuickStock}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button type="button" className={'btn btn-sm ' + (stockForm.inputMode === 'bags' ? 'btn-primary' : 'btn-ghost')}
                    onClick={() => setStockForm(f => ({ ...f, inputMode: 'bags' }))}>📦 Add by Bags</button>
                  <button type="button" className={'btn btn-sm ' + (stockForm.inputMode === 'qty' ? 'btn-primary' : 'btn-ghost')}
                    onClick={() => setStockForm(f => ({ ...f, inputMode: 'qty' }))}>🔢 Add by Pcs</button>
                </div>
                <div className="input-group">
                  <label className="input-label">Size</label>
                  <select className="input" value={stockForm.size} onChange={e => setStockForm(f => ({ ...f, size: e.target.value }))} required>
                    <option value="">Select size</option>
                    {quickProduct.sizeStock?.map(s => (
                      <option key={s.size} value={s.size}>{s.size} (current: {s.stock} pcs)</option>
                    ))}
                    <option value="__new">+ Add New Size</option>
                  </select>
                  {stockForm.size === '__new' && (
                    <input className="input" style={{ marginTop: '8px' }} placeholder="Type size e.g. 11"
                      onChange={e => setStockForm(f => ({ ...f, size: e.target.value }))} />
                  )}
                </div>
                {stockForm.inputMode === 'bags' ? (
                  <div className="input-group" style={{ marginTop: '12px' }}>
                    <label className="input-label">Number of Bags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({quickProduct.bagQty || 12} pcs/bag)</span></label>
                    <input className="input" type="number" min="1" value={stockForm.bags}
                      onChange={e => setStockForm(f => ({ ...f, bags: e.target.value }))} required placeholder="e.g. 2" />
                  </div>
                ) : (
                  <div className="input-group" style={{ marginTop: '12px' }}>
                    <label className="input-label">Quantity (pcs)</label>
                    <input className="input" type="number" min="1" value={stockForm.qtyToAdd}
                      onChange={e => setStockForm(f => ({ ...f, qtyToAdd: e.target.value }))} required placeholder="e.g. 24" />
                  </div>
                )}
                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label className="input-label">Note (optional)</label>
                  <input className="input" value={stockForm.note} onChange={e => setStockForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="e.g. New batch from supplier" />
                </div>
                {previewQty > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#15803d' }}>
                    ✅ Will add {previewQty} pcs to Size {stockForm.size}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Log Modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📋 Daily Stock Log</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLogModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <input type="date" className="input" style={{ width: '200px' }} value={logDate}
                  onChange={e => { setLogDate(e.target.value); fetchLogs(e.target.value); }} />
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{stockLogs.length} entries</span>
              </div>
              {stockLogs.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📋</div><p>No stock added on this date</p></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Time</th><th>SKU</th><th>Product</th><th>Size</th><th>Bags</th><th>Qty Added</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {stockLogs.map((log, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{log.sku}</td>
                        <td style={{ fontWeight: 600 }}>{log.name}</td>
                        <td>{log.size}</td>
                        <td>{log.bags > 0 ? log.bags + ' bags' : '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>+{log.qtyAdded} pcs</td>
                        <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{log.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {stockLogs.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Total added: </strong>
                  {stockLogs.reduce((s, l) => s + l.qtyAdded, 0)} pcs &nbsp;·&nbsp;
                  {stockLogs.filter(l => l.bags > 0).reduce((s, l) => s + l.bags, 0)} bags &nbsp;·&nbsp;
                  {stockLogs.length} entries
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}