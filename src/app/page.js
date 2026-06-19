'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetch('/api/cars')
      .then(res => res.json())
      .then(data => setCars(data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
            RENTAL<span className="text-amber-600">KECH</span>
          </Link>
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            Admin Portal
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Premium Fleet for Atlas Adventures
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Explore Marrakesh with elite premium comfort options.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car) => (
            <div key={car.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
              <div className="h-48 bg-slate-100 relative">
                <img src={car.images?.[0]} alt={car.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">{car.type}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{car.name}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{car.description}</p>
                
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-xl font-bold text-slate-900">{car.pricePerDay} MAD</span>
                    <span className="text-xs text-slate-400"> / day</span>
                  </div>
                  <Link href={`/car/${car.id}`} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
                    View Specs
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
