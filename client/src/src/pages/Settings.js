import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const defaultCompany = {
  name: 'DURGA FOOTWEAR',
  address: '313/13E, Ground Floor, Inder Lok, New Delhi - 110035',
  phone: '9810000000',
  email: 'info@rfi.com',
  gstin: '07XXXXXXXXXXXXXXX',
  pan: 'XXXXX0000X',
  state: 'Delhi (07)',
  bank: 'Punjab National Bank',
  branch: 'Shahzada Bagh, Delhi',
  account: '0000000000000',
  ifsc: 'PUNB0000000',
};

export default function Settings() {
  const [form, setForm] = useState(defaultCompany);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('rfi_company') || '{}');
      setForm(prev => ({ ...prev, ...stored }));
    } catch {}
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('rfi_company', JSON.stringify(form));
      toast.success('Company settings saved!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setForm(defaultCompany);
    localStorage.removeItem('rfi_company');
    toast.success('Reset to defaults');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Company Settings</h1>
          <p className="page-subtitle">These details appear on every printed invoice</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={handleReset}>Reset to Default</button>
        </div>
      </div>

      {/* Live preview banner */}
      <div className="alert alert-success" style={{ marginBottom: '24px' }}>
        ℹ️ These settings are saved locally on this device and appear on printed invoices.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Company Identity */}
        <div className="card">
          <div className="card-title">🏢 Company Identity</div>

          <div className="input-group">
            <label className="input-label">Company / Business Name *</label>
            <input className="input" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ram Footware Industries"
              style={{ fontSize: '15px', fontWeight: '600' }} />
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              This appears as the large heading on your invoice
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Full Address</label>
            <textarea className="input" rows={2} value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Street, Area, City, State - Pincode" />
          </div>

          <div className="input-row cols-2">
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="9810000000" />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input className="input" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="info@rfi.com" />
            </div>
          </div>
        </div>

        {/* GST & Legal */}
        <div className="card">
          <div className="card-title">📋 GST & Legal Details</div>

          <div className="input-group">
            <label className="input-label">GSTIN</label>
            <input className="input" value={form.gstin}
              onChange={e => set('gstin', e.target.value.toUpperCase())}
              placeholder="07AAQFD9277L1ZJ" maxLength={15}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }} />
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              15-character GST Identification Number
            </div>
          </div>

          <div className="input-row cols-2">
            <div className="input-group">
              <label className="input-label">PAN Number</label>
              <input className="input" value={form.pan}
                onChange={e => set('pan', e.target.value.toUpperCase())}
                placeholder="AAQFD9277L" maxLength={10}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }} />
            </div>
            <div className="input-group">
              <label className="input-label">Place of Supply (State)</label>
              <input className="input" value={form.state}
                onChange={e => set('state', e.target.value)}
                placeholder="Delhi (07)" />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <div className="card-title">🏦 Bank Details (for Invoice)</div>

          <div className="input-row cols-2">
            <div className="input-group">
              <label className="input-label">Bank Name</label>
              <input className="input" value={form.bank}
                onChange={e => set('bank', e.target.value)}
                placeholder="Punjab National Bank" />
            </div>
            <div className="input-group">
              <label className="input-label">Branch Name</label>
              <input className="input" value={form.branch}
                onChange={e => set('branch', e.target.value)}
                placeholder="Shahzada Bagh, Delhi" />
            </div>
          </div>

          <div className="input-row cols-2">
            <div className="input-group">
              <label className="input-label">Account Number</label>
              <input className="input" value={form.account}
                onChange={e => set('account', e.target.value)}
                placeholder="0818050032814"
                style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
            <div className="input-group">
              <label className="input-label">IFSC Code</label>
              <input className="input" value={form.ifsc}
                onChange={e => set('ifsc', e.target.value.toUpperCase())}
                placeholder="PUNB0081820"
                style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="card">
          <div className="card-title">👁️ Invoice Header Preview</div>
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '16px', background: '#fff', color: '#000',
            fontFamily: 'Arial, sans-serif', fontSize: '12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#555', marginBottom: '4px' }}>TAX INVOICE</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>{form.name || 'Your Company Name'}</div>
            <div style={{ fontSize: '10px', color: '#333', marginTop: '4px' }}>{form.address}</div>
            <div style={{ fontSize: '10px', color: '#333' }}><strong>PAN: {form.pan}</strong></div>
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

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={handleReset}>🔄 Reset</button>
        <button className="btn btn-primary" onClick={handleSave}
          style={{ padding: '12px 32px', fontSize: '15px' }}>
          {saved ? '✅ Saved!' : '💾 Save Company Settings'}
        </button>
      </div>
    </div>
  );
}
