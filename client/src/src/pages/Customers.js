import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const emptyCustomer = { name:'', phone:'', email:'', type:'Retail', gstin:'', creditLimit:0, notes:'', address:{ street:'', city:'', state:'', pincode:'' } };
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyCustomer);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/customers', { params: { search, type, limit: 100 } });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, type]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => { setForm(emptyCustomer); setEditId(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ ...emptyCustomer, ...c, address: { ...emptyCustomer.address, ...c.address } });
    setEditId(c._id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await API.put(`/customers/${editId}`, form); toast.success('Customer updated!'); }
      else { await API.post('/customers', form); toast.success('Customer added!'); }
      setShowModal(false); fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate customer?')) return;
    try { await API.delete(`/customers/${id}`); toast.success('Customer deactivated'); fetchCustomers(); }
    catch { toast.error('Failed'); }
  };

  const setAddr = (field, val) => setForm(f => ({ ...f, address: { ...f.address, [field]: val } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search by name, phone, email..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: '140px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option>Retail</option><option>Wholesale</option><option>Dealer</option>
        </select>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th><th>Contact</th><th>Type</th><th>GSTIN</th>
                  <th>Total Purchases</th><th>Orders</th><th>Outstanding</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👥</div><p>No customers found</p></div></td></tr>
                ) : customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.address?.city}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{c.phone}</div>
                      {c.email && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.email}</div>}
                    </td>
                    <td><span className={`badge ${c.type === 'Retail' ? 'badge-blue' : c.type === 'Wholesale' ? 'badge-gold' : 'badge-green'}`}>{c.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>{c.gstin || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt(c.totalPurchases)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.totalOrders}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: c.outstandingBalance > 0 ? 'var(--red)' : 'var(--muted)' }}>{fmt(c.outstandingBalance)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>🗑️</button>
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
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Full Name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                  <div className="input-group"><label className="input-label">Phone *</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/></div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                  <div className="input-group"><label className="input-label">Customer Type</label>
                    <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                      <option>Retail</option><option>Wholesale</option><option>Dealer</option>
                    </select>
                  </div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">GSTIN</label><input className="input" value={form.gstin} onChange={e=>setForm(f=>({...f,gstin:e.target.value}))}/></div>
                  <div className="input-group"><label className="input-label">Credit Limit (₹)</label><input className="input" type="number" value={form.creditLimit} onChange={e=>setForm(f=>({...f,creditLimit:Number(e.target.value)}))}/></div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '10px', marginTop: '4px' }}>Address</div>
                <div className="input-group"><label className="input-label">Street</label><input className="input" value={form.address?.street||''} onChange={e=>setAddr('street',e.target.value)}/></div>
                <div className="input-row cols-3">
                  <div className="input-group"><label className="input-label">City</label><input className="input" value={form.address?.city||''} onChange={e=>setAddr('city',e.target.value)}/></div>
                  <div className="input-group"><label className="input-label">State</label><input className="input" value={form.address?.state||''} onChange={e=>setAddr('state',e.target.value)}/></div>
                  <div className="input-group"><label className="input-label">Pincode</label><input className="input" value={form.address?.pincode||''} onChange={e=>setAddr('pincode',e.target.value)}/></div>
                </div>
                <div className="input-group"><label className="input-label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
