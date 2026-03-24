import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '씨에이치엠 안전보건 일정 조회',
  description: '종로타워 및 삼화타워 근로자의 안전보건 교육 및 검진 내역을 조회합니다.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
            <h1>씨에이치엠 안전보건 일정 조회</h1>
            <p>CHM SAFETY & HEALTH SYSTEM</p>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
