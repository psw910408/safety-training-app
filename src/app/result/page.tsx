'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResultContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const site = searchParams.get('site');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (phone && site) {
      fetch(`/api/check?phone=${phone}&site=${site}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            setData(resData.data);
          } else {
            setError(resData.message || '오류가 발생했습니다.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('서버와 연결할 수 없습니다.');
          setLoading(false);
        });
    } else {
      setError('잘못된 접근입니다. 다시 조회해주세요.');
      setLoading(false);
    }
  }, [phone, site]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <h2 style={{ color: 'var(--danger-color)', textAlign: 'center', marginBottom: '15px' }}>조회 실패</h2>
        <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-light)' }}>{error}</p>
        <Link href="/" className="btn btn-secondary">다시 조회하기</Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ animation: 'fadeIn 0.5s ease-out', padding: '30px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ 
          display: 'inline-block', padding: '6px 12px', background: 'rgba(0, 68, 148, 0.08)', 
          borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-color)',
          marginBottom: '12px'
        }}>
          {site === 'jongno' ? '종로타워' : '삼화타워'} 현장
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
          <span style={{ color: 'var(--primary-color)' }}>{data.name}</span> 님<br/>안전보건 일정
        </h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{data.phone}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' }}>
        <div className="result-row">
          <span className="result-label">입사일자</span>
          <span className="result-value">{data.hireDate}</span>
        </div>
        
        <div style={{ marginTop: '16px', marginBottom: '8px', fontWeight: '800', fontSize: '0.9rem', color: 'var(--primary-color)', borderLeft: '4px solid var(--primary-color)', paddingLeft: '10px' }}>
          안전보건교육 내역
        </div>
        
        <div className="result-row">
          <span className="result-label highlight-blue">채용시 교육</span>
          <span className="result-value highlight-blue">{data.trainingHire || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">특별교육(압력)</span>
          <span className="result-value">{data.trainingPressure || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">특별교육(보일러)</span>
          <span className="result-value">{data.trainingBoiler || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">특별교육(화기)</span>
          <span className="result-value">{data.trainingFire || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">특별교육(전기)</span>
          <span className="result-value">{data.trainingElectric || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">특별교육(밀폐)</span>
          <span className="result-value">{data.trainingConfined || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">MSDS 교육</span>
          <span className="result-value">{data.trainingMSDS || '-'}</span>
        </div>
        
        <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--warning-color)', display: 'block', marginBottom: '6px' }}>
            차기 MSDS 일정 (정기, ~2030)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-start' }}>
            {data.nextTrainingMSDS?.split(', ').map((d: string) => (
              <span key={d} style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--warning-color)', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {data.isNightWorker === 1 && (
          <>
            <div style={{ marginTop: '20px', marginBottom: '8px', fontWeight: '800', fontSize: '0.9rem', color: 'var(--danger-color)', borderLeft: '4px solid var(--danger-color)', paddingLeft: '10px' }}>
              특수건강검진 내역 (야간)
            </div>
            <div className="result-row">
              <span className="result-label highlight-red">배치 전 검진</span>
              <span className="result-value highlight-red">{data.healthCheckPre || '-'}</span>
            </div>
            <div className="result-row">
              <span className="result-label highlight-red">배치 후 검진</span>
              <span className="result-value highlight-red">{data.healthCheckPost || '-'}</span>
            </div>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--danger-color)', display: 'block', marginBottom: '6px' }}>
                정기 특수건강검진 (1년, ~2030)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-start' }}>
                {data.healthCheckRegular?.split(', ').map((d: string) => (
                  <span key={d} style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--danger-color)', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Link href="/" className="btn btn-secondary">처음으로 돌아가기</Link>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="card" style={{ textAlign: 'center' }}>로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
