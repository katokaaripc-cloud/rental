import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const isVercel = process.env.VERCEL === '1';

// On Vercel only /tmp is writable (ephemeral).
// KV (Redis) via REST API is the proper persistence layer.
const TMP_DIR = path.join(os.tmpdir(), 'rentalkech-data');
const CARS_FILE = path.join(TMP_DIR, 'cars.json');
const BOOKINGS_FILE = path.join(TMP_DIR, 'bookings.json');

// ── Direct Upstash / Vercel KV REST client (no npm dependency issues) ──
function kvUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
}
function kvToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
}
function kvReady() {
  return !!(kvUrl() && kvToken());
}

async function kvGet(key) {
  try {
    const res = await fetch(`${kvUrl()}/get/${key}`, {
      headers: { Authorization: `Bearer ${kvToken()}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.result;
  } catch { return null; }
}

async function kvSet(key, value) {
  const res = await fetch(`${kvUrl()}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken()}`,
      'Content-Type': 'application/json',
    },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
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

// Try reading from project data/ dir (available in source, may exist in some Vercel deployments)
async function readProjectDataFile(name) {
  try {
    const p = path.join(process.cwd(), 'data', name);
    const data = await fs.readFile(p, 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

// ── Cars ──
export async function getCars() {
  // 1) KV (persistent across cold starts)
  if (isVercel && kvReady()) {
    const raw = await kvGet('cars');
    if (raw) {
      let cars = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(cars) && cars.length > 0) return cars.map(migrateCar);
    }
  }

  // 2) /tmp (same instance only)
  const tmp = await readJSONFile(CARS_FILE);
  if (tmp && tmp.length) return tmp.map(migrateCar);

  // 3) Project data/ dir
  const pf = await readProjectDataFile('cars.json');
  if (pf && pf.length) {
    await writeJSONFile(CARS_FILE, pf);
    return pf.map(migrateCar);
  }

  // 4) Seed
  await writeJSONFile(CARS_FILE, SEED_CARS);
  return SEED_CARS;
}

export async function setCars(cars) {
  if (isVercel && kvReady()) {
    await kvSet('cars', JSON.stringify(cars));
    return;
  }
  // Fallback: writes to /tmp (not persistent between instances/cold starts)
  await writeJSONFile(CARS_FILE, cars);
}

// ── Bookings ──
export async function getBookings() {
  if (isVercel && kvReady()) {
    const raw = await kvGet('bookings');
    if (raw) {
      const b = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(b)) return b;
    }
  }

  const tmp = await readJSONFile(BOOKINGS_FILE);
  if (tmp) return tmp;

  const pf = await readProjectDataFile('bookings.json');
  if (pf) {
    await writeJSONFile(BOOKINGS_FILE, pf);
    return pf;
  }

  return [];
}

export async function setBookings(bookings) {
  if (isVercel && kvReady()) {
    await kvSet('bookings', JSON.stringify(bookings));
    return;
  }
  await writeJSONFile(BOOKINGS_FILE, bookings);
}
