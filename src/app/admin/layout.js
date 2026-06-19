'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LogOut, Layers } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const pathname = usePathname();

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-black tracking-tight text-xl mb-8">
            <Layers className="text-amber-600" size={20}/> RENTALKECH CMS
          </div>
          <nav className="space-y-1 text-sm font-medium text-slate-600">
            <Link href="/admin" className={`flex items-center gap-2 p-3 rounded-xl transition ${pathname === '/admin' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-600'}`}>
              🚗 Fleet Inventory
            </Link>
            <Link href="/admin/bookings" className={`flex items-center gap-2 p-3 rounded-xl transition ${pathname === '/admin/bookings' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-600'}`}>
              📋 Booking Requests
            </Link>
          </nav>
        </div>
        <Link href="/" className="mt-8 flex items-center gap-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 p-3 rounded-xl transition text-left">
          <LogOut size={16}/> Exit Dashboard
        </Link>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
