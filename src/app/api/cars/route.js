import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cars.json');

const SEED_DATA = [
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
    hidden: false
  }
];

function migrateCar(car) {
  if (!car.images) {
    car.images = car.image ? [car.image] : [];
    delete car.image;
  }
  if (car.hidden === undefined) car.hidden = false;
  return car;
}

async function readCars() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const cars = JSON.parse(data);
    return cars.map(migrateCar);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(SEED_DATA, null, 2));
    return SEED_DATA;
  }
}

async function writeCars(cars) {
  await fs.writeFile(DATA_FILE, JSON.stringify(cars, null, 2));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';
  let cars = await readCars();
  if (!showAll) cars = cars.filter(c => !c.hidden);
  return NextResponse.json(cars);
}

export async function POST(request) {
  try {
    const carData = await request.json();
    const cars = await readCars();
    const newCar = {
      ...carData,
      pricePerDay: Number(carData.pricePerDay),
      images: carData.images || [],
      hidden: false,
      id: carData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    delete newCar.image;
    cars.push(newCar);
    await writeCars(cars);
    return NextResponse.json({ success: true, car: newCar });
  } catch (error) {
    return NextResponse.json({ error: "Failed to parse car data" }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let cars = await readCars();
  cars = cars.filter(car => car.id !== id);
  await writeCars(cars);
  return NextResponse.json({ success: true });
}
