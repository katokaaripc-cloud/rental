import { Redis } from '@upstash/redis';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const isVercel = process.env.VERCEL === '1';

// On Vercel only /tmp is writable; data/ exists at build but may not be in serverless bundle
const DATA_DIR = isVercel
  ? path.join(os.tmpdir(), 'rentalkech-data')
  : path.join(process.cwd(), 'data');

const CARS_FILE = path.join(DATA_DIR, 'cars.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

let redis;
let redisErr;

function getRedis() {
  if (redisErr) return null;
  if (redis) return redis;
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      redisErr = new Error('KV_REST_API_URL or KV_REST_API_TOKEN not set');
      return null;
    }
    redis = new Redis({ url, token });
    return redis;
  } catch (e) {
    redisErr = e;
    return null;
  }
}

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
  } catch {
    return null;
  }
}

async function writeJSONFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Try reading from project data/ dir (works locally, may not exist on Vercel)
async function readProjectDataFile(name) {
  try {
    const p = path.join(process.cwd(), 'data', name);
    const data = await fs.readFile(p, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getCars() {
  // 1) Try Redis
  if (isVercel) {
    const r = getRedis();
    if (r) {
      try {
        const raw = await r.get('cars');
        let cars = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!cars || !Array.isArray(cars) || cars.length === 0) {
          const pf = await readProjectDataFile('cars.json');
          cars = pf && pf.length ? pf : SEED_CARS;
          await r.set('cars', JSON.stringify(cars));
        }
        return (Array.isArray(cars) ? cars : []).map(migrateCar);
      } catch (e) {
        console.error('KV getCars error:', e);
      }
    }
  }

  // 2) Try local /tmp file (Vercel) or data/ file (local)
  const local = await readJSONFile(CARS_FILE);
  if (local && local.length) return local.map(migrateCar);

  // 3) Try project data/ dir (included in some Vercel deployments)
  const pf = await readProjectDataFile('cars.json');
  if (pf && pf.length) {
    await writeJSONFile(CARS_FILE, pf);
    return pf.map(migrateCar);
  }

  // 4) Seed data
  await writeJSONFile(CARS_FILE, SEED_CARS);
  return SEED_CARS;
}

export async function setCars(cars) {
  if (isVercel) {
    const r = getRedis();
    if (r) {
      try {
        await r.set('cars', JSON.stringify(cars));
        return;
      } catch (e) {
        console.error('KV setCars error:', e);
        throw e;
      }
    }
    // Fallback: write to /tmp (not persistent but won't crash)
    await writeJSONFile(CARS_FILE, cars);
    return;
  }
  await writeJSONFile(CARS_FILE, cars);
}

export async function getBookings() {
  // 1) Try Redis
  if (isVercel) {
    const r = getRedis();
    if (r) {
      try {
        const raw = await r.get('bookings');
        const bookings = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(bookings) ? bookings : [];
      } catch (e) {
        console.error('KV getBookings error:', e);
      }
    }
  }

  // 2) Try local /tmp file (Vercel) or data/ file (local)
  const local = await readJSONFile(BOOKINGS_FILE);
  if (local) return local;

  // 3) Try project data/ dir
  const pf = await readProjectDataFile('bookings.json');
  if (pf) {
    await writeJSONFile(BOOKINGS_FILE, pf);
    return pf;
  }

  return [];
}

export async function setBookings(bookings) {
  if (isVercel) {
    const r = getRedis();
    if (r) {
      try {
        await r.set('bookings', JSON.stringify(bookings));
        return;
      } catch (e) {
        console.error('KV setBookings error:', e);
        throw e;
      }
    }
    // Fallback: write to /tmp
    await writeJSONFile(BOOKINGS_FILE, bookings);
    return;
  }
  await writeJSONFile(BOOKINGS_FILE, bookings);
}
