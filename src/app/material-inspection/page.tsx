'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MaterialInspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSite = (searchParams.get('site') as 'jongno' | 'samhwa') || 'jongno';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site: initialSite,
    part: 'facility', // facility(시설), cleaning(미화)
    receiveDate: new Date().toISOString().split('T')[0], // 기본값 오늘
    materialName: '',
    specification: '',
    quantity: '',
    supplier: '',
    inspectionResult: 'pass'
  });

  const [photo, setPhoto] = useState<{ previewUrl: string; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUploadTrigger = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // 최대 해상도 제한 (KV 저장소 용량 최적화)

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 0.6 품질로 webp 변환 (매우 높은 압축률)
            const compressedBase64 = canvas.toDataURL('image/webp', 0.6);
            resolve(compressedBase64);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      try {
        const compressedBase64 = await compressImage(file);
        setPhoto({ previewUrl, base64: compressedBase64 });
      } catch (error) {
        console.error("이미지 압축 실패", error);
        alert('이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const removePhoto = () => {
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    setPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialName) {
      alert('자재명을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photoBase64: photo?.base64 || null
        })
      });

      if (!res.ok) throw new Error('저장 실패');

      alert('자재검수 기록이 성공적으로 저장되었습니다!');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ position: 'absolute', left: 0, top: '2px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-light)' }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111',textAlign: 'center' }}>
          현장 자재검수 등록
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 현장 선택 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>현장</label>
            <select 
              name="site" 
              value={formData.site} 
              onChange={handleInputChange}
              className="input-field"
              style={{ padding: '12px', background: '#f8fafc', fontWeight: 'bold' }}
            >
              <option value="jongno">종로타워</option>
              <option value="samhwa">삼화타워</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>파트</label>
            <select 
              name="part" 
              value={formData.part} 
              onChange={handleInputChange}
              className="input-field"
              style={{ padding: '12px', background: '#f8fafc', fontWeight: 'bold' }}
            >
              <option value="facility">시설</option>
              <option value="cleaning">미화</option>
            </select>
          </div>
        </div>

        {/* 입고 일자 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            입고 일자
          </label>
          <input
            type="date"
            name="receiveDate"
            value={formData.receiveDate}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 자재명 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
              자재명 <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              name="materialName"
              placeholder="자재명 입력"
              value={formData.materialName}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
                규격
              </label>
              <input
                type="text"
                name="specification"
                placeholder="규격 입력"
                value={formData.specification}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
                반입 수량
              </label>
              <input
                type="number"
                name="quantity"
                placeholder="수량"
                value={formData.quantity}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
              납품처(제조사)
            </label>
            <input
              type="text"
              name="supplier"
              placeholder="예: 현대자재"
              value={formData.supplier}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
        </div>

        {/* 검수 결과 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            검수 결과
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {['pass', 'fail', 'pending'].map(res => {
              const resMap: Record<string, {label: string, color: string}> = {
                pass: { label: '합격', color: '#10b981' },
                fail: { label: '불합격', color: '#ef4444' },
                pending: { label: '조건부', color: '#f59e0b' }
              };
              const isSelected = formData.inspectionResult === res;
              return (
                <div 
                  key={res}
                  onClick={() => setFormData(prev => ({ ...prev, inspectionResult: res }))}
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    border: `2px solid ${isSelected ? resMap[res].color : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isSelected ? resMap[res].color : '#64748b',
                    background: isSelected ? `${resMap[res].color}15` : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {resMap[res].label}
                </div>
              )
            })}
          </div>
        </div>

        {/* 딱 1개의 사진 촬영/첨부 버튼 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            자재 사진 첨부 (선택)
          </label>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }} 
          />

          {!photo ? (
            <button
              type="button"
              onClick={handlePhotoUploadTrigger}
              style={{
                width: '100%',
                padding: '24px',
                background: '#f1f5f9',
                border: '2px dashed #94a3b8',
                borderRadius: '12px',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '2rem' }}>📸</span>
              사진 촬영 / 선택
            </button>
          ) : (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <img src={photo.previewUrl} alt="미리보기" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: '#f8fafc', display: 'block' }} />
              <button 
                type="button"
                onClick={removePhoto}
                style={{ 
                  position: 'absolute', top: '8px', right: '8px', 
                  background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', 
                  borderRadius: '50%', width: '36px', height: '36px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div style={{ position: 'fixed', bottom: 0, left: 50, right: 50, padding: '16px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', zIndex: 10, maxWidth: '600px', margin: '0 auto', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            type="submit" 
            className="action-btn" 
            disabled={loading}
            style={{ width: '100%', background: 'var(--primary-color)', color: '#fff', padding: '16px', fontSize: '1.1rem' }}
          >
            {loading ? '저장 중...' : '자재 검수 등록하기'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function MaterialInspectionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}>
      <MaterialInspectionForm />
    </Suspense>
  );
}
