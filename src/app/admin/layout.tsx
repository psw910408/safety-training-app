'use client';

import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'psw910408_verified') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === 'admin' && pw === 'psw910408') {
      sessionStorage.setItem('admin_auth', 'psw910408_verified');
      setIsAuthenticated(true);
    } else {
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>👑 관리자 보안 로그인</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px' }}>데이터 접근을 위해 로그인해주세요.</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>아이디</label>
              <input 
                type="text" 
                className="input-field" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                placeholder="아이디를 입력하세요" 
                required 
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>비밀번호</label>
              <input 
                type="password" 
                className="input-field" 
                value={pw} 
                onChange={(e) => setPw(e.target.value)} 
                placeholder="비밀번호를 입력하세요" 
                required 
              />
            </div>
            <button type="submit" className="btn" style={{ fontSize: '1rem', padding: '14px', borderRadius: '12px' }}>
              보안 접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 로그인 성공 시 원래 레이아웃 렌더링
  return <>{children}</>;
}
