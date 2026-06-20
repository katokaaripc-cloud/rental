'use client';
import { useState, useEffect } from 'react';
import { Trash2, Check, User, Phone, Calendar, Car } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = () => {
    fetch('/api/bookings').then(res => res.json()).then(data => setBookings(data)).catch(() => setError('Failed to load bookings'));
  };

  const handleConfirmBooking = async (booking) => {
    setError('');
    const r1 = await fetch(`/api/cars/${booking.carId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: true })
    });
    const r2 = await fetch(`/api/bookings?id=${booking.id}`, { method: 'DELETE' });
    if (!r1.ok || !r2.ok) {
      const e = await (r1.ok ? r2 : r1).json().catch(() => ({}));
      setError(e.error || 'Failed to confirm booking');
    }
    fetchBookings();
  };

  const handleDeleteBooking = async (id) => {
    setError('');
    const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error || 'Failed to delete booking');
    }
    fetchBookings();
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">Booking Requests</h1>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <User size={16} className="text-blue-600"/> Requests ({bookings.length})
          </h2>
        </div>
        {bookings.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400 font-medium">No booking requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="p-3 pl-4">Car</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 pl-4 font-medium text-slate-900 flex items-center gap-2">
                      <Car size={14} className="text-slate-400"/> {b.carName}
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="flex items-center gap-2">
                        <User size={14} className="text-slate-400 shrink-0"/> {b.fullName}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0"/> {b.phoneNumber}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400 shrink-0"/> {b.timestamp}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleConfirmBooking(b)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Confirm & hide car (mark as rented)"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove booking request"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
