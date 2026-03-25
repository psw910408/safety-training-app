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

  const validatePhone = () => {
    if (!phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleAction = (type: string) => {
    if (!validatePhone()) return;
    
    if (type === 'schedule') {
      setLoading(true);
      router.push(`/result?phone=${phone}&site=${site}`);
    } else if (type === 'recruit') {
      router.push('/recruit');
    } else {
      alert('준비 중입니다.');
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
          현장을 선택하고<br/>휴대폰 번호를 입력하세요
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>개인정보 보호를 위해 본인의 정보만 조회 가능합니다.</p>
      </div>
      
      <div>
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

        <div style={{ marginBottom: '24px' }}>
          <input
            type="tel"
            className="input-field"
            placeholder="010-0000-0000"
            value={phone}
            onChange={handlePhoneChange}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
          <button 
            type="button" 
            className="action-btn" 
            onClick={() => handleAction('schedule')}
            disabled={loading}
          >
            <div className="icon">📅</div>
            근로자 일정조회
          </button>
          
          <button 
            type="button" 
            className="action-btn" 
            onClick={() => handleAction('recruit')}
            disabled={loading}
          >
            <div className="icon">🔰</div>
            채용시 교육
          </button>
          
          <button 
            type="button" 
            className="action-btn" 
            onClick={() => handleAction('msds')}
            disabled={loading}
          >
            <div className="icon">🧪</div>
            MSDS 교육
          </button>
          
          <button 
            type="button" 
            className="action-btn" 
            onClick={() => handleAction('special')}
            disabled={loading}
          >
            <div className="icon">⚠️</div>
            특별교육
          </button>
        </div>
        
        {loading && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            조회 중...
          </div>
        )}
      </div>
    </div>
  );
}
