import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const isVercel = process.env.VERCEL === '1';
const IMG_DIR = isVercel ? path.join(os.tmpdir(), 'rentalkech-imgs') : path.join(process.cwd(), 'data', 'images');

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

// Strip heavy image data from car for Redis storage
function stripImages(car) {
  const { images, ...rest } = car;
  return rest;
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

// ── Image storage (filesystem — not in Redis to avoid OOM) ──
async function saveImages(carId, images) {
  await writeJSONFile(path.join(IMG_DIR, `${carId}.json`), images || []);
}

async function loadImages(carId) {
  const d = await readJSONFile(path.join(IMG_DIR, `${carId}.json`));
  return d || [];
}

async function deleteImages(carId) {
  try { await fs.unlink(path.join(IMG_DIR, `${carId}.json`)); } catch {}
}

// ── Cars ──
export async function getCars() {
  let cars = [];

  // 1) Redis (persistent, no images stored here)
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
          const pf = await readProjectDataFile('cars.json');
          cars = pf && pf.length ? pf : SEED_CARS;
          // Strip images before saving to Redis
          await c.set('cars', JSON.stringify(cars.map(stripImages)));
        }
      } catch (e) {
        console.error('Redis getCars error:', e);
      }
    }
  }

  // 2) Filesystem fallback
  if (cars.length === 0) {
    const data = await readJSONFile(path.join(process.cwd(), 'data', 'cars.json'));
    if (data && data.length) cars = data;
  }
  if (cars.length === 0) {
    cars = SEED_CARS;
  }

  // Merge images back from filesystem
  const result = [];
  for (const car of cars) {
    const imgs = await loadImages(car.id);
    result.push(migrateCar({ ...car, images: imgs.length ? imgs : car.images }));
  }
  return result;
}

export async function setCars(cars) {
  // Save images separately
  for (const car of cars) {
    if (car.images && car.images.length) {
      await saveImages(car.id, car.images);
    }
  }

  // Strip images and save metadata to Redis
  const stripped = cars.map(stripImages);
  if (isVercel) {
    const c = await getClient();
    if (c) {
      await c.set('cars', JSON.stringify(stripped));
      return;
    }
  }
  await writeJSONFile(path.join(process.cwd(), 'data', 'cars.json'), stripped);
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
