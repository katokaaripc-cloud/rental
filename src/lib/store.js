import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const isVercel = process.env.VERCEL === '1';
const IMG_DIR = isVercel ? path.join(os.tmpdir(), 'rentalkech-imgs') : path.join(process.cwd(), 'data', 'images');

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
          // Seed from project file or hardcoded data
          const pf = await readJSON(path.join(process.cwd(), 'data', 'cars.json'));
          cars = pf?.length ? pf : SEED_CARS;
          for (const car of cars) {
            if (car.images?.length) await writeJSON(path.join(IMG_DIR, `${car.id}.json`), car.images);
          }
          await c.set('cars', JSON.stringify(cars.map(({ images, ...rest }) => rest)));
        } else {
          // Migration: old data may have embedded images — strip them out
          let changed = false;
          for (const car of cars) {
            if (car.images?.length) {
              await writeJSON(path.join(IMG_DIR, `${car.id}.json`), car.images);
              delete car.images;
              changed = true;
            }
          }
          if (changed) await c.set('cars', JSON.stringify(cars));
        }
      } catch (e) { console.error('Redis getCars:', e); }
    }
  }

  if (!cars.length) {
    const d = await readJSON(path.join(process.cwd(), 'data', 'cars.json'));
    cars = d?.length ? d : SEED_CARS;
  }

  // Merge images from filesystem
  const out = [];
  for (const car of cars) {
    const imgs = await readJSON(path.join(IMG_DIR, `${car.id}.json`));
    out.push(migrateCar({ ...car, images: imgs || car.images || [] }));
  }
  return out;
}

export async function setCars(cars) {
  for (const car of cars) {
    if (car.images?.length) await writeJSON(path.join(IMG_DIR, `${car.id}.json`), car.images);
  }
  const stripped = cars.map(({ images, ...rest }) => rest);
  if (isVercel) {
    const c = await getClient();
    if (c) { await c.set('cars', JSON.stringify(stripped)); return; }
  }
  await writeJSON(path.join(process.cwd(), 'data', 'cars.json'), stripped);
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
  return (await readJSON(path.join(process.cwd(), 'data', 'bookings.json'))) || [];
}

export async function setBookings(bookings) {
  if (isVercel) {
    const c = await getClient();
    if (c) { await c.set('bookings', JSON.stringify(bookings)); return; }
  }
  await writeJSON(path.join(process.cwd(), 'data', 'bookings.json'), bookings);
}
