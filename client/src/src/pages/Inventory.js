import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Formal', 'Casual', 'Sports', 'Sandals', 'Boots', 'Kids', 'Ladies', 'Other'];
const GENDERS = ['Men', 'Women', 'Kids', 'Unisex'];
const GST_RATES = [0, 5, 12, 18, 28];
const SIZES = ['4','5','6','7','8','9','10','11','12','13','UK4','UK5','UK6','UK7','UK8','UK9','UK10','UK11','UK12'];

const emptyProduct = {
  sku: '', name: '', brand: '', category: 'Casual', gender: 'Men',
  color: '', material: '', costPrice: '', sellingPrice: '', mrp: '',
  gstRate: 5, hsn: '6403', description: '', lowStockThreshold: 5,
  sizeStock: SIZES.slice(3,10).map(s => ({ size: s, stock: 0 }))
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [page, setPage] = useState(1);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, search, category };
      if (lowStockFilter) params.lowStock = true;
      const res = await API.get('/products', { params });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, lowStockFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setForm(emptyProduct); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ ...p, costPrice: p.costPrice, sellingPrice: p.sellingPrice, mrp: p.mrp });
    setEditProduct(p._id);
    setShowModal(true);
  };

  const handleSizeStockChange = (size, val) => {
    setForm(f => ({ ...f, sizeStock: f.sizeStock.map(s => s.size === size ? { ...s, stock: Number(val) } : s) }));
  };

  const addSize = () => {
    const size = prompt('Enter size (e.g. 9, UK9):');
    if (size && !form.sizeStock.find(s => s.size === size)) {
      setForm(f => ({ ...f, sizeStock: [...f.sizeStock, { size, stock: 0 }] }));
    }
  };

  const removeSize = (size) => {
    setForm(f => ({ ...f, sizeStock: f.sizeStock.filter(s => s.size !== size) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await API.put(`/products/${editProduct}`, form);
        toast.success('Product updated!');
      } else {
        await API.post('/products', form);
        toast.success('Product added!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err) { toast.error('Failed'); }
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{total} products in catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => setLowStockFilter(!lowStockFilter)}>
            ⚠️ Low Stock
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search SKU, name, brand..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input" style={{ width: '160px' }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>SKU</th><th>Product</th><th>Brand</th><th>Category</th>
                  <th>Cost</th><th>MRP</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
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
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.color} · {p.gender}</div>
                    </td>
                    <td>{p.brand}</td>
                    <td><span className="chip">{p.category}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(p.costPrice)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', textDecoration: 'line-through' }}>{fmt(p.mrp)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt(p.sellingPrice)}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.totalStock}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.sizeStock?.filter(s=>s.stock>0).length} sizes</div>
                    </td>
                    <td>
                      {p.totalStock === 0 ? <span className="badge badge-red">Out of Stock</span>
                        : p.isLowStock ? <span className="badge badge-orange">Low Stock</span>
                        : <span className="badge badge-green">In Stock</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
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
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-row cols-2">
                  <div className="input-group">
                    <label className="input-label">SKU *</label>
                    <input className="input" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} required placeholder="RFI-001" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Product Name *</label>
                    <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
                  </div>
                </div>
                <div className="input-row cols-3">
                  <div className="input-group">
                    <label className="input-label">Brand *</label>
                    <input className="input" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select className="input" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                      {GENDERS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group">
                    <label className="input-label">Color</label>
                    <input className="input" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} placeholder="Black, Brown..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Material</label>
                    <input className="input" value={form.material} onChange={e=>setForm(f=>({...f,material:e.target.value}))} placeholder="Leather, Canvas..." />
                  </div>
                </div>
                <div className="input-row cols-3">
                  <div className="input-group">
                    <label className="input-label">Cost Price (₹) *</label>
                    <input className="input" type="number" value={form.costPrice} onChange={e=>setForm(f=>({...f,costPrice:e.target.value}))} required min="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Selling Price (₹) *</label>
                    <input className="input" type="number" value={form.sellingPrice} onChange={e=>setForm(f=>({...f,sellingPrice:e.target.value}))} required min="0" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">MRP (₹) *</label>
                    <input className="input" type="number" value={form.mrp} onChange={e=>setForm(f=>({...f,mrp:e.target.value}))} required min="0" />
                  </div>
                </div>
                <div className="input-row cols-3">
                  <div className="input-group">
                    <label className="input-label">GST Rate (%)</label>
                    <select className="input" value={form.gstRate} onChange={e=>setForm(f=>({...f,gstRate:Number(e.target.value)}))}>
                      {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">HSN Code</label>
                    <input className="input" value={form.hsn} onChange={e=>setForm(f=>({...f,hsn:e.target.value}))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Low Stock Alert</label>
                    <input className="input" type="number" value={form.lowStockThreshold} onChange={e=>setForm(f=>({...f,lowStockThreshold:Number(e.target.value)}))} min="0" />
                  </div>
                </div>

                {/* Size Stock */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Size-wise Stock</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addSize}>+ Add Size</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                    {form.sizeStock.map(s => (
                      <div key={s.size} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px', position: 'relative' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>Size {s.size}</div>
                        <input type="number" min="0" value={s.stock} onChange={e => handleSizeStockChange(s.size, e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '16px', fontWeight: 700, outline: 'none' }} />
                        <button type="button" onClick={() => removeSize(s.size)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                    Total: <strong style={{ color: 'var(--text)' }}>{form.sizeStock.reduce((s,x)=>s+(Number(x.stock)||0),0)} pairs</strong>
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
    </div>
  );
}
