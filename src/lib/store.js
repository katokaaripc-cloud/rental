import { Redis } from '@upstash/redis';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CARS_FILE = path.join(DATA_DIR, 'cars.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const isVercel = process.env.VERCEL === '1';

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }
  return redis;
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
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800"
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

export async function getCars() {
  if (isVercel) {
    try {
      const raw = await getRedis().get('cars');
      let cars = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!cars || !Array.isArray(cars) || cars.length === 0) {
        const fileCars = await readJSONFile(CARS_FILE);
        cars = fileCars && fileCars.length ? fileCars : SEED_CARS;
        await getRedis().set('cars', JSON.stringify(cars));
      }
      return (Array.isArray(cars) ? cars : []).map(migrateCar);
    } catch (e) {
      console.error('KV getCars error, falling back to file:', e);
    }
  }
  const data = await readJSONFile(CARS_FILE);
  if (!data || !data.length) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CARS_FILE, JSON.stringify(SEED_CARS, null, 2));
    return SEED_CARS;
  }
  return data.map(migrateCar);
}

export async function setCars(cars) {
  if (isVercel) {
    await getRedis().set('cars', JSON.stringify(cars));
    return;
  }
  await fs.writeFile(CARS_FILE, JSON.stringify(cars, null, 2));
}

export async function getBookings() {
  if (isVercel) {
    try {
      const raw = await getRedis().get('bookings');
      const bookings = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(bookings) ? bookings : [];
    } catch (e) {
      console.error('KV getBookings error, falling back to file:', e);
    }
  }
  const data = await readJSONFile(BOOKINGS_FILE);
  return data || [];
}

export async function setBookings(bookings) {
  if (isVercel) {
    await getRedis().set('bookings', JSON.stringify(bookings));
    return;
  }
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}
