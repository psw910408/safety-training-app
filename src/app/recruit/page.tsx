'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';

interface WorkerInfo {
  id: number;
  jobType: string;
  role: string;
  name: string;
  gender: string;
  attendance: string; // '참석' | '불참'
  workerSigBase64: string | null;
}

const SignatureBox = ({ 
  label, 
  onSave 
}: { 
  label: string; 
  onSave: (val: string) => void 
}) => {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onSave(sigRef.current.getTrimmedCanvas().toDataURL('image/png'));
    } else {
      onSave('');
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onSave('');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
        <label style={{ fontWeight: 'bold', margin: '0' }}>{label} ✍️</label>
        <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.85rem' }}>다시 쓰기</button>
      </div>
      <div style={{ border: '2px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
        <SignatureCanvas 
          ref={sigRef} 
          clearOnResize={false}
          onEnd={handleEnd}
          canvasProps={{ className: 'sigCanvas', style: { width: '100%', height: '120px', touchAction: 'none' } }} 
        />
      </div>
    </div>
  );
};

export default function RecruitTrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 기본 설정
  const [site, setSite] = useState('종로타워');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [trainingDate, setTrainingDate] = useState(format(new Date(), 'yyyy.MM.dd'));

  // 근로자 배열
  const [workers, setWorkers] = useState<WorkerInfo[]>([
    { id: Date.now(), jobType: '미화', role: '', name: '', gender: '남', attendance: '참석', workerSigBase64: null }
  ]);

  // 사진 배열 (최대 6개)
  const [photos, setPhotos] = useState<string[]>([]);

  // 관리자 서명
  const [managerSigBase64, setManagerSigBase64] = useState('');
  const [directorSigBase64, setDirectorSigBase64] = useState('');

  const addWorker = () => {
    setWorkers(prev => [...prev, { id: Date.now(), jobType: '보안', role: '', name: '', gender: '남', attendance: '참석', workerSigBase64: null }]);
  };

  const removeWorker = (id: number) => {
    if (workers.length > 1) {
      setWorkers(prev => prev.filter(w => w.id !== id));
    }
  };

  const updateWorker = (id: number, field: string, value: string | null) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 6) {
      alert('사진은 최대 6장까지만 등록 가능합니다.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => {
          if (prev.length < 6) return [...prev, reader.result as string];
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });
    
    // 파일 입력값 초기화하여 같은 파일 다시 선택 가능하게 함
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    for (let i = 0; i < workers.length; i++) {
      if (!workers[i].name) {
        alert(`[${i+1}번 근로자] 이름을 입력해주세요.`); return;
      }
      if (workers[i].attendance === '참석' && !workers[i].workerSigBase64) {
        alert(`[${i+1}번 근로자] 서명을 마무리해주세요.`); return;
      }
    }

    if (!managerSigBase64) { alert('담당자 서명을 기입해주세요.'); return; }
    if (!directorSigBase64) { alert('소장/부장 서명을 기입해주세요.'); return; }

    setLoading(true);

    try {
      const payload = {
        site,
        trainingDate,
        startTime,
        endTime,
        workers: workers.map((w, idx) => ({ ...w, index: idx + 1 })), // 순번 추가
        photos, // Base64 Array
        managerSigBase64,
        directorSigBase64,
      };

      const res = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errInfo = await res.json();
        throw new Error(errInfo.details || '문서 생성에 실패했습니다.');
      }

      // blob 파일 다운로드
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `채용시교육_${format(new Date(), 'yyyyMMdd')}_${workers.length}명.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
      alert('채용시 교육 문설가 성공적으로 셍성되었습니다!');
    } catch (error: any) {
      console.error(error);
      alert(error.message || '오류가 발생했습니다. 담당자에게 문의하세요.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
        <h2 style={{ marginBottom: '16px' }}>교육 등록 및 생성이 완료되었습니다!</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>결과 보고서가 다운로드되었습니다.</p>
        <button className="btn" onClick={() => router.push('/')}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div className="header" style={{ marginBottom: '20px' }}>
        <h2>근로자 채용시 교육 (그룹용)</h2>
        <p>신규 채용자 다수 일괄 처리 양식</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 공통 정보 설정 */}
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--primary-color)' }}>📢 교육 기초 설정</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>교육 현장명</label>
            <div className="site-selector" style={{ marginBottom: 0 }}>
              <div 
                className={`site-option ${site === '종로타워' ? 'active' : ''}`}
                onClick={() => setSite('종로타워')}
              >종로타워</div>
              <div 
                className={`site-option ${site === '삼화타워' ? 'active' : ''}`}
                onClick={() => setSite('삼화타워')}
              >삼화타워</div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>교육 일자</label>
            <input type="text" className="input-field" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>시작 시간</label>
              <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>종료 시간</label>
              <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 사진 대지 영역 */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>📷 현장 사진 (최대 6장)</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>워드 마지막 장 '사진대지'의 6개 칸에 차례대로 들어갑니다.</p>
          
          <label style={{ display: 'block', padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px' }}>
            사진 추가하기 / 촬영하기 ({photos.length}/6)
            <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
          
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {photos.map((photo, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={photo} alt={`현장사진${idx+1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.8rem', cursor: 'pointer' }}>X</button>
                  <div style={{ position: 'absolute', bottom: '0', width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '2px 4px', textAlign: 'center' }}>사진 {idx+1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 근로자 반복 및 무한 추가 영역 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>👥 참석 근로자 명단 (총 {workers.length}명)</h3>
            <button type="button" onClick={addWorker} style={{ background: '#10b981', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              + 인원 추가
            </button>
          </div>

          {workers.map((worker, index) => (
            <div key={worker.id} style={{ padding: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '16px', position: 'relative', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              {workers.length > 1 && (
                <button type="button" onClick={() => removeWorker(worker.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>삭제</button>
              )}
              
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)' }}>{index + 1}번 근로자</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>소속(직군)</label>
                  <select className="input-field" style={{ padding: '8px' }} value={worker.jobType} onChange={(e) => updateWorker(worker.id, 'jobType', e.target.value)}>
                    <option value="보안">보안</option>
                    <option value="미화">미화</option>
                    <option value="시설">시설</option>
                    <option value="주차">주차</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>성별</label>
                  <select className="input-field" style={{ padding: '8px' }} value={worker.gender} onChange={(e) => updateWorker(worker.id, 'gender', e.target.value)}>
                    <option value="남">남성</option>
                    <option value="여">여성</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold', color: 'var(--primary-color)' }}>참석 여부</label>
                  <select className="input-field" style={{ padding: '8px', border: '2px solid var(--primary-color)' }} value={worker.attendance} onChange={(e) => updateWorker(worker.id, 'attendance', e.target.value)}>
                    <option value="참석">참석</option>
                    <option value="불참">불참 (휴가 등)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>직종 (선택)</label>
                  <input type="text" className="input-field" style={{ padding: '8px' }} value={worker.role} onChange={(e) => updateWorker(worker.id, 'role', e.target.value)} placeholder="직종 기입" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>이름</label>
                  <input type="text" className="input-field" style={{ padding: '8px' }} value={worker.name} onChange={(e) => updateWorker(worker.id, 'name', e.target.value)} placeholder="이름 (필수)" required />
                </div>
              </div>

              {worker.attendance === '참석' ? (
                <SignatureBox label="근로자 본인 서명" onSave={(val) => updateWorker(worker.id, 'workerSigBase64', val)} />
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center', color: '#b91c1c', fontWeight: 'bold' }}>
                  ❌ 불참 처리됨 (서명 생략) <br/><span style={{fontSize:'0.8rem', fontWeight:'normal'}}>※ 워드 문서 서명란에는 '불참' 이라 찍혀 출력됩니다.</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 하단 관리자 결재란 */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '2px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center', color: 'var(--primary-color)' }}>🏢 보고서 최종 결재 (관리자)</h3>
          <SignatureBox label="담당 관리자 서명" onSave={setManagerSigBase64} />
          <div style={{ height: '8px' }}></div>
          <SignatureBox label="소장/부장 최종 서명" onSave={setDirectorSigBase64} />
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ fontSize: '1.1rem', padding: '16px' }}>
          {loading ? '워드 생성 및 다운로드 중...' : '최종 완료 및 워드 폼 자동 생성 (다운로드)'}
        </button>
      </form>
    </div>
  );
}
