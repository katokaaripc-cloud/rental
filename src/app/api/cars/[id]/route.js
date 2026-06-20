import { NextResponse } from 'next/server';
import { getCars, setCars } from '@/lib/store';

export async function GET(_, { params }) {
  const { id } = await params;
  const cars = await getCars();
  const car = cars.find(c => c.id === id);
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(car);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const cars = await getCars();
  const idx = cars.findIndex(c => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  cars[idx] = { ...cars[idx], ...body };
  await setCars(cars);
  return NextResponse.json({ success: true, car: cars[idx] });
}
