import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

export default function RiderTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusCategory, setStatusCategory] = useState('All');
  const [timeLeft, setTimeLeft] = useState(15);
  const [visitedNew, setVisitedNew] = useState(false);
  const prevCountRef = useRef(0);

  const fetchTasks = async (uid) => {
    try {
      setLoading(true);
      // Fetch bookings where this rider is assigned
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('assigned_rider', uid)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Map bookings to rider tasks based on booking status
      const mappedTasks = (data || []).map(b => {
        let taskType = 'task';

        // Infer task type based on booking status
        if (['Booking Received', 'Awaiting Customer Approval', 'Repair Approved', 'Device Picked Up', 'Diagnosing'].includes(b.status)) {
          taskType = 'pickup';
        } else if (['Repaired', 'Out for Delivery', 'Delivered'].includes(b.status)) {
          taskType = 'delivery';
        }

        return {
          id: b.id, // Using booking ID as task ID
          booking: b,
          task_type: taskType,
          status: b.status
        };
      });

      setTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching rider tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setProfileId(user.id);
      await fetchTasks(user.id);

      // Real-time sync for instant updates alongside notifications
      const channel = supabase
        .channel(`rider-tasks-${user.id}`)
        .on('postgres', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchTasks(user.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    let cleanup;
    init().then(fn => cleanup = fn);
    return () => { if (cleanup) cleanup(); };
  }, []);

  // 15-second auto update
  useEffect(() => {
    if (!profileId) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchTasks(profileId);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [profileId]);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks(profileId);
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e, bookingId) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `device-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('device-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('device-images').getPublicUrl(filePath);
      
      // Fetch current booking to get existing images
      const { data: bData } = await supabase.from('bookings').select('device_images').eq('id', bookingId).single();
      const currentImages = bData?.device_images || [];
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ device_images: [...currentImages, data.publicUrl] })
        .eq('id', bookingId);

      if (updateError) throw updateError;
      
      alert('Photo uploaded successfully!');
      fetchTasks(profileId);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const formatAddress = (b) => {
    const parts = [b.house_no, b.area, b.city, b.pincode];
    return parts.filter(Boolean).join(', ') || 'No Address Provided';
  };

  const newTasksCount = tasks.filter(task => {
    if (dateFilter) {
      const b = task.booking;
      const targetDate = b.visit_date || b.created_at;
      const bDate = targetDate ? targetDate.split('T')[0] : '';
      if (bDate !== dateFilter) return false;
    }
    return ['Booking Received', 'Awaiting Customer Approval'].includes(task.status);
  }).length;

  useEffect(() => {
    if (newTasksCount > prevCountRef.current) {
      setVisitedNew(false);
    }
    prevCountRef.current = newTasksCount;
  }, [newTasksCount]);

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-10 w-20 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded"></div>
                  <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-200 rounded"></div>
                <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedTask = expandedTask ? tasks.find(t => t.id === expandedTask) : null;

  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const yesterdayStr = new Date(new Date().getTime() - 86400000 - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const setQuickDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    setDateFilter(offsetDate.toISOString().split('T')[0]);
  };

  const filteredTasks = tasks.filter(task => {
    // 1. Date Filter
    if (dateFilter) {
      const b = task.booking;
      const targetDate = b.visit_date || b.created_at;
      const bDate = targetDate ? targetDate.split('T')[0] : '';
      if (bDate !== dateFilter) return false;
    }

    // 2. Status Category Filter
    const s = task.status;
    if (statusCategory === 'New') {
      if (!['Booking Received', 'Awaiting Customer Approval'].includes(s)) return false;
    } else if (statusCategory === 'Active') {
      if (!['Device Picked Up', 'Diagnosing', 'Repair Approved', 'Repaired', 'Out for Delivery'].includes(s)) return false;
    } else if (statusCategory === 'Completed') {
      if (!['Delivered', 'Cancelled'].includes(s)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-bold tracking-tight text-[#0b1c30]">My Bookings</h2>
        <p className="text-[13px] text-[#434655]">Manage your pickups and deliveries.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button 
          onClick={() => setQuickDate(0)} 
          className={`px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${dateFilter === todayStr ? 'bg-[#004ac6] text-white border-[#004ac6]' : 'bg-white text-[#434655] border-[#c3c6d7] hover:border-[#004ac6]'}`}
        >
          Today
        </button>
        <button 
          onClick={() => setQuickDate(-1)} 
          className={`px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${dateFilter === yesterdayStr ? 'bg-[#004ac6] text-white border-[#004ac6]' : 'bg-white text-[#434655] border-[#c3c6d7] hover:border-[#004ac6]'}`}
        >
          Yesterday
        </button>
        <div className="relative">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
            className={`px-4 py-1.5 text-[13px] font-bold rounded-lg border focus:outline-none transition-colors cursor-pointer min-h-[36px] ${dateFilter && dateFilter !== todayStr && dateFilter !== yesterdayStr ? 'bg-[#004ac6] text-white border-[#004ac6]' : 'bg-white text-[#434655] border-[#c3c6d7] hover:border-[#004ac6]'}`}
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')} 
              className="absolute -right-2 -top-2 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center border border-red-200 transition-colors z-10"
              title="Clear Filter"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracking Categories */}
      <div className="w-full mb-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {['All', 'New', 'Active', 'Completed'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setStatusCategory(cat);
                if (cat === 'New') setVisitedNew(true);
              }}
              className={`relative px-3 py-2 sm:px-4 sm:py-1.5 text-[12px] sm:text-[13px] font-bold rounded-xl sm:rounded-full whitespace-nowrap transition-all border ${
                statusCategory === cat 
                  ? 'bg-[#004ac6] text-white border-[#004ac6] shadow-sm' 
                  : 'bg-white text-[#737686] border-[#c3c6d7] hover:border-[#004ac6] hover:text-[#0b1c30]'
              }`}
            >
              {cat === 'All' ? 'All Bookings' : cat === 'New' ? 'New Bookings' : cat === 'Active' ? 'In Progress' : 'Completed'}
              {cat === 'New' && newTasksCount > 0 && !visitedNew && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#ba1a1a] border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#c3c6d7]/30 shadow-sm">
            <span className="material-symbols-outlined text-[#737686] text-[48px] mb-3 opacity-50">task</span>
            <p className="text-[#0b1c30] font-bold">No Tasks Assigned</p>
            <p className="text-[#737686] text-[13px] mt-1">You currently have no pickups or deliveries assigned for this date.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const b = task.booking;
            return (
              <div 
                key={task.id} 
                className="bg-white rounded-2xl p-4 border border-[#c3c6d7]/30 hover:border-[#004ac6]/30 transition-all duration-300 shadow-sm cursor-pointer"
                onClick={() => setExpandedTask(task.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${task.task_type === 'pickup' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#f57c00]/10 text-[#f57c00]'}`}>
                      {task.task_type}
                    </span>
                    <h4 className="font-bold text-[#0b1c30] text-[15px]">{b.service_id || 'Unknown Order'}</h4>
                    <p className="text-[12px] text-[#737686] mt-1">{b.full_name} • {b.phone_number}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-[#434655] bg-slate-50 border border-slate-200 w-max px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-[14px] text-[#004ac6]">schedule</span>
                      {b.visit_date ? new Date(b.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} 
                      {b.time_slot ? `, ${b.time_slot}` : `, ${new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded border text-[11px] font-bold ${
                      ['Delivered', 'Cancelled'].includes(task.status) ? 'bg-slate-50 text-slate-700 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {task.status.toUpperCase()}
                    </span>
                    <span className="material-symbols-outlined text-[#004ac6] text-[20px] bg-[#004ac6]/5 p-1 rounded-full">
                      open_in_new
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Popup for Details */}
      {selectedTask && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setExpandedTask(null)}
        >
          <div 
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative no-scrollbar" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setExpandedTask(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-[#737686] hover:text-[#0b1c30] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            
            <div className="mb-5 pr-8">
              <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${selectedTask.task_type === 'pickup' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#f57c00]/10 text-[#f57c00]'}`}>
                {selectedTask.task_type}
              </span>
              <h3 className="font-bold text-[#0b1c30] text-[20px]">
                {selectedTask.booking.service_id || 'Unknown Order'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Customer Info */}
              <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100">
                <p className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider mb-2">Customer</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#004ac6]">person</span>
                  <span className="text-[13px] font-bold text-[#0b1c30]">{selectedTask.booking.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#004ac6]">call</span>
                  <a href={`tel:${selectedTask.booking.phone_number}`} className="text-[13px] font-medium text-[#004ac6] hover:underline">{selectedTask.booking.phone_number}</a>
                </div>
              </div>

              {/* Address Info */}
              <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100">
                <p className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider mb-2">Location</p>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#f57c00] mt-0.5">location_on</span>
                  <p className="text-[13px] font-medium text-[#434655] leading-snug">
                    {formatAddress(selectedTask.booking)}
                  </p>
                </div>
                <div className="mt-2 ml-6">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(selectedTask.booking))}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[12px] font-semibold text-[#004ac6] hover:underline flex items-center gap-1"
                  >
                    Open in Maps <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Upload Device Photos Section */}
            <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                Device Photos
              </p>
              
              {(selectedTask.booking.device_images || []).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                  {selectedTask.booking.device_images.map((img, i) => (
                    <img key={i} src={img} alt="Device" className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                  ))}
                </div>
              )}

              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={(e) => handlePhotoUpload(e, selectedTask.id)}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button 
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-[12px] text-[#004ac6] bg-[#004ac6]/10 border border-[#004ac6]/20 transition-all hover:bg-[#004ac6]/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <><span className="w-4 h-4 border-2 border-[#004ac6]/30 border-t-[#004ac6] rounded-full animate-spin" /> Uploading...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">add_a_photo</span> Take Photo / Upload</>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons / Status Updates */}
            <div className="mb-2">
              <p className="text-[11px] font-semibold text-[#737686] uppercase tracking-wider mb-3">Update Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { status: 'Booking Received',           label: 'Received',        icon: 'inbox',                   activeClass: 'bg-slate-100 border-slate-300 text-slate-700 ring-1 ring-slate-300/30' },
                  { status: 'Device Picked Up',            label: 'Picked Up',       icon: 'hail',                    activeClass: 'bg-amber-50 border-amber-300 text-amber-700 ring-1 ring-amber-300/30' },
                  { status: 'Diagnosing',                  label: 'Diagnosing',      icon: 'precision_manufacturing', activeClass: 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-300/30' },
                  { status: 'Awaiting Customer Approval',  label: 'Await Approval',  icon: 'pending_actions',         activeClass: 'bg-amber-50 border-amber-300 text-amber-700 ring-1 ring-amber-300/30' },
                  { status: 'Repair Approved',             label: 'Approved',        icon: 'verified',                activeClass: 'bg-violet-50 border-violet-300 text-violet-700 ring-1 ring-violet-300/30' },
                  { status: 'Repaired',                    label: 'Repaired',        icon: 'check_circle',            activeClass: 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-300/30' },
                  { status: 'Out for Delivery',            label: 'Out for Delivery',icon: 'local_shipping',          activeClass: 'bg-cyan-50 border-cyan-300 text-cyan-700 ring-1 ring-cyan-300/30' },
                  { status: 'Delivered',                   label: 'Delivered',       icon: 'task_alt',                activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-300/30' },
                  { status: 'Cancelled',                   label: 'Cancelled',       icon: 'cancel',                  activeClass: 'bg-red-50 border-red-300 text-red-700 ring-1 ring-red-300/30' },
                ].map(item => {
                  const active = selectedTask.status === item.status;
                  return (
                    <button
                      key={item.status}
                      onClick={() => updateTaskStatus(selectedTask.id, item.status)}
                      disabled={loading}
                      className={`rounded-xl p-3 border flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97] disabled:opacity-50
                        ${active ? `${item.activeClass} font-extrabold` : 'bg-white border-[#c3c6d7]/30 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span className="text-[11px] font-bold text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-update Indicator */}
      <div className="flex justify-center items-center py-4 mt-4 mb-2 opacity-70">
        <p className="text-[12px] text-[#434655] font-semibold flex items-center gap-2">
          <span className={`material-symbols-outlined text-[16px] text-[#004ac6] ${timeLeft === 15 ? 'animate-spin' : ''}`}>sync</span>
          Auto-updating in {timeLeft}s
        </p>
      </div>
    </div>
  );
}
