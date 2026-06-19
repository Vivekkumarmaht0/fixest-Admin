import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { SkeletonTable, SkeletonCard } from '../components/ui/SkeletonVariants';

const ALL_STATUSES = ['All', 'Booking Received', 'Awaiting Customer Approval', 'Repair Approved', 'Device Picked Up', 'Diagnosing', 'Repaired', 'Out for Delivery', 'Delivered', 'Cancelled'];
const UPDATE_STATUSES = ALL_STATUSES.slice(1);

const STATUS_BADGE = {
  'Booking Received':           'bg-[#d3e4fe] text-[#0b1c30] border-[#c3c6d7]/30',
  'Awaiting Customer Approval': 'bg-amber-50 text-amber-800 border-amber-200/40',
  'Repair Approved':            'bg-violet-50 text-violet-800 border-violet-200/40',
  'Device Picked Up':           'bg-[#e1e0ff] text-[#3e3fcc] border-[#585be6]/20',
  'Diagnosing':                 'bg-[#fff3cd] text-[#7a5a00] border-[#ffc107]/20',
  'Repaired':                   'bg-[#e5eeff] text-[#004ac6] border-[#004ac6]/20',
  'Out for Delivery':           'bg-[#c9e6ff]/60 text-[#004666] border-[#39b8fd]/30',
  'Delivered':                  'bg-emerald-50 text-emerald-700 border-emerald-300/30',
  'Cancelled':                  'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/20',
};
const STATUS_DOT = {
  'Booking Received':           'bg-[#737686]',
  'Awaiting Customer Approval': 'bg-amber-500 animate-pulse',
  'Repair Approved':            'bg-violet-500',
  'Device Picked Up':           'bg-[#3e3fcc] animate-pulse',
  'Diagnosing':                 'bg-amber-500 animate-pulse',
  'Repaired':                   'bg-[#004ac6] animate-pulse',
  'Out for Delivery':           'bg-[#006591]',
  'Delivered':                  'bg-emerald-600',
  'Cancelled':                  'bg-[#ba1a1a]',
};

const FILTER_SHORT = {
  'All':                        'All',
  'Booking Received':           'Received',
  'Awaiting Customer Approval': 'Awaiting Approval',
  'Repair Approved':            'Approved',
  'Device Picked Up':           'Picked Up',
  'Diagnosing':                 'Diagnosing',
  'Repaired':                   'Repaired',
  'Out for Delivery':           'Out for Delivery',
  'Delivered':                  'Delivered',
  'Cancelled':                  'Cancelled',
};

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getDeviceIcon(category = '', model = '') {
  const cat = (category || '').toLowerCase();
  const mdl = (model || '').toLowerCase();
  if (cat.includes('laptop') || mdl.includes('macbook') || mdl.includes('laptop')) return 'laptop';
  if (cat.includes('tablet') || mdl.includes('ipad') || mdl.includes('tablet')) return 'tablet_mac';
  if (cat.includes('watch') || mdl.includes('apple watch') || mdl.includes('wearable')) return 'watch';
  return 'phone_iphone';
}

function formatBookingId(b) {
  if (!b) return '';
  const idStr = (b.service_id || b.id).toUpperCase();
  return idStr.startsWith('#') ? idStr : '#' + idStr;
}

function getMobileStatusStyle(status = '') {
  const s = status || 'Booking Received';
  if (s === 'Awaiting Customer Approval') return { bg: 'bg-amber-50 text-amber-700 border-transparent', dot: 'bg-amber-500 animate-pulse', label: 'Awaiting Approval' };
  if (s === 'Repair Approved')            return { bg: 'bg-violet-50 text-violet-700 border-transparent', dot: 'bg-violet-500', label: 'Repair Approved' };
  if (s === 'Out for Delivery')           return { bg: 'bg-cyan-50 text-cyan-700 border-transparent', dot: 'bg-cyan-500', label: 'Out for Delivery' };
  if (s === 'Diagnosing')                 return { bg: 'bg-[#fff3cd] text-[#7a5a00] border-transparent', dot: 'bg-amber-500', label: 'Diagnosing' };
  if (s === 'Delivered')                  return { bg: 'bg-emerald-50 text-emerald-700 border-transparent', dot: 'bg-emerald-600', label: 'Delivered' };
  if (s === 'Booking Received')           return { bg: 'bg-[#f1f5f9] text-[#64748b] border-transparent', dot: 'bg-[#64748b]', label: 'Received' };
  if (s === 'Repaired')                   return { bg: 'bg-[#e0f2fe] text-[#0284c7] border-transparent', dot: 'bg-[#0284c7]', label: 'Repaired' };
  if (s === 'Device Picked Up')           return { bg: 'bg-amber-50 text-amber-600 border-transparent', dot: 'bg-amber-500', label: 'Picked Up' };
  if (s === 'Cancelled')                  return { bg: 'bg-red-50 text-red-600 border-transparent', dot: 'bg-red-600', label: 'Cancelled' };
  return { bg: 'bg-slate-50 text-slate-600 border-transparent', dot: 'bg-slate-600', label: s };
}

