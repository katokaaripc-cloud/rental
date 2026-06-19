import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function migrateCar(car) {
  if (!car.images) {
    car.images = car.image ? [car.image] : [];
    delete car.image;
  }
  if (car.hidden === undefined) car.hidden = false;
  return car;
}

async function readCars() {
  const data = await fs.readFile(path.join(process.cwd(), 'data', 'cars.json'), 'utf-8');
  return JSON.parse(data).map(migrateCar);
}

async function writeCars(cars) {
  await fs.writeFile(path.join(process.cwd(), 'data', 'cars.json'), JSON.stringify(cars, null, 2));
}

export async function GET(_, { params }) {
  const { id } = await params;
  const cars = await readCars();
  const car = cars.find(c => c.id === id);
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(car);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const cars = await readCars();
  const idx = cars.findIndex(c => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  cars[idx] = { ...cars[idx], ...body };
  await writeCars(cars);
  return NextResponse.json({ success: true, car: cars[idx] });
}
