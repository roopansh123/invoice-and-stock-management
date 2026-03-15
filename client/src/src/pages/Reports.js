import React, { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler);

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const COLORS = ['#c9a84c', '#4caf82', '#5b9bd5', '#e09050', '#e05050', '#9b59b6', '#1abc9c'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/dashboard/reports', { params: { from, to } });
      setData(res.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const categoryChart = {
    labels: data?.categoryWise?.map(c => c._id || 'Unknown') || [],
    datasets: [{
      label: 'Revenue',
      data: data?.categoryWise?.map(c => c.revenue) || [],
      backgroundColor: COLORS,
      borderRadius: 6,
    }]
  };

  const paymentChart = {
    labels: data?.paymentWise?.map(p => p._id) || [],
    datasets: [{
      data: data?.paymentWise?.map(p => p.total) || [],
      backgroundColor: COLORS,
      borderWidth: 0,
    }]
  };

  const dailyChart = {
    labels: data?.dailySales?.map(d => {
      const [y,m,day] = d._id.split('-');
      return `${day}/${m}`;
    }) || [],
    datasets: [{
      label: 'Daily Revenue',
      data: data?.dailySales?.map(d => d.revenue) || [],
      backgroundColor: 'rgba(201,168,76,0.15)',
      borderColor: '#c9a84c',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#c9a84c',
      pointRadius: 4,
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw) } } },
    scales: {
      x: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62', font: { size: 11 } } },
      y: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62', callback: v => '₹' + (v >= 1000 ? (v/1000)+'k' : v) } }
    }
  };

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
          <button className="btn btn-primary" onClick={fetchReports}>Apply</button>
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : !data ? null : (
        <div>
          {/* Daily Sales Chart */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title">Daily Sales Revenue</div>
            {data.dailySales?.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}><p>No sales in this date range</p></div>
            ) : (
              <Line data={dailyChart} options={chartOpts} height={80} />
            )}
          </div>

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            {/* Category Chart */}
            <div className="card">
              <div className="card-title">Revenue by Category</div>
              {data.categoryWise?.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><p>No data</p></div>
              ) : (
                <>
                  <Bar data={categoryChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} height={160} />
                  <div style={{ marginTop: '12px' }}>
                    {data.categoryWise?.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span>{c._id || 'Other'}</span>
                        </div>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(c.revenue)}</span>
                          <span style={{ color: 'var(--muted)', fontSize: '11px', marginLeft: '8px' }}>{c.qty} pairs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Chart */}
            <div className="card">
              <div className="card-title">Revenue by Payment Method</div>
              {data.paymentWise?.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><p>No data</p></div>
              ) : (
                <>
                  <div style={{ maxWidth: '220px', margin: '0 auto 16px' }}>
                    <Doughnut data={paymentChart} options={{
                      responsive: true,
                      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw)}` } } }
                    }} />
                  </div>
                  {data.paymentWise?.map((p, i) => {
                    const total = data.paymentWise.reduce((s, x) => s + x.total, 0);
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
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
                </>
              )}
            </div>
          </div>

          {/* Summary Table */}
          <div className="card">
            <div className="card-title">Summary Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'Total Revenue', val: fmt(data.dailySales?.reduce((s,d)=>s+d.revenue,0)), icon: '💰' },
                { label: 'Total Orders', val: data.dailySales?.reduce((s,d)=>s+d.orders,0), icon: '📑' },
                { label: 'Categories Sold', val: data.categoryWise?.length, icon: '👟' },
                { label: 'Avg Order Value', val: fmt((data.dailySales?.reduce((s,d)=>s+d.revenue,0))/(data.dailySales?.reduce((s,d)=>s+d.orders,0)||1)), icon: '📊' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '20px', color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>{stat.val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
