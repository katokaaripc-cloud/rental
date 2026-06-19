'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link'; 
import { ArrowLeft, Gauge, Zap, Compass, Users, Wind, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarDetailPage({ params }) {
  const unwrappedParams = use(params);
  const [car, setCar] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    fetch(`/api/cars/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(data => setCar(data));
  }, [unwrappedParams.id]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setBookingStatus('sending');

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phoneNumber, carName: car.name, carId: car.id })
    });

    if (res.ok) {
      setBookingStatus('success');
      setFullName('');
      setPhoneNumber('');
    } else {
      setBookingStatus('error');
    }
  };

  if (!car) return <div className="p-12 text-center text-slate-500">Loading Vehicle Blueprint Specifications Data...</div>;
  const images = car.images?.length ? car.images : car.image ? [car.image] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 font-medium">
          <ArrowLeft size={16} /> Back to fleet showcase
        </Link>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="bg-slate-100 min-h-[350px] flex flex-col">
            <div className="relative flex-1 flex items-center justify-center">
              <img src={images[currentImage]} alt={car.name} className="w-full h-full object-cover absolute inset-0" />
              {images.length > 1 && <>
                <button onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm transition"><ChevronLeft size={18}/></button>
                <button onClick={() => setCurrentImage(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm transition"><ChevronRight size={18}/></button>
              </>}
            </div>
            {images.length > 1 && <div className="flex gap-2 p-3 bg-white border-t border-slate-100 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${i === currentImage ? 'border-slate-900' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>}
          </div>

          <div className="p-8 md:p-12 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 tracking-widest uppercase">{car.type} — {car.fuel}</span>
              <h1 className="text-3xl font-black text-slate-900 mt-2 mb-3">{car.name}</h1>
              <p className="text-2xl font-bold text-emerald-600 mb-6">{car.pricePerDay} MAD <span className="text-sm text-slate-400 font-normal">/ day</span></p>
              <p className="text-slate-600 leading-relaxed mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">{car.description}</p>

              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Vehicle Technical Blueprint</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-8">
                <div className="flex items-center gap-2 text-slate-600"><Zap size={16} className="text-slate-400"/> <span>Gearbox: <strong>{car.gearbox}</strong></span></div>
                <div className="flex items-center gap-2 text-slate-600"><Gauge size={16} className="text-slate-400"/> <span>Engine: <strong>{car.engine}</strong></span></div>
                <div className="flex items-center gap-2 text-slate-600"><Compass size={16} className="text-slate-400"/> <span>Year Model: <strong>{car.year}</strong></span></div>
                <div className="flex items-center gap-2 text-slate-600"><Wind size={16} className="text-slate-400"/> <span>A/C Unit: <strong>{car.ac}</strong></span></div>
                <div className="flex items-center gap-2 text-slate-600"><Users size={16} className="text-slate-400"/> <span>Seats: <strong>{car.seats} PAX</strong></span></div>
              </div>

              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Mandatory Policy Conditions</h3>
              <div className="grid grid-cols-2 gap-4 text-xs bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 mb-4">
                <div><span className="text-slate-500 block">Experience Required</span><strong className="text-slate-800 text-sm">{car.minExperience}</strong></div>
                <div><span className="text-slate-500 block">Mileage Limits</span><strong className="text-slate-800 text-sm">{car.mileageLimit === "No" ? "Unlimited Mileage" : car.mileageLimit}</strong></div>
              </div>
            </div>

            <button onClick={() => setModalOpen(true)} className="w-full bg-slate-900 text-white text-center py-4 rounded-2xl font-bold tracking-wide hover:bg-slate-800 transition shadow-sm mt-4">
              Order This Car
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl relative">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Secure Booking</h2>
            <p className="text-sm text-slate-400 mb-6">Your booking request will be sent to our team.</p>
            
            <form onSubmit={handleOrderSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Car Selected</label>
                <input type="text" value={car.name} readOnly className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-xl font-semibold outline-none cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Your Full Name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Hamza Mansouri" className="w-full bg-white border border-slate-200 focus:border-slate-900 p-3 rounded-xl outline-none text-slate-900 transition" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contact Phone Number</label>
                <input type="tel" inputMode="numeric" pattern="[0-9+\s\-]*" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9+\s\-]/g, ''))} placeholder="e.g., +212 661-XXXXXX" className="w-full bg-white border border-slate-200 focus:border-slate-900 p-3 rounded-xl outline-none text-slate-900 transition" />
              </div>

              {bookingStatus === 'success' && <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">Booking request submitted! We will contact you shortly.</p>}
              {bookingStatus === 'error' && <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">Submission error. Please try again.</p>}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); setBookingStatus(''); }} className="w-1/3 border border-slate-200 text-slate-500 font-medium py-3 rounded-xl hover:bg-slate-50 transition text-sm">Cancel</button>
                <button type="submit" disabled={bookingStatus === 'sending'} className="w-2/3 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition text-sm disabled:opacity-50">
                  {bookingStatus === 'sending' ? 'Processing...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}