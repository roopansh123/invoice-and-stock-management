import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler);

const fmt  = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmt2 = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLORS = ['#c9a84c', '#4caf82', '#5b9bd5', '#e09050', '#e05050', '#9b59b6', '#1abc9c'];

const chartOpts = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw) } } },
  scales: {
    x: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62', font: { size: 11 } } },
    y: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62', callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) } }
  }
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('gst');
  const [data, setData]           = useState(null);
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [invLoading, setInvLoading] = useState(false);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [to, setTo]     = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/dashboard/reports', { params: { from, to } });
      setData(res.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const fetchInvoices = async (type) => {
    setInvLoading(true);
    try {
      const res = await API.get('/invoices', { params: { from, to, limit: 200 } });
      const all = res.data.invoices || [];
      if (type === 'gst')  setInvoices(all.filter(i => i.invoiceType === 'GST'));
      else                 setInvoices(all.filter(i => i.invoiceType !== 'GST'));
    } catch { toast.error('Failed to load invoices'); }
    finally { setInvLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    if (activeTab === 'gst' || activeTab === 'cash') fetchInvoices(activeTab);
  }, [activeTab, from, to]);

  const handleApply = () => { fetchReports(); fetchInvoices(activeTab); };

  // GST summary stats from invoices
  const gstInvoices  = invoices.filter(i => i.invoiceType === 'GST');
  const cashInvoices = invoices.filter(i => i.invoiceType !== 'GST');

  const sumField = (arr, field) => arr.reduce((s, i) => s + (i[field] || 0), 0);

  const dailyChart = {
    labels: data?.dailySales?.map(d => { const [,m,day] = d._id.split('-'); return `${day}/${m}`; }) || [],
    datasets: [{ label: 'Daily Revenue', data: data?.dailySales?.map(d => d.revenue) || [],
      backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#c9a84c', borderWidth: 2,
      fill: true, tension: 0.4, pointBackgroundColor: '#c9a84c', pointRadius: 4 }]
  };

  const paymentChart = {
    labels: data?.paymentWise?.map(p => p._id) || [],
    datasets: [{ data: data?.paymentWise?.map(p => p.total) || [], backgroundColor: COLORS, borderWidth: 0 }]
  };

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'gst',      label: '🧾 GST Bills' },
    { key: 'cash',     label: '💵 Cash Bills' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Business insights and performance metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: '145px' }} />
          <span style={{ color: 'var(--muted)' }}>to</span>
          <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: '145px' }} />
          <button className="btn btn-primary" onClick={handleApply}>Apply</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px',
              color: activeTab === t.key ? 'var(--gold)' : 'var(--muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        loading ? <div className="loading-center"><div className="spinner" /></div> : !data ? null : (
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-title">Daily Sales Revenue</div>
              {data.dailySales?.length === 0
                ? <div className="empty-state" style={{ padding: '40px' }}><p>No sales in this date range</p></div>
                : <Line data={dailyChart} options={chartOpts} height={80} />}
            </div>

            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div className="card">
                <div className="card-title">Revenue by Payment Method</div>
                {data.paymentWise?.length === 0
                  ? <div className="empty-state" style={{ padding: '30px' }}><p>No data</p></div>
                  : <>
                    <div style={{ maxWidth: '220px', margin: '0 auto 16px' }}>
                      <Doughnut data={paymentChart} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw)}` } } } }} />
                    </div>
                    {data.paymentWise?.map((p, i) => {
                      const total = data.paymentWise.reduce((s, x) => s + x.total, 0);
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                            <span>{p._id}</span>
                          </div>
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(p.total)}</span>
                            <span style={{ color: 'var(--muted)', fontSize: '11px', marginLeft: '8px' }}>{((p.total / total) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </>}
              </div>

              <div className="card">
                <div className="card-title">Summary Statistics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Total Revenue',   val: fmt(data.dailySales?.reduce((s,d)=>s+d.revenue,0)),  icon: '💰' },
                    { label: 'Total Orders',    val: data.dailySales?.reduce((s,d)=>s+d.orders,0),        icon: '📑' },
                    { label: 'Avg Order Value', val: fmt((data.dailySales?.reduce((s,d)=>s+d.revenue,0))/(data.dailySales?.reduce((s,d)=>s+d.orders,0)||1)), icon: '📊' },
                    { label: 'Payment Methods', val: data.paymentWise?.length,                            icon: '💳' },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>{stat.val}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ─── GST BILLS TAB ─── */}
      {activeTab === 'gst' && (
        <div>
          {/* GST Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Total GST Bills',   val: gstInvoices.length,                       icon: '🧾', color: 'var(--gold)' },
              { label: 'Taxable Amount',    val: fmt(sumField(gstInvoices,'totalTaxable')), icon: '💰', color: 'var(--green)' },
              { label: 'Total GST Collected', val: fmt(sumField(gstInvoices,'totalGST')),  icon: '🏛️', color: '#5b9bd5' },
              { label: 'Grand Total',       val: fmt(sumField(gstInvoices,'grandTotal')),   icon: '📊', color: 'var(--cream)' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* GST Breakdown */}
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="card">
              <div className="card-title">GST Breakdown</div>
              {[
                { label: 'Total Taxable Amount', val: sumField(gstInvoices, 'totalTaxable') },
                { label: 'Total CGST',           val: sumField(gstInvoices, 'totalCGST') },
                { label: 'Total SGST',           val: sumField(gstInvoices, 'totalSGST') },
                { label: 'Total IGST',           val: sumField(gstInvoices, 'totalIGST') },
                { label: 'Total GST',            val: sumField(gstInvoices, 'totalGST') },
                { label: 'Grand Total (incl. GST)', val: sumField(gstInvoices, 'grandTotal') },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: i === 5 ? 'var(--cream)' : 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: i === 5 ? 800 : 600, color: i === 5 ? 'var(--gold)' : 'var(--text)' }}>{fmt2(row.val)}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Payment Method Breakdown</div>
              {Object.entries(gstInvoices.reduce((acc, inv) => {
                const m = inv.paymentMethod || 'Cash';
                acc[m] = (acc[m] || 0) + inv.grandTotal;
                return acc;
              }, {})).map(([method, total], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span>{method}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GST Invoice List */}
          <div className="card">
            <div className="card-title">GST Invoice List ({gstInvoices.length})</div>
            {invLoading ? <div className="loading-center"><div className="spinner" /></div> :
            gstInvoices.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🧾</div><p>No GST invoices in this period</p></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Sale Type</th>
                      <th style={{ textAlign: 'right' }}>Taxable</th>
                      <th style={{ textAlign: 'right' }}>CGST</th>
                      <th style={{ textAlign: 'right' }}>SGST</th>
                      <th style={{ textAlign: 'right' }}>IGST</th>
                      <th style={{ textAlign: 'right' }}>Grand Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstInvoices.map(inv => (
                      <tr key={inv._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{inv.invoiceNumber}</td>
                        <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{inv.customerSnapshot?.name || '—'}</td>
                        <td><span style={{ fontSize: '11px', color: inv.saleType === 'intrastate' ? 'var(--green)' : '#5b9bd5' }}>{inv.saleType === 'intrastate' ? 'Intra' : 'Inter'}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt2(inv.totalTaxable)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmt2(inv.totalCGST)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmt2(inv.totalSGST)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmt2(inv.totalIGST)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt2(inv.grandTotal)}</td>
                        <td style={{ fontSize: '12px' }}>{inv.paymentMethod}</td>
                        <td>{inv.paymentStatus === 'Paid'
                          ? <span className="badge badge-green">Paid</span>
                          : <span className="badge badge-orange">Unpaid</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--surface2)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: '8px', fontSize: '13px' }}>TOTAL ({gstInvoices.length} bills)</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px' }}>{fmt2(sumField(gstInvoices,'totalTaxable'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px' }}>{fmt2(sumField(gstInvoices,'totalCGST'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px' }}>{fmt2(sumField(gstInvoices,'totalSGST'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px' }}>{fmt2(sumField(gstInvoices,'totalIGST'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px', color: 'var(--gold)' }}>{fmt2(sumField(gstInvoices,'grandTotal'))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CASH BILLS TAB ─── */}
      {activeTab === 'cash' && (
        <div>
          {/* Cash Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Total Cash Bills',  val: cashInvoices.length,                      icon: '💵', color: 'var(--gold)' },
              { label: 'Total Amount',      val: fmt(sumField(cashInvoices,'grandTotal')),  icon: '💰', color: 'var(--green)' },
              { label: 'Amount Collected',  val: fmt(sumField(cashInvoices,'paidAmount')),  icon: '✅', color: '#4caf82' },
              { label: 'Outstanding',       val: fmt(sumField(cashInvoices,'grandTotal') - sumField(cashInvoices,'paidAmount')), icon: '⏳', color: '#e09050' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            {/* Daily cash sales */}
            <div className="card">
              <div className="card-title">Daily Cash Sales</div>
              {(() => {
                const dailyMap = cashInvoices.reduce((acc, inv) => {
                  const d = new Date(inv.createdAt).toISOString().split('T')[0];
                  acc[d] = (acc[d] || 0) + inv.grandTotal;
                  return acc;
                }, {});
                const labels = Object.keys(dailyMap).sort().map(d => { const [,m,day] = d.split('-'); return `${day}/${m}`; });
                const values = Object.keys(dailyMap).sort().map(d => dailyMap[d]);
                if (labels.length === 0) return <div className="empty-state" style={{ padding: '30px' }}><p>No cash bills in this period</p></div>;
                return <Bar data={{ labels, datasets: [{ data: values, backgroundColor: '#c9a84c88', borderColor: '#c9a84c', borderWidth: 2, borderRadius: 4 }] }} options={chartOpts} height={160} />;
              })()}
            </div>

            {/* Payment method for cash */}
            <div className="card">
              <div className="card-title">Payment Method Breakdown</div>
              {Object.entries(cashInvoices.reduce((acc, inv) => {
                const m = inv.paymentMethod || 'Cash';
                acc[m] = (acc[m] || 0) + inv.grandTotal;
                return acc;
              }, {})).map(([method, total], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span>{method}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(total)}</span>
                </div>
              ))}
              {cashInvoices.length === 0 && <div className="empty-state" style={{ padding: '20px' }}><p>No data</p></div>}
            </div>
          </div>

          {/* Cash Bill List */}
          <div className="card">
            <div className="card-title">Cash Bill List ({cashInvoices.length})</div>
            {invLoading ? <div className="loading-center"><div className="spinner" /></div> :
            cashInvoices.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💵</div><p>No cash bills in this period</p></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Items</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Paid</th>
                      <th style={{ textAlign: 'right' }}>Due</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashInvoices.map(inv => {
                      const due = inv.grandTotal - (inv.paidAmount || 0);
                      return (
                        <tr key={inv._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{inv.invoiceNumber}</td>
                          <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ fontWeight: 600 }}>{inv.customerSnapshot?.name || '—'}</td>
                          <td><span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>{inv.invoiceType || 'Cash'}</span></td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{inv.items?.length || 0}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt2(inv.grandTotal)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{fmt2(inv.paidAmount || 0)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: due > 0 ? 'var(--red)' : 'var(--muted)' }}>{due > 0 ? fmt2(due) : '—'}</td>
                          <td style={{ fontSize: '12px' }}>{inv.paymentMethod}</td>
                          <td>{inv.paymentStatus === 'Paid'
                            ? <span className="badge badge-green">Paid</span>
                            : <span className="badge badge-orange">Unpaid</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--surface2)', fontWeight: 700 }}>
                      <td colSpan={5} style={{ padding: '8px', fontSize: '13px' }}>TOTAL ({cashInvoices.length} bills)</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px', color: 'var(--gold)' }}>{fmt2(sumField(cashInvoices,'grandTotal'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px', color: 'var(--green)' }}>{fmt2(sumField(cashInvoices,'paidAmount'))}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', padding: '8px', color: 'var(--red)' }}>{fmt2(sumField(cashInvoices,'grandTotal') - sumField(cashInvoices,'paidAmount'))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
