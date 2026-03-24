'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [site, setSite] = useState<'jongno' | 'samhwa'>('jongno');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // 자동 하이픈 추가
    if (value.length > 7) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    setPhone(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    router.push(`/result?phone=${phone}&site=${site}`);
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
          현장을 선택하고<br/>휴대폰 번호를 입력하세요
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>개인정보 보호를 위해 본인의 정보만 조회 가능합니다.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="site-selector">
          <div 
            className={`site-option ${site === 'jongno' ? 'active' : ''}`}
            onClick={() => setSite('jongno')}
          >
            종로타워
          </div>
          <div 
            className={`site-option ${site === 'samhwa' ? 'active' : ''}`}
            onClick={() => setSite('samhwa')}
          >
            삼화타워
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="tel"
            className="input-field"
            placeholder="010-0000-0000"
            value={phone}
            onChange={handlePhoneChange}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              조회 중...
            </span>
          ) : '조회하기'}
        </button>
      </form>
    </div>
  );
}
