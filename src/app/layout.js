import './globals.css';

export const metadata = {
  title: 'RentalKech | Premium Car Rental Marrakesh',
  description: 'Luxury and sports cars in Marrakesh',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}