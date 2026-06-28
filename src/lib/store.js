import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';

// ── Redis client (singleton) ──
let client;
let clientErr;

async function getClient() {
  if (clientErr) return null;
  if (client?.isOpen) return client;
  try {
    const url = process.env.KV_URL || process.env.REDIS_URL;
    if (!url) {
      clientErr = new Error('KV_URL or REDIS_URL not set');
      return null;
    }
    client = await createClient({ url }).connect();
    return client;
  } catch (e) {
    clientErr = e;
    return null;
  }
}

// ── Seed data ──
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
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800",
    ],
    hidden: false,
  },
];

function migrateCar(car) {
  if (!car.images) {
    car.images = car.image ? [car.image] : [];
    delete car.image;
  }
  if (car.hidden === undefined) car.hidden = false;
  return car;
}

async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

async function writeJSONFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function readProjectDataFile(name) {
  try {
    const p = path.join(process.cwd(), 'data', name);
    const data = await fs.readFile(p, 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

// ── Cars ──
export async function getCars() {
  // 1) Redis (persistent)
  if (isVercel) {
    const c = await getClient();
    if (c) {
      try {
        const raw = await c.get('cars');
        if (raw) {
          const cars = JSON.parse(raw);
          if (Array.isArray(cars) && cars.length > 0) return cars.map(migrateCar);
        }
        // Seed into Redis
        const pf = await readProjectDataFile('cars.json');
        const seed = pf && pf.length ? pf : SEED_CARS;
        await c.set('cars', JSON.stringify(seed));
        return seed.map(migrateCar);
      } catch (e) {
        console.error('Redis getCars error:', e);
      }
    }
  }

  // 2) Filesystem fallback (local dev or no Redis)
  const tmp = await readJSONFile(path.join(process.cwd(), 'data', 'cars.json'));
  if (tmp && tmp.length) return tmp.map(migrateCar);

  await writeJSONFile(path.join(process.cwd(), 'data', 'cars.json'), SEED_CARS);
  return SEED_CARS;
}

export async function setCars(cars) {
  if (isVercel) {
    const c = await getClient();
    if (c) {
      await c.set('cars', JSON.stringify(cars));
      return;
    }
  }
  await writeJSONFile(path.join(process.cwd(), 'data', 'cars.json'), cars);
}

// ── Bookings ──
export async function getBookings() {
  if (isVercel) {
    const c = await getClient();
    if (c) {
      try {
        const raw = await c.get('bookings');
        if (raw) {
          const b = JSON.parse(raw);
          if (Array.isArray(b)) return b;
        }
        await c.set('bookings', JSON.stringify([]));
        return [];
      } catch (e) {
        console.error('Redis getBookings error:', e);
      }
    }
  }

  const tmp = await readJSONFile(path.join(process.cwd(), 'data', 'bookings.json'));
  return tmp || [];
}

export async function setBookings(bookings) {
  if (isVercel) {
    const c = await getClient();
    if (c) {
      await c.set('bookings', JSON.stringify(bookings));
      return;
    }
  }
  await writeJSONFile(path.join(process.cwd(), 'data', 'bookings.json'), bookings);
}
