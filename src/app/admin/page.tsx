'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<'jongno' | 'samhwa'>('jongno');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('시설');
  const [hireDate, setHireDate] = useState('');
  const [isNightWorker, setIsNightWorker] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'training' | 'health'>('basic');

  const fetchWorkers = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/workers?site=${site}`);
    const data = await res.json();
    if (data.success) {
      setWorkers(data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, [site]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !hireDate || !department) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    const res = await fetch('/api/admin/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, department, hireDate, isNightWorker, site })
    });
    const data = await res.json();
    
    if (data.success) {
      alert('등록되었습니다.');
      setName(''); setPhone(''); setHireDate(''); setDepartment('시설'); setIsNightWorker(false);
      fetchWorkers();
    } else {
      alert(data.error || '등록 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/workers?id=${id}&site=${site}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchWorkers();
    } else {
      alert(data.error || '삭제 실패');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <label style={{ 
            flex: 1, padding: '12px', border: `2px solid ${site === 'jongno' ? '#0070f3' : '#ddd'}`, 
            borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
            background: site === 'jongno' ? '#f0f7ff' : '#fff',
            fontWeight: site === 'jongno' ? 'bold' : 'normal'
          }}>
            <input type="radio" value="jongno" checked={site === 'jongno'} onChange={() => setSite('jongno')} style={{ display: 'none' }} />
            종로타워 DB 관리
          </label>
          <label style={{ 
            flex: 1, padding: '12px', border: `2px solid ${site === 'samhwa' ? '#0070f3' : '#ddd'}`, 
            borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
            background: site === 'samhwa' ? '#f0f7ff' : '#fff',
            fontWeight: site === 'samhwa' ? 'bold' : 'normal'
          }}>
            <input type="radio" value="samhwa" checked={site === 'samhwa'} onChange={() => setSite('samhwa')} style={{ display: 'none' }} />
            삼화타워 DB 관리
          </label>
      </div>

      <div className="card" style={{ marginTop: 0, marginBottom: '20px' }}>
        <h3>[{site === 'jongno' ? '종로타워' : '삼화타워'}] 신규 인원 추가</h3>
        <form onSubmit={handleAdd} style={{ marginTop: '15px' }}>
          <div className="input-group">
            <label className="input-label">이름</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="예: 박영원" />
          </div>
          <div className="input-group">
            <label className="input-label">직군 (부서)</label>
            <select className="input-field" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="시설">시설</option>
              <option value="관리">관리</option>
              <option value="미화">미화</option>
              <option value="보안">보안</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">휴대폰 번호</label>
            <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-3386-6350" />
          </div>
          <div className="input-group">
            <label className="input-label">입사일자</label>
            <input type="date" className="input-field" value={hireDate} onChange={e => setHireDate(e.target.value)} />
          </div>
          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="nightWorker" style={{ width: '20px', height: '20px' }} checked={isNightWorker} onChange={e => setIsNightWorker(e.target.checked)} />
            <label htmlFor="nightWorker" className="input-label" style={{ marginBottom: 0, cursor: 'pointer', color: 'var(--danger-color)' }}>야간 당직 근무자 여부 (체크 시 특수건강검진 자동계산)</label>
          </div>
          <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '15px', lineHeight: '1.4'}}>
            * 직군과 야간근무 여부를 정확히 선택하시면, 직군 면제 규칙을 반영하여 불필요한 스케줄은 &quot;대상자 아님&quot;으로 자동 제외 처리됩니다.
          </p>
          <button type="submit" className="btn">DB 저장하기</button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>등록된 인원 현황 ({workers.length}명)</h3>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '15px' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'basic' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'basic' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('basic')}
          >
            기본 인적사항
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'training' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'training' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('training')}
          >
            안전교육 세부 내역
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'health' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'health' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('health')}
          >
            건강검진 기록
          </button>
        </div>

        {loading ? <p style={{marginTop: '10px'}}>데이터를 불러오는 중...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: activeTab === 'training' ? '1000px' : '500px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>이름</th>
                  {activeTab === 'basic' && (
                    <>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>연락처</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>직군</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>야간여부</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>입사일</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>관리</th>
                    </>
                  )}
                  {activeTab === 'training' && (
                    <>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>채용시</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem' }}>차기 MSDS</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#b91c1c' }}>특별(보일러)</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#b91c1c' }}>특별(압력용기)</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#b91c1c' }}>특별(화기)</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#b91c1c' }}>특별(전기)</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#b91c1c' }}>특별(밀폐)</th>
                    </>
                  )}
                  {activeTab === 'health' && (
                    <>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#15803d' }}>배치전 특건</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#15803d' }}>배치후 특건</th>
                      <th style={{ padding: '8px', fontSize: '0.85rem', color: '#15803d' }}>차기 정기 특건</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.name}</td>
                    
                    {activeTab === 'basic' && (
                      <>
                        <td style={{ padding: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{w.phone}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.department}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', color: w.isNightWorker ? 'var(--danger-color)' : '#999', fontWeight: 'bold' }}>{w.isNightWorker ? 'O' : 'X'}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.hireDate}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                          <button onClick={() => handleDelete(w.id)} style={{ padding: '4px 8px', background: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>
                        </td>
                      </>
                    )}
                    
                    {activeTab === 'training' && (
                      <>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingHire}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={w.nextTrainingMSDS}>{w.nextTrainingMSDS}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingBoiler}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingPressure}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingFire}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingElectric}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingConfined}</td>
                      </>
                    )}

                    {activeTab === 'health' && (
                      <>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.healthCheckPre}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.healthCheckPost}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={w.healthCheckRegular}>{w.healthCheckRegular}</td>
                      </>
                    )}
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ padding: '20px', textAlign: 'center' }}>데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', marginBottom: '16px' }}>
          📦 현장 자재 검수 엑셀 다운로드
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
          {site === 'jongno' ? '종로타워' : '삼화타워'} 현장의 월별 자재 검수 내역을 엑셀 서식에 맞춰 다운로드합니다.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>조회 월</label>
            <input 
              type="month" 
              className="input-field" 
              defaultValue={new Date().toISOString().slice(0, 7)}
              id="material-month"
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>파트</label>
            <select className="input-field" id="material-part">
              <option value="facility">시설</option>
              <option value="cleaning">미화</option>
            </select>
          </div>
          <button 
            type="button" 
            className="btn" 
            style={{ minWidth: '140px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => {
              const month = (document.getElementById('material-month') as HTMLInputElement).value;
              const part = (document.getElementById('material-part') as HTMLSelectElement).value;
              if (!month) return alert('월을 선택해주세요.');
              window.open(`/api/admin/export-material-excel?site=${site}&part=${part}&month=${month}`, '_blank');
            }}
          >
            📊 엑셀 다운로드
          </button>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          type="button" 
          onClick={() => router.push('/calendar')} 
          style={{ width: '100%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          🗓️ 2026 전체 일정 캘린더 대시보드 보러 가기
        </button>
      </div>
    </div>
  );
}
