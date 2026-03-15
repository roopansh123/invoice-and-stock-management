import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const emptySupplier = { name:'', contactPerson:'', phone:'', email:'', gstin:'', paymentTerms:'Net 30', address:{street:'',city:'',state:'',pincode:''} };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptySupplier);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/suppliers', { params: { search } });
      setSuppliers(res.data);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => { setForm(emptySupplier); setEditId(null); setShowModal(true); };
  const openEdit = (s) => { setForm({...emptySupplier,...s,address:{...emptySupplier.address,...s.address}}); setEditId(s._id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await API.put(`/suppliers/${editId}`, form); toast.success('Supplier updated!'); }
      else { await API.post('/suppliers', form); toast.success('Supplier added!'); }
      setShowModal(false); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate supplier?')) return;
    try { await API.delete(`/suppliers/${id}`); toast.success('Supplier deactivated'); fetchSuppliers(); }
    catch { toast.error('Failed'); }
  };

  const setAddr = (field, val) => setForm(f => ({ ...f, address: { ...f.address, [field]: val } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Supplier</th><th>Contact</th><th>GSTIN</th><th>City</th><th>Payment Terms</th><th>Orders</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🏭</div><p>No suppliers yet</p></div></td></tr>
                ) : suppliers.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      {s.contactPerson && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.contactPerson}</div>}
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{s.phone}</div>
                      {s.email && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.email}</div>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>{s.gstin || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{s.address?.city || '—'}</td>
                    <td><span className="chip">{s.paymentTerms}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{s.totalOrders}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️</button>
                      </div>
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
          <div className="modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Company Name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                  <div className="input-group"><label className="input-label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))}/></div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Phone *</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/></div>
                  <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">GSTIN</label><input className="input" value={form.gstin} onChange={e=>setForm(f=>({...f,gstin:e.target.value}))}/></div>
                  <div className="input-group"><label className="input-label">Payment Terms</label>
                    <select className="input" value={form.paymentTerms} onChange={e=>setForm(f=>({...f,paymentTerms:e.target.value}))}>
                      {['Immediate','Net 15','Net 30','Net 45','Net 60','COD'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '10px' }}>Address</div>
                <div className="input-group"><label className="input-label">Street</label><input className="input" value={form.address?.street||''} onChange={e=>setAddr('street',e.target.value)}/></div>
                <div className="input-row cols-3">
                  <div className="input-group"><label className="input-label">City</label><input className="input" value={form.address?.city||''} onChange={e=>setAddr('city',e.target.value)}/></div>
                  <div className="input-group"><label className="input-label">State</label><input className="input" value={form.address?.state||''} onChange={e=>setAddr('state',e.target.value)}/></div>
                  <div className="input-group"><label className="input-label">Pincode</label><input className="input" value={form.address?.pincode||''} onChange={e=>setAddr('pincode',e.target.value)}/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
