import type { Metadata } from 'next';
import './globals.css';
import CustomerServiceBtn from '../components/CustomerServiceBtn';

export const metadata: Metadata = {
  title: '씨에이치엠 FM종합관리 시스템',
  description: '종로타워, 삼화타워 자재검수 및 시설 관리 시스템',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <main className="container">
          <header className="header" style={{ marginTop: '20px' }}>
            <h1>씨에이치엠 FM종합관리 시스템</h1>
            <p>CHM FACILITIES MANAGEMENT SYSTEM</p>
          </header>
          {children}
          <CustomerServiceBtn />
        </main>
      </body>
    </html>
  );
}
