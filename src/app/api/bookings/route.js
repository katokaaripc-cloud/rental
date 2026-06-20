import { NextResponse } from 'next/server';
import { getBookings, setBookings } from '@/lib/store';

export async function GET() {
  const bookings = await getBookings();
  return NextResponse.json(bookings.reverse());
}

export async function POST(request) {
  try {
    const { fullName, phoneNumber, carName, carId } = await request.json();
    const bookings = await getBookings();
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
    await setBookings(bookings);
    return NextResponse.json({ success: true, booking: newBooking });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const bookings = await getBookings();
    const filtered = bookings.filter(b => b.id !== id);
    await setBookings(filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to delete booking" }, { status: 500 });
  }
}
