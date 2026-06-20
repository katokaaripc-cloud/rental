'use client';
import { useState, useEffect, useRef } from 'react';
import { Trash2, PlusCircle, X, Eye, EyeOff } from 'lucide-react';

export default function FleetPage() {
  const fileInputRef = useRef(null);
  const [cars, setCars] = useState([]);
  const [error, setError] = useState('');
  const [newCar, setNewCar] = useState({
    name: '', pricePerDay: '', type: 'Premium SUV', fuel: 'Diesel', description: '',
    gearbox: 'Automatic', engine: '2.0 l', year: '2024 — 2026', ac: 'Dual-zone automatic',
    seats: '5', minExperience: '2 years', mileageLimit: 'No', images: []
  });

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = () => {
    fetch('/api/cars?all=true').then(res => res.json()).then(data => setCars(data)).catch(() => setError('Failed to load cars'));
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCar)
    });
    if (res.ok) {
      fetchCars();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNewCar({
        name: '', pricePerDay: '', type: 'Premium SUV', fuel: 'Diesel', description: '',
        gearbox: 'Automatic', engine: '2.0 l', year: '2024 — 2026', ac: 'Dual-zone automatic',
        seats: '5', minExperience: '2 years', mileageLimit: 'No', images: []
      });
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to add car');
    }
  };

  const toggleHidden = async (car) => {
    setError('');
    const res = await fetch(`/api/cars/${car.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: !car.hidden })
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to update car');
    }
    fetchCars();
  };

  const handleDeleteCar = async (id) => {
    setError('');
    const res = await fetch(`/api/cars?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchCars();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to delete car');
    }
  };

  const visibleCount = cars.filter(c => !c.hidden).length;

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">Fleet Registry Management</h1>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <form onSubmit={handleAddCar} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-1 text-sm">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base mb-2"><PlusCircle size={18} className="text-emerald-600"/> Append New Vehicle Asset</h2>

          <input type="text" placeholder="Vehicle Name (e.g., BMW X5 M-Sport)" required value={newCar.name} onChange={e => setNewCar({...newCar, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900" />
          <input type="number" placeholder="Daily Rental Cost (MAD)" required value={newCar.pricePerDay} onChange={e => setNewCar({...newCar, pricePerDay: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900" />
          <input ref={fileInputRef} type="file" accept="image/*" multiple required onChange={e => { const files = Array.from(e.target.files || []); Promise.all(files.map(file => new Promise(resolve => { const reader = new FileReader(); reader.onload = ev => resolve(ev.target.result); reader.readAsDataURL(file); }))).then(results => setNewCar({...newCar, images: results})); }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-sm file:font-medium" />
          {newCar.images.length > 0 && <div className="flex gap-2 flex-wrap">
            {newCar.images.map((img, i) => <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setNewCar({...newCar, images: newCar.images.filter((_, j) => j !== i)})} className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10}/></button>
            </div>)}
          </div>}
          <textarea placeholder="Vehicle profile description details..." required value={newCar.description} onChange={e => setNewCar({...newCar, description: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 h-20 resize-none" />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <select value={newCar.gearbox} onChange={e => setNewCar({...newCar, gearbox: e.target.value})} className="p-2 bg-slate-50 border border-slate-200 rounded-md text-sm">
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
            <input type="text" placeholder="Engine size" value={newCar.engine} onChange={e => setNewCar({...newCar, engine: e.target.value})} className="p-2 bg-slate-50 border border-slate-200 rounded-md" />
            <input type="text" placeholder="Year Range" value={newCar.year} onChange={e => setNewCar({...newCar, year: e.target.value})} className="p-2 bg-slate-50 border border-slate-200 rounded-md" />
            <input type="text" placeholder="Seats total count" value={newCar.seats} onChange={e => setNewCar({...newCar, seats: e.target.value})} className="p-2 bg-slate-50 border border-slate-200 rounded-md" />
          </div>

          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition mt-2">Publish Fleet Asset Entry</button>
        </form>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><h2 className="font-bold text-slate-700 text-sm">Fleet Lineup ({visibleCount} visible / {cars.length} total)</h2></div>
          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {cars.map((car) => (
              <div key={car.id} className={`p-4 flex items-center justify-between gap-4 ${car.hidden ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <img src={car.images?.[0]} alt={car.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {car.name}
                      {car.hidden && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Hidden</span>}
                    </h4>
                    <p className="text-xs text-emerald-600 font-semibold">{car.pricePerDay} MAD/day • <span className="text-slate-400 font-normal">{car.type}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleHidden(car)} className={`p-2 rounded-lg transition ${car.hidden ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title={car.hidden ? 'Show on site' : 'Hide from site'}>
                    {car.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => handleDeleteCar(car.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Purge Record">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {cars.length === 0 && <p className="p-8 text-center text-xs text-slate-400 font-medium">Inventory is empty.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