/* ─────────────────────────────────────────────────────────────
   DetailPanel — defined OUTSIDE Bookings to prevent remounting
   on every parent state change (e.g. repairCostInput keystrokes)
   ───────────────────────────────────────────────────────────── */
function DetailPanel({ selected, onClose, updating, onUpdateStatus, repairCostInput, onRepairCostChange, savingCost, costSaved, onSaveRepairCost, onMarkPaid, onProcessRefund }) {
  const [copied, setCopied] = React.useState(false);
  const [phoneCopied, setPhoneCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(formatBookingId(selected));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(selected.phone_number);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  const issueText = selected.issue_details || '';
  const hasPromo = issueText.includes('[PROMO_APPLIED:');
  let cleanIssue = issueText;
  let promoCode = '';

  if (hasPromo) {
    const match = issueText.match(/\[PROMO_APPLIED:\s*(.+?)\]/);
    if (match) {
      promoCode = match[1];
      cleanIssue = issueText.replace(/\[PROMO_APPLIED:\s*.+?\]/g, '').trim();
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] select-none text-left">
      {/* Drawer drag handle */}
      <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-3 flex-shrink-0" />

      {/* Header */}
      <div className="px-5 pb-4 flex items-start justify-between flex-shrink-0 bg-transparent">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#e5eeff] text-[#004ac6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-pulse" />
              {formatBookingId(selected)}
            </span>
            <button
              onClick={handleCopyId}
              className="text-[#004ac6] hover:bg-[#e5eeff] p-1 rounded-md transition-all flex items-center justify-center"
              title="Copy ID"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
            <span className="text-[11px] text-slate-500 font-medium ml-2">
              {new Date(selected.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="text-[21px] font-extrabold text-slate-900 mt-1.5 leading-tight tracking-tight">
            {selected.brand} {selected.model}
          </h2>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300/80 active:scale-95 flex items-center justify-center text-slate-600 transition-all flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">

        {/* CUSTOMER */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[15px] font-extrabold text-[#004ac6] shadow-sm flex-shrink-0">
                  {initials(selected.full_name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[15px] text-slate-900 leading-tight truncate">{selected.full_name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-slate-500 text-[12px] font-medium truncate">{selected.phone_number}</p>
                    <button 
                      onClick={handleCopyPhone}
                      className="text-[#004ac6] hover:bg-[#e5eeff] p-0.5 rounded transition-all flex items-center justify-center"
                      title="Copy Phone"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {phoneCopied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <a href={`tel:${selected.phone_number}`}
                className="w-10 h-10 rounded-full bg-[#004ac6] hover:bg-[#003cb0] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-sm transition-all flex-shrink-0">
                <span className="material-symbols-outlined text-[19px] icon-fill">phone</span>
              </a>
            </div>
            {(selected.house_no || selected.area || selected.city) && (
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5 flex-shrink-0">location_on</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.house_no || ''}, ${selected.area || ''}, ${selected.city || ''}, ${selected.pincode || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-slate-600 font-medium hover:text-[#004ac6] hover:underline"
                >
                  {[selected.house_no, selected.area, selected.city].filter(Boolean).join(', ')} {selected.pincode ? `- ${selected.pincode}` : ''}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* DEVICE & ISSUE */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Device & Issue</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-start gap-1">
              <span className="material-symbols-outlined text-[20px] text-slate-400">home_repair_service</span>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-1">Mode</p>
              <p className="font-bold text-[13px] text-slate-900 truncate w-full">{selected.service_mode || 'Workshop'}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-start gap-1">
              <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_month</span>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-1">Schedule</p>
              <p className="font-bold text-[13px] text-slate-900 truncate w-full">
                {selected.visit_date
                  ? new Date(selected.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : '—'}
                {selected.time_slot ? `, ${selected.time_slot}` : ''}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 mt-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#ba1a1a] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[19px] font-bold icon-fill">handyman</span>
              <h4 className="font-bold text-[14.5px] text-slate-900">{selected.primary_issue || 'Repair Issue'}</h4>
            </div>
            <p className="text-slate-600 text-[12.5px] leading-relaxed mt-1 whitespace-pre-wrap">
              {cleanIssue && cleanIssue !== 'N/A'
                ? cleanIssue
                : `Customer requested diagnosis and repair for ${selected.brand} ${selected.model}. Reported issue: ${selected.primary_issue}.`}
            </p>
            {promoCode && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg w-max border border-emerald-200">
                <span className="material-symbols-outlined text-[15px]">local_offer</span>
                Promo Applied: {promoCode}
              </div>
            )}
          </div>
        </div>

        {/* PAYMENT STATUS */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Payment Status</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.08em]">Advance</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.advance_payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className={`text-[12px] font-bold ${selected.advance_payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selected.advance_payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
              {selected.advance_payment_status === 'paid' && (
                <p className="text-[11px] text-slate-500 font-semibold">₹{selected.booking_fee || 197}</p>
              )}
              {selected.advance_payment_status !== 'paid' && selected.payment_mode === 'COD' && (
                <div className="mt-1 flex flex-col gap-1">
                  <button
                    onClick={() => onMarkPaid('advance', 'cod')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">payments</span>
                    Mark Paid (COD)
                  </button>
                  <button
                    onClick={() => onMarkPaid('advance', 'upi')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">account_balance_wallet</span>
                    Mark Paid (Online)
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selected.payment_mode === 'COD' ? '💵 COD booking' : '💳 Online booking'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.08em]">Repair Cost</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  selected.final_payment_status === 'paid' ? 'bg-emerald-500' :
                  selected.final_repair_cost > 0 ? 'bg-blue-400' : 'bg-slate-300'
                }`} />
                <span className={`text-[12px] font-bold ${
                  selected.final_payment_status === 'paid' ? 'text-emerald-700' :
                  selected.final_repair_cost > 0 ? 'text-blue-700' : 'text-slate-400'
                }`}>
                  {selected.final_payment_status === 'paid' ? 'Paid' :
                   selected.final_repair_cost > 0 ? 'Awaiting' : 'Not Set'}
                </span>
              </div>
              {selected.final_repair_cost > 0 && (
                <p className="text-[11px] text-slate-500 font-semibold">₹{selected.final_repair_cost}</p>
              )}
              {selected.final_repair_cost > 0 && selected.final_payment_status !== 'paid' && (
                <div className="mt-1 flex flex-col gap-1">
                  <button
                    onClick={() => onMarkPaid('repair', 'cod')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">payments</span>
                    Mark Paid (COD)
                  </button>
                  <button
                    onClick={() => onMarkPaid('repair', 'upi')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[13px]">account_balance_wallet</span>
                    Mark Paid (Online)
                  </button>
                </div>
              )}
              {selected.final_payment_status === 'paid' && (
                <button
                  onClick={() => onProcessRefund()}
                  disabled={updating}
                  className="mt-1 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[13px]">currency_exchange</span>
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SET REPAIR COST */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Set Repair Cost</p>
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            {selected.final_payment_status === 'paid' ? (
              <div className="flex items-center gap-2 py-1">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                <p className="text-[13px] font-bold text-emerald-700">Repair cost of ₹{selected.final_repair_cost} has been paid by the customer.</p>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
                  Enter the final repair cost confirmed by the technician. Customer will see this and can pay via UPI online — or choose to pay at delivery time.
                </p>

                {/* ── Amount input row — stable, no layout shift ── */}
                <div className="flex gap-2 items-stretch">
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[15px] font-bold pointer-events-none select-none">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={repairCostInput}
                      onChange={e => onRepairCostChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') onSaveRepairCost(); }}
                      placeholder="e.g. 1500"
                      className="w-full h-11 pl-8 pr-3 rounded-xl border-2 border-slate-200 focus:border-[#004ac6] focus:outline-none text-[15px] font-bold text-slate-900 bg-slate-50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={onSaveRepairCost}
                    disabled={savingCost || !repairCostInput || parseFloat(repairCostInput) <= 0}
                    className="h-11 flex items-center gap-1.5 px-4 rounded-xl bg-[#004ac6] hover:bg-[#003cb0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap flex-shrink-0"
                  >
                    {savingCost ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : costSaved ? (
                      <span className="material-symbols-outlined text-[17px]">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[17px]">save</span>
                    )}
                    {savingCost ? 'Saving…' : costSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>

                {/* Status messages — fixed height so they don't shift layout */}
                <div className="mt-2 min-h-[20px]">
                  {costSaved && (
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Cost updated — customer will see ₹{selected.final_repair_cost} in their dashboard.
                    </p>
                  )}
                  {!costSaved && selected.customer_decision !== 'approved' && selected.final_repair_cost > 0 && (
                    <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Awaiting customer repair approval before payment unlocks.
                    </p>
                  )}
                  {!costSaved && selected.customer_decision === 'approved' && selected.final_repair_cost > 0 && selected.final_payment_status !== 'paid' && (
                    <p className="text-[11px] text-violet-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock_open</span>
                      Payment unlocked — customer can pay online or at delivery.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* STATUS UPDATES */}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Status Updates</p>
          <div className="grid grid-cols-2 gap-2">
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
              const active = selected.status === item.status;
              return (
                <button
                  key={item.status}
                  onClick={() => onUpdateStatus(selected.id, item.status)}
                  disabled={updating}
                  className={`rounded-xl p-3 border flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97] disabled:opacity-50
                    ${active ? `${item.activeClass} font-extrabold` : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[11px] font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200/60 bg-white flex-shrink-0 safe-bottom">
        <button onClick={() => alert('Invoice generated successfully!')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-[14px] text-white bg-[#004ac6] hover:bg-[#003cb0] hover:shadow-lg active:scale-[0.98] transition-all shadow-md">
          <span className="material-symbols-outlined text-[19px]">receipt_long</span>
          Generate Invoice
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bookings page
   ───────────────────────────────────────────────────────────── */
export default function Bookings() {
  const location = useLocation();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearch]     = useState('');
  const [statusFilter, setFilter]   = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected]     = useState(null);
  const [updating, setUpdating]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [repairCostInput, setRepairCostInput] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [costSaved, setCostSaved]   = useState(false);

  const getStatusCount = (s) => {
    if (s === 'All') return bookings.length;
    return bookings.filter(b => b.status === s).length;
  };

  useEffect(() => { fetchBookings(); }, []);

  useEffect(() => {
    if (bookings.length > 0 && location.state?.searchBookingId) {
      const targetId = location.state.searchBookingId.toUpperCase();
      const b = bookings.find(x => formatBookingId(x) === targetId || x.service_id?.toUpperCase() === targetId || x.id.toUpperCase() === targetId);
      if (b) {
        setSelected(b);
        setShowDetail(true);
        setSearch(targetId);
        setFilter('All');
        setRepairCostInput(b.final_repair_cost ? String(b.final_repair_cost) : '');
        // Clean up state
        window.history.replaceState({}, document.title);
      }
    }
  }, [bookings, location.state]);

  useEffect(() => {
    if (showDetail && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDetail]);

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const updateStatus = useCallback(async (id, newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUpdating(false); }
  }, []);

  const handleSelect = useCallback((booking) => {
    if (selected?.id === booking.id) {
      setSelected(null);
      setShowDetail(false);
    } else {
      setSelected(booking);
      setShowDetail(true);
      setRepairCostInput(booking.final_repair_cost ? String(booking.final_repair_cost) : '');
      setCostSaved(false);
    }
  }, [selected]);

  const handleRepairCostChange = useCallback((val) => {
    setRepairCostInput(val);
    setCostSaved(false);
  }, []);

  const saveRepairCost = useCallback(async () => {
    if (!selected) return;
    const cost = parseFloat(repairCostInput);
    if (isNaN(cost) || cost <= 0) return;
    setSavingCost(true);
    setCostSaved(false);
    try {
      const updatePayload = { final_repair_cost: cost };
      const approvalStatuses = ['Awaiting Customer Approval', 'Repair Approved', 'Repaired', 'Final Payment Pending', 'Final Payment Received', 'Out for Delivery', 'Delivered'];
      if (!approvalStatuses.includes(selected.status)) {
        updatePayload.status = 'Awaiting Customer Approval';
      }
      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', selected.id);
      if (error) throw error;
      const updated = { ...selected, final_repair_cost: cost, ...updatePayload };
      setBookings(prev => prev.map(b => b.id === selected.id ? { ...b, ...updatePayload } : b));
      setSelected(updated);
      setCostSaved(true);
      setTimeout(() => setCostSaved(false), 3000);
    } catch (err) {
      alert('Failed to save repair cost: ' + err.message);
    } finally {
      setSavingCost(false);
    }
  }, [selected, repairCostInput]);

  const handleClose = useCallback(() => {
    setSelected(null);
    setShowDetail(false);
  }, []);

  const markPaid = useCallback(async (type, method) => {
    if (!selected) return;
    const methodDisplay = method === 'upi' ? 'Online/UPI' : 'COD';
    if (!confirm(`Are you sure you want to mark the ${type} payment as Received (${methodDisplay})?`)) return;
    
    setUpdating(true);
    try {
      const payload = type === 'advance' 
        ? { advance_payment_status: 'paid', payment_mode: method === 'upi' ? 'Prepaid' : 'COD' }
        : { final_payment_status: 'paid', final_payment_method: method, status: 'Final Payment Received' };

      const { error } = await supabase.from('bookings').update(payload).eq('id', selected.id);
      if (error) throw error;
      
      const updated = { ...selected, ...payload };
      setBookings(prev => prev.map(b => b.id === selected.id ? updated : b));
      setSelected(updated);
    } catch (err) {
      alert('Failed to mark payment as paid: ' + err.message);
    } finally {
      setUpdating(false);
    }
  }, [selected]);

  const processRefund = useCallback(async () => {
    if (!selected) return;
    const reason = prompt("Enter reason for refund (optional):");
    if (reason === null) return; // user cancelled prompt
    
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://wpwmmlkowxxbwpoeullq.supabase.co/functions/v1/issue-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ booking_id: selected.id, reason })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to process refund");

      alert("Refund processed successfully!");
      fetchBookings(true);
    } catch (err) {
      alert("Refund error: " + err.message);
    } finally {
      setUpdating(false);
    }
  }, [selected]);

  const filtered = bookings.filter(b => {
    const q = searchTerm.toLowerCase();
    
    let dateMatch = true;
    if (dateFilter) {
      const targetDate = b.visit_date || b.created_at;
      const bDate = targetDate ? targetDate.split('T')[0] : '';
      dateMatch = (bDate === dateFilter);
    }

    return (
      ((b.full_name || '').toLowerCase().includes(q) ||
       (b.service_id || '').toLowerCase().includes(q) ||
       (b.phone_number || '').includes(searchTerm)) &&
      (statusFilter === 'All' || b.status === statusFilter) &&
      dateMatch
    );
  });

  const detailPanelProps = {
    selected,
    onClose: handleClose,
    updating,
    onUpdateStatus: updateStatus,
    repairCostInput,
    onRepairCostChange: handleRepairCostChange,
    savingCost,
    costSaved,
    onSaveRepairCost: saveRepairCost,
    onMarkPaid: markPaid,
    onProcessRefund: processRefund,
  };

  const setQuickDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    // Local date string for filtering
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    setDateFilter(offsetDate.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page Header */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Manage Bookings</h2>
          <p className="text-[13px] text-[#434655] mt-0.5">{bookings.length} total repair requests</p>
        </div>
      </div>

      {/* ── Mobile Detail Drawer ── */}
      {selected && showDetail && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={handleClose} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl flex flex-col mobile-sheet bg-[#f1f5f9] overflow-hidden safe-bottom animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)] h-[90vh]">
            <DetailPanel {...detailPanelProps} />
          </div>
        </div>,
        document.body
      )}

      {/* ── Mobile Filter Bottom Sheet ── */}
      {showFilters && createPortal(
        <div className="fixed inset-0 z-[100] sm:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl flex flex-col bg-[#f1f5f9] overflow-hidden safe-bottom animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)] max-h-[80vh]">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="px-5 pb-4 flex items-center justify-between bg-transparent flex-shrink-0">
              <h3 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Filter by Status</h3>
              <button onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300/80 active:scale-95 flex items-center justify-center text-slate-600 transition-all flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
              {ALL_STATUSES.map(s => {
                const count = getStatusCount(s);
                const isSel = statusFilter === s;
                const dotColor = STATUS_DOT[s] || 'bg-slate-400';
                return (
                  <button key={s} onClick={() => { setFilter(s); setShowFilters(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.99] text-left
                      ${isSel ? 'bg-white border-[#004ac6] ring-1 ring-[#004ac6]/10 shadow-[0_4px_12px_rgba(0,74,198,0.05)]' : 'bg-white border-transparent hover:bg-slate-50 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                      <span className={`text-[13.5px] font-bold ${isSel ? 'text-[#004ac6]' : 'text-slate-700'}`}>{s}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${isSel ? 'bg-[#004ac6] text-white' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Content */}
      <div className="flex gap-5 items-start">
        {/* Table Panel */}
        <div className="flex-1 bg-transparent sm:bg-white sm:glass-card rounded-none sm:rounded-2xl overflow-hidden flex flex-col min-w-0">

          {/* Toolbar */}
          <div className="bg-transparent sm:bg-white/30 border-b border-transparent sm:border-white/40 px-4 py-4 sm:px-4 sm:py-4 space-y-3">
            {/* ROW 1: Search, Refresh, Filter */}
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1 min-w-0">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[18px] pointer-events-none">search</span>
                <input type="text" placeholder="Search…" value={searchTerm}
                  onChange={e => setSearch(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-[13px] text-[#0b1c30] placeholder:text-[#737686]" />
              </div>
              <button onClick={() => fetchBookings(true)} disabled={refreshing}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[#004ac6] font-bold text-[13px] hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60 flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={() => setShowFilters(true)}
                className="sm:hidden w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 shadow-sm bg-white border-[#e2e8f0] text-[#64748b] hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </div>

            {/* ROW 2: Date, Today, Tomorrow */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 w-full">
              <div className="relative min-w-[125px] flex-shrink-0">
                <input type="date" value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="glass-input w-full pl-8 pr-2 py-1.5 rounded-xl text-[12px] text-[#0b1c30] placeholder:text-[#737686] cursor-pointer bg-white border border-[#e2e8f0]" />
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#004ac6] text-[16px] pointer-events-none">calendar_month</span>
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#ba1a1a] hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-all bg-white shadow-sm" title="Clear date">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                )}
              </div>
              <button onClick={() => setQuickDate(0)} 
                className="px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all whitespace-nowrap border bg-white border-[#e2e8f0] text-[#004ac6] hover:bg-[#004ac6]/5 flex-shrink-0 shadow-sm">
                Today
              </button>
              <button onClick={() => setQuickDate(1)} 
                className="px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all whitespace-nowrap border bg-white border-[#e2e8f0] text-[#004ac6] hover:bg-[#004ac6]/5 flex-shrink-0 shadow-sm">
                Tomorrow
              </button>
              {dateFilter && (
                <button onClick={() => setDateFilter('')} 
                  className="px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all whitespace-nowrap border bg-white border-[#e2e8f0] text-[#ba1a1a] hover:bg-red-50 flex-shrink-0 shadow-sm">
                  Clear
                </button>
              )}
            </div>

            <div className="hidden sm:flex flex-wrap items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {ALL_STATUSES.map(s => {
                const count = getStatusCount(s);
                const isSel = statusFilter === s;
                return (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all whitespace-nowrap border flex items-center gap-1.5 flex-shrink-0
                      ${isSel ? 'bg-[#004ac6] text-white border-[#004ac6] shadow-sm' : 'text-[#434655] bg-white border-[#e2e8f0] hover:bg-slate-50'}`}>
                    <span>{FILTER_SHORT[s] || s}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${isSel ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden flex-1 overflow-y-auto p-0 space-y-4 bg-transparent">
            {loading ? (
              <div className="space-y-4 px-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 text-[#434655] py-16 bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
                <span className="material-symbols-outlined text-[52px] text-[#c3c6d7]">search_off</span>
                <p className="font-semibold text-[#0b1c30] text-[15px]">No bookings found</p>
                <p className="text-[12px] text-center text-[#737686]">Adjust your search or filter criteria.</p>
              </div>
            ) : (
              filtered.map((b) => {
                const isSel = selected?.id === b.id;
                const style = getMobileStatusStyle(b.status);
                const bookingId = formatBookingId(b);
                const deviceIcon = getDeviceIcon(b.device_category, b.model);
                return (
                  <div key={b.id} onClick={() => handleSelect(b)}
                    className={`bg-white rounded-2xl p-5 transition-all duration-150 border cursor-pointer active:scale-[0.98] shadow-[0_2px_8px_rgba(0,0,0,0.03)]
                      ${isSel ? 'border-[#004ac6] ring-1 ring-[#004ac6]/10' : 'border-transparent'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px] text-[#737686] font-semibold tracking-wider font-mono">{bookingId}</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${style.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-[17px] text-[#0f172a] mt-2 leading-snug">{b.full_name}</h4>
                    <div className="flex items-center gap-2 text-[13px] text-[#64748b] mt-1.5">
                      <span className="material-symbols-outlined text-[19px] text-[#64748b]">{deviceIcon}</span>
                      <span>{b.brand} {b.model}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block flex-1 overflow-auto">
            {loading ? (
              <div className="p-4">
                <SkeletonTable columns={6} rows={5} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 text-[#434655] py-16">
                <span className="material-symbols-outlined text-[52px] text-[#c3c6d7]">search_off</span>
                <p className="font-semibold text-[#0b1c30] text-[15px]">No bookings found</p>
                <p className="text-[12px]">Adjust your search or filter criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse" style={{ minWidth: '500px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#e5eeff]/60 border-b border-[#c3c6d7]/40 backdrop-blur-sm">
                    <th className="py-3 px-5 text-[11px] font-bold text-[#434655] uppercase tracking-wider">ID</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Customer</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Device</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-[#434655] uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-5"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#0b1c30]">
                  {filtered.map((b, i) => {
                    const isSel = selected?.id === b.id;
                    const sc = STATUS_BADGE[b.status] || STATUS_BADGE['Booking Received'];
                    const dc = STATUS_DOT[b.status] || 'bg-[#737686]';
                    return (
                      <tr key={b.id} onClick={() => handleSelect(b)}
                        className={`border-b border-white/20 cursor-pointer transition-all duration-150
                          ${i % 2 === 1 ? 'bg-white/40' : 'bg-transparent'}
                          ${isSel ? 'bg-[#004ac6]/8 border-l-4 !border-l-[#004ac6]' : 'hover:bg-white/70'}`}>
                        <td className="py-3 px-5 font-mono font-bold text-[#004ac6] whitespace-nowrap">{formatBookingId(b)}</td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[10px] font-bold text-[#0b1c30] flex-shrink-0">{initials(b.full_name)}</div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate max-w-[140px]">{b.full_name}</div>
                              <div className="text-[10px] text-[#737686]">{b.phone_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-[#434655]">
                          <div>{b.brand} {b.model}</div>
                          <div className="text-[11px] text-[#737686] capitalize">{b.device_category}</div>
                        </td>
                        <td className="py-3 px-5 text-[#434655] hidden md:table-cell whitespace-nowrap">
                          <div className="font-semibold text-[12px]">{new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                          <div className="text-[10px] text-[#737686]">{new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${sc}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dc}`} />
                            {b.status || 'Received'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isSel ? 'text-[#004ac6] rotate-90' : 'text-[#737686]'}`}>chevron_right</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-3.5 sm:px-5 py-2.5 border-t border-white/30 bg-white/20 text-[11px] sm:text-[12px] text-[#737686]">
              Showing {filtered.length} of {bookings.length} bookings
            </div>
          )}
        </div>

        {/* Desktop Detail Panel */}
        {selected && (
          <div className="hidden lg:flex w-[360px] flex-shrink-0 glass-card rounded-2xl flex-col overflow-hidden bg-white sticky top-[96px]" style={{ height: 'calc(100vh - 128px)' }}>
            <DetailPanel {...detailPanelProps} />
          </div>
        )}
      </div>
    </div>
  );
}
