'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<'jongno' | 'samhwa'>('jongno');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('시설/관리');
  const [hireDate, setHireDate] = useState('');
  const [isNightWorker, setIsNightWorker] = useState(false);

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
      setName(''); setPhone(''); setHireDate(''); setDepartment('시설/관리'); setIsNightWorker(false);
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
      <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)', textAlign: 'center' }}>CHM 안전기술 - 현장 통합 관리자</h2>
      
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
              <option value="시설/관리">시설/관리 (특별+MSDS 전체대상)</option>
              <option value="미화">미화 (MSDS만 수강)</option>
              <option value="보안">보안 (채용시교육만 수강)</option>
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
          <button type="submit" className="btn">스마트 계산업데이트 등록</button>
        </form>
      </div>

      <div className="card">
        <h3>등록된 교육 명단 현황 ({workers.length}명)</h3>
        {loading ? <p style={{marginTop: '10px'}}>데이터를 불러오는 중...</p> : (
          <div style={{ overflowX: 'auto', marginTop: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: '#f4f7f6' }}>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>이름</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>연락처</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>직군</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>야간여부</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>입사일</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>채용시</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>압력용기</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>보일러</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>화기</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>전기</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>밀폐공간</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>MSDS</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>특건(배치전)</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>특건(배치후)</th>
                  <th style={{ padding: '8px', fontSize: '0.85rem' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.name}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{w.phone}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.department}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem', color: w.isNightWorker ? 'var(--danger-color)' : '#999', fontWeight: 'bold' }}>{w.isNightWorker ? 'O' : 'X'}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{w.hireDate}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingHire}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingPressure}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingBoiler}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingFire}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingElectric}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingConfined}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.trainingMSDS}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.healthCheckPre}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{w.healthCheckPost}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                      <button onClick={() => handleDelete(w.id)} style={{ padding: '4px 8px', background: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>
                    </td>
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
    </div>
  );
}
