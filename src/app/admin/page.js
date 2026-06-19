'use client';
import { useState, useEffect, useRef } from 'react';
import { Trash2, ShieldCheck, LogOut, PlusCircle, Layers, X, Eye, EyeOff } from 'lucide-react';

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cars, setCars] = useState([]);
  
  const [newCar, setNewCar] = useState({
    name: '', pricePerDay: '', type: 'Premium SUV', fuel: 'Diesel', description: '',
    gearbox: 'Automatic', engine: '3.0 l', year: '2024 — 2026', ac: 'Dual-zone automatic',
    seats: '7', minExperience: '2 years', mileageLimit: 'No', images: []
  });

  useEffect(() => {
    if (isLoggedIn) fetchCars();
  }, [isLoggedIn]);

  const fetchCars = () => {
    fetch('/api/cars?all=true').then(res => res.json()).then(data => setCars(data));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      setIsLoggedIn(true);
    } else {
      alert("Unauthorized Access Credentials Rejected");
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
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
        gearbox: 'Automatic', engine: '3.0 l', year: '2024 — 2026', ac: 'Dual-zone automatic',
        seats: '7', minExperience: '2 years', mileageLimit: 'No', images: []
      });
    }
  };

  const toggleHidden = async (car) => {
    await fetch(`/api/cars/${car.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: !car.hidden })
    });
    fetchCars();
  };

  const handleDeleteCar = async (id) => {
    const res = await fetch(`/api/cars?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchCars();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-white"><ShieldCheck size={24}/></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Terminal Access</h1>
          <p className="text-xs text-slate-400 mb-6">Authorized internal administrators portal control panel only.</p>
          
          <input type="text" placeholder="Admin Username" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-xl mb-3 outline-none focus:border-slate-900" />
          <input type="password" placeholder="Access Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-xl mb-6 outline-none focus:border-slate-900" />
          
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl tracking-wide hover:bg-slate-800 transition text-sm">Unlock Interface Dashboard</button>
        </form>
      </div>
    );
  }

  const visibleCount = cars.filter(c => !c.hidden).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-black tracking-tight text-xl mb-8">
            <Layers className="text-amber-600" size={20}/> RENTALKECH CMS
          </div>
          <nav className="space-y-1 text-sm font-medium text-slate-600">
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl cursor-pointer">🚗 Fleet Inventory Registry</div>
          </nav>
        </div>
        <a href="/" className="mt-8 flex items-center gap-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 p-3 rounded-xl transition text-left">
          <LogOut size={16}/> Exit Dashboard
        </a>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">Fleet Registry Management</h1>

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
      </main>
    </div>
  );
}
