'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';

export default function RecruitTrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    site: '종로타워',
    jobType: '보안',
    name: '',
    gender: '남',
    birthDate: '',
  });

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const workerSigRef = useRef<SignatureCanvas>(null);
  const managerSigRef = useRef<SignatureCanvas>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearWorkerSig = () => workerSigRef.current?.clear();
  const clearManagerSig = () => managerSigRef.current?.clear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !photoBase64) {
      alert('필수 정보를 모두 입력하고 사진을 등록해주세요.');
      return;
    }

    if (workerSigRef.current?.isEmpty() || managerSigRef.current?.isEmpty()) {
      alert('모든 서명란에 서명해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        trainingDate: format(new Date(), 'yyyy.MM.dd'),
        photoBase64,
        workerSigBase64: workerSigRef.current?.getTrimmedCanvas().toDataURL('image/png'),
        managerSigBase64: managerSigRef.current?.getTrimmedCanvas().toDataURL('image/png'),
      };

      const res = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('문서 생성에 실패했습니다.');
      }

      // Convert response to blob to download automatically
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `채용시교육_${formData.name}_${format(new Date(), 'yyyyMMdd')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
      alert('채용시 교육 결과지가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
        <h2 style={{ marginBottom: '16px' }}>교육 등록이 완료되었습니다!</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>결과 보고서가 다운로드되었습니다.</p>
        <button className="btn" onClick={() => router.push('/')}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="header">
        <h2>근로자 채용시 교육 (8시간)</h2>
        <p>신규 채용자 안전보건 교육 등록 양식</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>현장명</label>
          <div className="site-selector">
            <div 
              className={`site-option ${formData.site === '종로타워' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, site: '종로타워' }))}
            >종로타워</div>
            <div 
              className={`site-option ${formData.site === '삼화타워' ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, site: '삼화타워' }))}
            >삼화타워</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>직군 (업무종류)</label>
          <select 
            name="jobType" 
            value={formData.jobType} 
            onChange={handleInputChange}
            className="input-field"
            style={{ appearance: 'auto' }}
          >
            <option value="보안">보안</option>
            <option value="미화">미화</option>
            <option value="시설">시설</option>
            <option value="기타">기타 직군</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>성명</label>
            <input 
              required
              type="text" 
              name="name" 
              className="input-field" 
              placeholder="홍길동"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>성별</label>
            <div className="site-selector" style={{ marginBottom: 0 }}>
              <div 
                className={`site-option ${formData.gender === '남' ? 'active' : ''}`}
                onClick={() => setFormData(p => ({ ...p, gender: '남' }))}
                style={{ padding: '14px 4px' }}
              >남성</div>
              <div 
                className={`site-option ${formData.gender === '여' ? 'active' : ''}`}
                onClick={() => setFormData(p => ({ ...p, gender: '여' }))}
                style={{ padding: '14px 4px' }}
              >여성</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>생년월일</label>
          <input 
            required
            type="date" 
            name="birthDate" 
            className="input-field" 
            value={formData.birthDate}
            onChange={handleInputChange}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>사진 촬영 및 첨부 📷</label>
          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            onChange={handlePhotoUpload}
            style={{ width: '100%', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          {photoBase64 && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <img src={photoBase64} alt="Captured" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <label style={{ fontWeight: 'bold', margin: '0' }}>근로자 본인 서명 ✍️</label>
            <button type="button" onClick={clearWorkerSig} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.85rem' }}>다시 쓰기</button>
          </div>
          <div style={{ border: '2px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <SignatureCanvas 
              ref={workerSigRef} 
              canvasProps={{ className: 'sigCanvas', style: { width: '100%', height: '150px' } }} 
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <label style={{ fontWeight: 'bold', margin: '0' }}>담당(관리)자 서명 ✍️</label>
            <button type="button" onClick={clearManagerSig} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.85rem' }}>다시 쓰기</button>
          </div>
          <div style={{ border: '2px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <SignatureCanvas 
              ref={managerSigRef} 
              canvasProps={{ className: 'sigCanvas', style: { width: '100%', height: '150px' } }} 
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading || !photoBase64}>
          {loading ? '문서 생성 중...' : '교육 완료 및 보고서 저장 (다운로드)'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()} disabled={loading}>
          취소
        </button>
      </form>
    </div>
  );
}
