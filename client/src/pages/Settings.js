import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API, useAuth } from '../context/AuthContext';

const defaultCompany = {
  name: 'Ram Footware Industries',
  address: '313/13E, Ground Floor, Inder Lok, New Delhi - 110035',
  phone: '9810000000',
  email: 'info@rfi.com',
  gstin: '07XXXXXXXXXXXXXXX',
  state: 'Delhi (07)',
  bank: 'Punjab National Bank',
  branch: 'Shahzada Bagh, Delhi',
  account: '0000000000000',
  ifsc: 'PUNB0000000',
};

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [form, setForm]           = useState(defaultCompany);
  const [saved, setSaved]         = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  // User management state
  const [users, setUsers]         = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser]     = useState({ name: '', email: '', password: '', role: 'worker' });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('rfi_company') || '{}');
      setForm(prev => ({ ...prev, ...stored }));
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') fetchUsers();
  }, [activeTab, isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
  };

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('rfi_company', JSON.stringify(form));
      toast.success('Company settings saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { toast.error('Failed to save settings'); }
  };

  const handleReset = () => {
    setForm(defaultCompany);
    localStorage.removeItem('rfi_company');
    toast.success('Reset to defaults');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      await API.post('/auth/users', newUser);
      toast.success('User created!');
      setNewUser({ name: '', email: '', password: '', role: 'worker' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAddingUser(false); }
  };

  const toggleUser = async (u) => {
    try {
      await API.patch('/auth/users/' + u._id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm('Delete user ' + u.name + '?')) return;
    try {
      await API.delete('/auth/users/' + u._id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const roleBadge = (role) => {
    const colors = { admin: '#fbbf24', manager: '#60a5fa', cashier: '#34d399', worker: '#a78bfa' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
        background: (colors[role] || '#999') + '22', color: colors[role] || '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {role}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Company details and user management</p>
        </div>
        {activeTab === 'company' && (
          <button className="btn btn-ghost" onClick={handleReset}>Reset to Default</button>
        )}
        {activeTab === 'users' && isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>+ Add User</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['company', '🏢 Company'], ...(isAdmin ? [['users', '👥 Users']] : [])].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              color: activeTab === key ? 'var(--gold)' : 'var(--muted)',
              borderBottom: activeTab === key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Company Settings Tab */}
      {activeTab === 'company' && (
        <>
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            ℹ️ These settings are saved locally on this device and appear on printed invoices.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <div className="card-title">🏢 Company Identity</div>
              <div className="input-group">
                <label className="input-label">Company / Business Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
                  style={{ fontSize: '15px', fontWeight: '600' }} />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>This appears as the large heading on your invoice</div>
              </div>
              <div className="input-group">
                <label className="input-label">Full Address</label>
                <textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="input-row cols-2">
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">📋 GST & Legal Details</div>
              <div className="input-group">
                <label className="input-label">GSTIN</label>
                <input className="input" value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())}
                  maxLength={15} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }} />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>15-character GST Identification Number</div>
              </div>
              <div className="input-group">
                <label className="input-label">Place of Supply (State)</label>
                <input className="input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Delhi (07)" />
              </div>
            </div>

            <div className="card">
              <div className="card-title">🏦 Bank Details (for Invoice)</div>
              <div className="input-row cols-2">
                <div className="input-group">
                  <label className="input-label">Bank Name</label>
                  <input className="input" value={form.bank} onChange={e => set('bank', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Branch Name</label>
                  <input className="input" value={form.branch} onChange={e => set('branch', e.target.value)} />
                </div>
              </div>
              <div className="input-row cols-2">
                <div className="input-group">
                  <label className="input-label">Account Number</label>
                  <input className="input" value={form.account} onChange={e => set('account', e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">IFSC Code</label>
                  <input className="input" value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">👁️ Invoice Header Preview</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#555', marginBottom: '4px' }}>TAX INVOICE</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>{form.name || 'Your Company Name'}</div>
                <div style={{ fontSize: '10px', color: '#333', marginTop: '4px' }}>{form.address}</div>
                <div style={{ fontSize: '10px', color: '#333' }}>Tel: {form.phone} | {form.email}</div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#555', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
                  <strong>GSTIN: {form.gstin}</strong>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.8' }}>
                <div>🏦 <strong>Bank:</strong> {form.bank} — {form.branch}</div>
                <div>💳 <strong>A/C:</strong> {form.account}</div>
                <div>🔑 <strong>IFSC:</strong> {form.ifsc}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={handleReset}>🔄 Reset</button>
            <button className="btn btn-primary" onClick={handleSave} style={{ padding: '12px 32px', fontSize: '15px' }}>
              {saved ? '✅ Saved!' : '💾 Save Company Settings'}
            </button>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && isAdmin && (
        <div>
          {/* Add User Modal */}
          {showAddUser && (
            <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
              <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Add New User</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddUser(false)}>✕</button>
                </div>
                <form onSubmit={handleAddUser}>
                  <div className="modal-body">
                    <div className="input-group">
                      <label className="input-label">Full Name *</label>
                      <input className="input" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required placeholder="e.g. Raju Kumar" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email *</label>
                      <input className="input" type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required placeholder="worker@rfi.com" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Password *</label>
                      <input className="input" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required placeholder="Min 6 characters" minLength={6} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Role</label>
                      <select className="input" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                        <option value="worker">Worker (Stock update only)</option>
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {newUser.role === 'worker' && (
                      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                        🔒 Worker can only access the Quick Stock Update page
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAddUser(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={addingUser}>{addingUser ? 'Creating...' : 'Create User'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-container">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👥</div><p>No users found</p></div></td></tr>
                  ) : users.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.email}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>
                        {u.isActive
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Inactive</span>}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className={'btn btn-sm ' + (u.isActive ? 'btn-ghost' : 'btn-primary')} onClick={() => toggleUser(u)}
                            disabled={u._id === user?._id}>
                            {u.isActive ? '🔒 Deactivate' : '✅ Activate'}
                          </button>
                          {u._id !== user?._id && (
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
