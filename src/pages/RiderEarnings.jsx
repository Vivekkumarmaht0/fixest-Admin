import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function RiderEarnings() {
  const [earnings, setEarnings] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Flat rate per completed task
  const RATE_PER_TASK = 50; 

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch completed bookings for this rider
        // We consider it a "completed task" if it reached 'Device Picked Up' (for pickup) 
        // or 'Delivered' (for delivery). Actually, let's just fetch all where rider is assigned 
        // and status indicates some completion.
        
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('assigned_rider', user.id)
          .in('status', ['Device Picked Up', 'Diagnosing', 'Awaiting Customer Approval', 'Repair Approved', 'Repaired', 'Out for Delivery', 'Delivered'])
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Simplistic calculation: If they are assigned and it's past "Device Picked Up", they did the pickup (+50)
        // If it's "Delivered", they did the delivery (+50)
        let totalEarnings = 0;
        const tasks = [];

        (data || []).forEach(b => {
          // If past picked up
          if (['Device Picked Up', 'Diagnosing', 'Awaiting Customer Approval', 'Repair Approved', 'Repaired', 'Out for Delivery', 'Delivered'].includes(b.status)) {
            tasks.push({
              id: `${b.id}-pickup`,
              type: 'Pickup',
              order: b.service_id,
              date: b.updated_at,
              amount: RATE_PER_TASK
            });
            totalEarnings += RATE_PER_TASK;
          }
          // If delivered
          if (b.status === 'Delivered') {
            tasks.push({
              id: `${b.id}-delivery`,
              type: 'Delivery',
              order: b.service_id,
              date: b.updated_at,
              amount: RATE_PER_TASK
            });
            totalEarnings += RATE_PER_TASK;
          }
        });

        // Sort by date descending
        tasks.sort((a, b) => new Date(b.date) - new Date(a.date));

        setCompletedTasks(tasks);
        setEarnings(totalEarnings);

      } catch (err) {
        console.error('Error fetching earnings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 rounded-2xl h-[200px] w-full"></div>
        <div className="space-y-3 mt-6">
          <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="bg-gradient-to-r from-[#2e7d32] to-[#4caf50] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-[24px] font-bold mb-1">My Earnings</h2>
        <p className="text-[14px] text-white/80">Estimated payouts for completed tasks.</p>
        
        <div className="mt-6 flex gap-4">
          <div className="bg-white/20 px-4 py-3 rounded-xl backdrop-blur-sm min-w-[120px]">
            <span className="block text-[11px] text-white/80 uppercase font-semibold tracking-wider">Total Earned</span>
            <span className="text-[24px] font-extrabold flex items-center gap-1">
              ₹{earnings}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[16px] font-bold text-[#0b1c30]">Task History</h3>
        
        {completedTasks.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-[#c3c6d7]/30">
            <span className="material-symbols-outlined text-[#737686] text-[48px] mb-3 opacity-50">account_balance_wallet</span>
            <p className="text-[#0b1c30] font-bold">No Earnings Yet</p>
            <p className="text-[#737686] text-[13px] mt-1">Complete pickups and deliveries to earn.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] ${
                    task.type === 'Pickup' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#f57c00]/10 text-[#f57c00]'
                  }`}>
                    <span className="material-symbols-outlined">{task.type === 'Pickup' ? 'home_repair_service' : 'local_shipping'}</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0b1c30]">{task.order || 'Unknown Order'}</h4>
                    <p className="text-[12px] text-[#737686]">{task.type} • {new Date(task.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[16px] font-extrabold text-[#2e7d32]">+₹{task.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
