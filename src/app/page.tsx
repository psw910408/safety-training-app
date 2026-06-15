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
    
    if (type !== 'schedule' && type !== 'material-request' && type !== 'material-inspection' && type !== 'cooling') {
      const pass = prompt('🚨 해당 교육 메뉴는 관리자 전용입니다. 승인 코드를 입력하세요.');
      if (pass !== '0000') {
        alert('관리자 전용 구역입니다. 문의사항은 박상우 개발자에게 문의하세요!');
        return;
      }
    }

    if (type === 'schedule') {
      setLoading(true);
      router.push(`/result?phone=${phone}&site=${site}`);
    } else if (type === 'cooling') {
      alert('냉방점검 페이지 내용은 추후 업데이트 예정입니다.');
      return;
    } else if (type === 'material-request') {
      alert('추후 서비스 예정입니다.');
      return;
    } else if (type === 'material-inspection') {
      // 자재검수는 개발 예정, 또는 페이지로 이동
      router.push(`/material-inspection?site=${site}&phone=${phone}`);
    } else if (['recruit', 'change', 'msds', 'special'].includes(type)) {
      if (site === 'samhwa' && type === 'msds') {
        alert('삼화타워 MSDS 현황 및 양식 파악 중입니다. 완료 후 업데이트 예정입니다!');
        return;
      }
      router.push(`/${type}?site=${site}&phone=${phone}`);
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button type="button" className="action-btn" onClick={() => handleAction('schedule')} disabled={loading}>
            <div className="icon">📅</div>
            근로자 일정조회
          </button>
          
          <button type="button" className="action-btn" onClick={() => handleAction('recruit')} disabled={loading}>
            <div className="icon">🔰</div>
            채용시 교육
          </button>

          <button type="button" className="action-btn" onClick={() => handleAction('change')} disabled={loading}>
            <div className="icon">🔄</div>
            작업내용 변경
          </button>
          
          <button type="button" className="action-btn" onClick={() => handleAction('msds')} disabled={loading}>
            <div className="icon">🧪</div>
            MSDS 교육
          </button>
          
          <button type="button" className="action-btn" onClick={() => handleAction('special')} disabled={loading}>
            <div className="icon">⚠️</div>
            현장 특별교육
          </button>

          <button type="button" className="action-btn" onClick={() => handleAction('cooling')} disabled={loading}>
            <div className="icon">❄️</div>
            냉방점검
          </button>
        </div>

        {/* 자재 관리 영역 */}
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderRadius: '16px', marginBottom: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#334155', marginBottom: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            📦 현장 자재 관리
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => handleAction('material-request')} 
              disabled={loading}
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              자재신청
            </button>
            <button 
              type="button" 
              onClick={() => handleAction('material-inspection')} 
              disabled={loading}
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: '1.5rem' }}>🔍</span>
              자재검수
            </button>
          </div>
        </div>
        
        {loading && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            조회 중...
          </div>
        )}
      </div>

      {/* 관리자 전용 대시보드 버튼 */}
      <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👑 관리자 전용 메뉴
        </h3>
        <button 
          type="button" 
          onClick={() => router.push('/admin')} 
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
        >
          데이터 명부 및 전체 캘린더 보기
        </button>
      </div>

    </div>
  );
}
