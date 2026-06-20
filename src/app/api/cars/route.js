import { NextResponse } from 'next/server';
import { getCars, setCars } from '@/lib/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';
  let cars = await getCars();
  if (!showAll) cars = cars.filter(c => !c.hidden);
  return NextResponse.json(cars);
}

export async function POST(request) {
  try {
    const carData = await request.json();
    const cars = await getCars();
    const newCar = {
      ...carData,
      pricePerDay: Number(carData.pricePerDay),
      images: carData.images || [],
      hidden: false,
      id: carData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    delete newCar.image;
    cars.push(newCar);
    await setCars(cars);
    return NextResponse.json({ success: true, car: newCar });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to save car" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    let cars = await getCars();
    cars = cars.filter(car => car.id !== id);
    await setCars(cars);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to delete car" }, { status: 500 });
  }
}
