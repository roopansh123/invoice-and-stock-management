import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function WorkerStock() {
  const { user, logout } = useAuth();
  const [products, setProducts]       = useState([]);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(null);
  const [stockForm, setStockForm]     = useState({ size: '', bags: '', qtyToAdd: '', note: '', inputMode: 'bags' });
  const [submitting, setSubmitting]   = useState(false);
  const [todayLogs, setTodayLogs]     = useState([]);

  const fetchProducts = useCallback(async () => {
    if (search.length < 2) { setProducts([]); return; }
    try {
      const res = await API.get('/products', { params: { search, limit: 10 } });
      setProducts(res.data.products);
    } catch { toast.error('Search failed'); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchTodayLogs = async () => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      const res = await API.get('/products/logs/stock', { params: { date } });
      setTodayLogs(res.data);
    } catch {}
  };

  useEffect(() => { fetchTodayLogs(); }, []);

  const selectProduct = (p) => {
    setSelected(p);
    setStockForm({ size: p.sizeStock?.[0]?.size || '', bags: '', qtyToAdd: '', note: '', inputMode: 'bags' });
    setSearch(p.name);
    setProducts([]);
  };

  const previewQty = selected
    ? (stockForm.inputMode === 'bags'
        ? (Number(stockForm.bags) || 0) * (selected.bagQty || 12)
        : Number(stockForm.qtyToAdd) || 0)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { toast.error('Select a product first'); return; }
    if (!stockForm.size) { toast.error('Select a size'); return; }
    if (previewQty <= 0) { toast.error('Enter bags or qty'); return; }
    setSubmitting(true);
    try {
      await API.post('/products/' + selected._id + '/stock', {
        size: stockForm.size, note: stockForm.note,
        bags: stockForm.inputMode === 'bags' ? Number(stockForm.bags) : 0,
        qtyToAdd: stockForm.inputMode === 'qty' ? Number(stockForm.qtyToAdd) : 0,
      });
      toast.success('Added ' + previewQty + ' pcs to ' + selected.name + ' (Size ' + stockForm.size + ')');
      setStockForm({ size: stockForm.size, bags: '', qtyToAdd: '', note: '', inputMode: 'bags' });
      fetchTodayLogs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>👟</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--gold)' }}>RFI</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>STOCK UPDATE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Worker</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>🚪 Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>📦 Quick Stock Update</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>Search a product and add stock</p>

        <div className="card" style={{ marginBottom: '20px' }}>
          {/* Product Search */}
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label">Search Product</label>
            <div style={{ position: 'relative' }}>
              <input className="input" placeholder="Type product name or SKU..."
                value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} autoFocus />
              {products.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 100, maxHeight: '240px', overflowY: 'auto' }}>
                  {products.map(p => (
                    <div key={p._id} onClick={() => selectProduct(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{p.sku} · {p.bagQty || 12} pcs/bag</div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Stock: {p.totalStock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <form onSubmit={handleSubmit}>
              {/* Selected product info */}
              <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selected.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{selected.sku} · 1 bag = {selected.bagQty || 12} pcs</div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total: {selected.totalStock} pcs</span>
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button type="button" className={'btn btn-sm ' + (stockForm.inputMode === 'bags' ? 'btn-primary' : 'btn-ghost')}
                  onClick={() => setStockForm(f => ({ ...f, inputMode: 'bags' }))}>📦 Add by Bags</button>
                <button type="button" className={'btn btn-sm ' + (stockForm.inputMode === 'qty' ? 'btn-primary' : 'btn-ghost')}
                  onClick={() => setStockForm(f => ({ ...f, inputMode: 'qty' }))}>🔢 Add by Pcs</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {/* Size */}
                <div className="input-group">
                  <label className="input-label">Size</label>
                  <select className="input" value={stockForm.size} onChange={e => setStockForm(f => ({ ...f, size: e.target.value }))} required>
                    <option value="">Select size</option>
                    {selected.sizeStock?.map(s => (
                      <option key={s.size} value={s.size}>{s.size} (current: {s.stock} pcs)</option>
                    ))}
                    <option value="__new">+ New Size</option>
                  </select>
                </div>

                {/* Qty input */}
                {stockForm.inputMode === 'bags' ? (
                  <div className="input-group">
                    <label className="input-label">Bags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({selected.bagQty || 12} pcs each)</span></label>
                    <input className="input" type="number" min="1" value={stockForm.bags}
                      onChange={e => setStockForm(f => ({ ...f, bags: e.target.value }))} placeholder="e.g. 2" />
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label">Quantity (pcs)</label>
                    <input className="input" type="number" min="1" value={stockForm.qtyToAdd}
                      onChange={e => setStockForm(f => ({ ...f, qtyToAdd: e.target.value }))} placeholder="e.g. 24" />
                  </div>
                )}
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Note (optional)</label>
                <input className="input" value={stockForm.note}
                  onChange={e => setStockForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. New batch from supplier" />
              </div>

              {previewQty > 0 && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '16px', fontSize: '15px', fontWeight: 700, color: '#15803d' }}>
                  ✅ Will add <strong>{previewQty} pcs</strong> to Size <strong>{stockForm.size}</strong>
                  {stockForm.inputMode === 'bags' && <span style={{ fontWeight: 400, fontSize: '13px' }}> ({stockForm.bags} bags × {selected.bagQty || 12})</span>}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting || previewQty <= 0}
                style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center' }}>
                {submitting ? 'Adding...' : '📦 Add Stock'}
              </button>
            </form>
          )}

          {!selected && search.length < 2 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</div>
              <p>Type at least 2 characters to search</p>
            </div>
          )}
        </div>

        {/* Today's log */}
        {todayLogs.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>📋 Today's Additions</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Time', 'Product', 'Size', 'Added'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--muted)', padding: '6px 8px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px', fontSize: '12px', color: 'var(--muted)' }}>{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{log.name} <span style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{log.sku}</span></td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{log.size}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>+{log.qtyAdded} pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted)', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              Total today: <strong style={{ color: 'var(--text)' }}>{todayLogs.reduce((s, l) => s + l.qtyAdded, 0)} pcs</strong> across {todayLogs.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
