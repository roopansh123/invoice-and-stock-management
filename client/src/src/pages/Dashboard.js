import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><p>Could not load dashboard data.</p></div>;

  const chartData = {
    labels: data.monthlyData?.map(m => m.month) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: data.monthlyData?.map(m => m.revenue) || [],
      backgroundColor: 'rgba(201,168,76,0.15)',
      borderColor: '#c9a84c',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#c9a84c',
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: ctx => '₹' + ctx.raw.toLocaleString('en-IN') }
    }},
    scales: {
      x: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62' } },
      y: { grid: { color: '#2e2924' }, ticks: { color: '#7a6f62', callback: v => '₹' + (v/1000)+'k' } }
    }
  };

  const paymentData = {
    labels: data.paymentWise?.map(p => p._id) || [],
    datasets: [{
      data: data.paymentWise?.map(p => p.total) || [],
      backgroundColor: ['#c9a84c','#4caf82','#5b9bd5','#e09050','#e05050','#7a6f62'],
    }]
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening at DURGA FOOTWEAR.</p>
        </div>
        <Link to="/billing/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value">{fmt(data.today?.revenue)}</div>
          <div className="stat-sub">{data.today?.orders} orders today</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">{fmt(data.month?.revenue)}</div>
          <div className="stat-sub">{data.month?.orders} orders this month</div>
          <div className="stat-icon">📈</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Yearly Revenue</div>
          <div className="stat-value">{fmt(data.year?.revenue)}</div>
          <div className="stat-sub">{data.year?.orders} total orders</div>
          <div className="stat-icon">🏆</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Pending Payments</div>
          <div className="stat-value">{fmt(data.pendingPayments?.amount)}</div>
          <div className="stat-sub">{data.pendingPayments?.count} invoices pending</div>
          <div className="stat-icon">⚠️</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{data.inventory?.lowStock}</div>
          <div className="stat-sub">{data.inventory?.outOfStock} out of stock</div>
          <div className="stat-icon">📦</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{data.customers?.total}</div>
          <div className="stat-sub">{data.inventory?.total} products in catalog</div>
          <div className="stat-icon">👥</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-title">Revenue Trend (Last 6 Months)</div>
          <Line data={chartData} options={chartOptions} height={100} />
        </div>
        <div className="card">
          <div className="card-title">Top Products This Month</div>
          {data.topProducts?.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}><p>No sales data yet</p></div>
          ) : (
            <div>
              {data.topProducts?.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{p.name || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{p.sku} · {p.totalQty} pairs sold</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{fmt(p.totalRevenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Recent Invoices</div>
          <Link to="/billing" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {data.recentInvoices?.length === 0 ? (
          <div className="empty-state"><p>No invoices yet. <Link to="/billing/new" style={{ color: 'var(--gold)' }}>Create your first invoice</Link></p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices?.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)' }}>{inv.invoiceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer?.name || inv.customerSnapshot?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{inv.customer?.phone || inv.customerSnapshot?.phone}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(inv.grandTotal)}</td>
                    <td>
                      <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-green' : inv.paymentStatus === 'Partial' ? 'badge-orange' : 'badge-red'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><Link to={`/billing/${inv._id}`} className="btn btn-ghost btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
