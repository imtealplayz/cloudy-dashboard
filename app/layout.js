import './globals.css';

export const metadata = {
  title: 'Cloudy Dashboard',
  description: 'Manage Cloudy Discord servers.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
