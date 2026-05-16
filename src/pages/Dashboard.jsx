import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status');

      if (error) throw error;

      const counts = data.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === 'Ready / Delivered') acc.completed++;
        else if (curr.status === 'Cancelled') acc.cancelled++;
        else acc.pending++;
        return acc;
      }, { total: 0, pending: 0, completed: 0, cancelled: 0 });

      setStats(counts);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Mon', bookings: 4 },
    { name: 'Tue', bookings: 7 },
    { name: 'Wed', bookings: 5 },
    { name: 'Thu', bookings: 9 },
    { name: 'Fri', bookings: 12 },
    { name: 'Sat', bookings: 8 },
    { name: 'Sun', bookings: 3 },
  ];

  if (loading) return <div className="p-8">Loading stats...</div>;

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, Admin</p>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Total Bookings"
          value={stats.total}
          icon={<Package className="w-6 h-6 text-blue-500" />}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Active Repairs"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-amber-500" />}
          trend="+5%"
          color="amber"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          trend="+18%"
          color="emerald"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={<AlertCircle className="w-6 h-6 text-rose-500" />}
          trend="-2%"
          color="rose"
        />
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Weekly Booking Trends</h3>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Quick Actions</h3>
          <div className="actions-list">
            <button className="action-item">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Generate Sales Report</span>
            </button>
            <button className="action-item">
              <Users className="w-5 h-5 text-primary" />
              <span>Manage Technicians</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon-wrapper">
        {icon}
      </div>
      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <div className="stat-value-row">
          <h2 className="stat-value">{value}</h2>
          <span className="stat-trend">{trend}</span>
        </div>
      </div>
    </div>
  );
}
