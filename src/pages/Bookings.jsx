import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.service_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone_number.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bookings-page">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Bookings Management</h1>
          <p>View and update repair requests</p>
        </div>
        <button onClick={fetchBookings} className="refresh-btn">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, Name or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-filters">
          {['All', 'Booking Received', 'Technician Assigned', 'Diagnosis & Repair', 'Quality Check', 'Ready / Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`filter-tag ${statusFilter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bookings-container">
        <div className="bookings-list">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No bookings found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service ID</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={selectedBooking?.id === booking.id ? 'selected' : ''}
                  >
                    <td>
                      <span className="font-mono font-bold text-primary">{booking.service_id}</span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <span className="font-bold block">{booking.full_name}</span>
                        <span className="text-xs text-slate-500">{booking.phone_number}</span>
                      </div>
                    </td>
                    <td>
                      <div className="device-info">
                        <span className="block">{booking.brand} {booking.model}</span>
                        <span className="text-xs text-slate-500 capitalize">{booking.device_category}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      <span className="text-sm">{format(new Date(booking.created_at), 'MMM dd, HH:mm')}</span>
                    </td>
                    <td>
                      <button className="p-2 hover:bg-slate-100 rounded-full">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedBooking && (
          <div className="booking-details-panel">
            <div className="panel-header">
              <h2>Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} className="close-btn">×</button>
            </div>

            <div className="panel-body">
              <div className="detail-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{selectedBooking.brand} {selectedBooking.model}</h3>
                    <p className="text-sm text-slate-500 capitalize">{selectedBooking.device_category} Repair</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="info-item">
                    <label>Primary Issue</label>
                    <p>{selectedBooking.primary_issue}</p>
                  </div>
                  <div className="info-item">
                    <label>Service Mode</label>
                    <p>{selectedBooking.service_mode}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Customer Info</h4>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    {selectedBooking.phone_number}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{selectedBooking.house_no}, {selectedBooking.area}, {selectedBooking.city} - {selectedBooking.pincode}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Appointment</h4>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-3">
                  <Calendar className="w-4 h-4" />
                  {selectedBooking.visit_date} at {selectedBooking.time_slot}
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Update Status</h4>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {[
                    'Booking Received',
                    'Technician Assigned',
                    'Diagnosis & Repair',
                    'Quality Check',
                    'Ready / Delivered',
                    'Cancelled'
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedBooking.id, s)}
                      className={`status-option ${selectedBooking.status === s ? 'active' : ''}`}
                    >
                      {selectedBooking.status === s && <CheckCircle2 className="w-4 h-4" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button className="whatsapp-btn">
                <MessageCircle className="w-5 h-5" />
                Contact via WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Booking Received': 'bg-blue-100 text-blue-700',
    'Technician Assigned': 'bg-purple-100 text-purple-700',
    'Diagnosis & Repair': 'bg-amber-100 text-amber-700',
    'Quality Check': 'bg-indigo-100 text-indigo-700',
    'Ready / Delivered': 'bg-emerald-100 text-emerald-700',
    'Cancelled': 'bg-rose-100 text-rose-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function MessageCircle({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
