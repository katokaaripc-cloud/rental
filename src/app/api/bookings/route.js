import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'bookings.json');

async function readBookings() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeBookings(bookings) {
  await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2));
}

export async function GET() {
  const bookings = await readBookings();
  return NextResponse.json(bookings.reverse());
}

export async function POST(request) {
  try {
    const { fullName, phoneNumber, carName, carId } = await request.json();
    const bookings = await readBookings();
    const newBooking = {
      id: Date.now().toString(),
      carName,
      carId,
      fullName,
      phoneNumber,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca',
        dateStyle: 'short',
        timeStyle: 'medium'
      }),
      confirmed: false
    };
    bookings.push(newBooking);
    await writeBookings(bookings);
    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const bookings = await readBookings();
  const filtered = bookings.filter(b => b.id !== id);
  await writeBookings(filtered);
  return NextResponse.json({ success: true });
}
