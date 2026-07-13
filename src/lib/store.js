import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

const SEED_CARS = [
  {
    id: "bmw-x5-m-sport",
    name: "BMW X5 M-Sport",
    pricePerDay: 1400,
    type: "Premium SUV",
    fuel: "Diesel",
    description: "Excellent traction profile on long Atlas roads.",
    gearbox: "Automatic",
    engine: "3.0 l",
    year: "2024 — 2026",
    ac: "Dual-zone automatic",
    seats: 7,
    minExperience: "2 years",
    mileageLimit: "No",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800"],
    hidden: false,
  },
];

let client;
let clientErr;

async function getClient() {
  if (clientErr) return null;
  if (client?.isOpen) return client;
  try {
    const url = process.env.KV_URL || process.env.REDIS_URL;
    if (!url) { clientErr = new Error('REDIS_URL not set'); return null; }
    client = await createClient({ url }).connect();
    return client;
  } catch (e) { clientErr = e; return null; }
}

function migrateCar(car) {
  if (!car.images) {
    car.images = car.image ? [car.image] : [];
    delete car.image;
  }
  if (car.hidden === undefined) car.hidden = false;
  return car;
}

async function readJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf-8')); } catch { return null; }
}
async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getCars() {
  let cars = [];

  if (isVercel) {
    const c = await getClient();
    if (c) {
      try {
        const raw = await c.get('cars');
        if (raw) {
          cars = JSON.parse(raw);
          if (!Array.isArray(cars)) cars = [];
        }
        if (cars.length === 0) {
          const pf = await readJSON(path.join(LOCAL_DATA_DIR, 'cars.json'));
          cars = pf?.length ? pf : SEED_CARS;
          await c.set('cars', JSON.stringify(cars));
        }
      } catch (e) { console.error('Redis getCars:', e); }
    }
  }

  if (!cars.length) {
    const d = await readJSON(path.join(LOCAL_DATA_DIR, 'cars.json'));
    cars = d?.length ? d : SEED_CARS;
  }

  cars = cars.map(migrateCar);

  const bmw = cars.find(c => c.id === 'bmw-x5-m-sport');
  if (bmw && (!bmw.images || bmw.images.length === 0)) {
    bmw.images = ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800"];
    if (isVercel) {
      const c = await getClient();
      if (c) { await c.set('cars', JSON.stringify(cars)).catch(() => {}); }
    }
  }

  return cars;
}

export async function setCars(cars) {
  if (isVercel) {
    const c = await getClient();
    if (c) { await c.set('cars', JSON.stringify(cars)); return; }
  }
  await writeJSON(path.join(LOCAL_DATA_DIR, 'cars.json'), cars);
}

export async function getBookings() {
  if (isVercel) {
    const c = await getClient();
    if (c) {
      try {
        const raw = await c.get('bookings');
        if (raw) { const b = JSON.parse(raw); if (Array.isArray(b)) return b; }
        await c.set('bookings', JSON.stringify([]));
        return [];
      } catch (e) { console.error('Redis getBookings:', e); }
    }
  }
  return (await readJSON(path.join(LOCAL_DATA_DIR, 'bookings.json'))) || [];
}

export async function setBookings(bookings) {
  if (isVercel) {
    const c = await getClient();
    if (c) { await c.set('bookings', JSON.stringify(bookings)); return; }
  }
  await writeJSON(path.join(LOCAL_DATA_DIR, 'bookings.json'), bookings);
}
