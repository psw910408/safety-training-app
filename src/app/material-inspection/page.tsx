'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MaterialInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSite = searchParams.get('site') as 'jongno' | 'samhwa' || 'jongno';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site: initialSite,
    receiveDate: new Date().toISOString().split('T')[0], // 기본값 오늘
    materialName: '',
    specification: '',
    quantity: '',
    supplier: '',
    inspectionResult: 'pass' // pass, fail, pending
  });

  // 사진 관리
  const [photos, setPhotos] = useState<{ id: string; type: string; previewUrl: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('material'); // material, invoice, defect

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUploadTrigger = (type: string) => {
    setCurrentPhotoType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      setPhotos(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: currentPhotoType,
          previewUrl,
          file
        }
      ]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialName) {
      alert('자재명을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    // TODO: 백엔드 API 연동 위치 (DB 저장 및 보고서 생성)
    // 엑셀 수식 기반 자동화 로직이 들어갈 곳
    setTimeout(() => {
      alert('자재검수 기록이 성공적으로 저장되었습니다!\n(현재는 UI 데모 버전입니다)');
      setLoading(false);
      router.push('/');
    }, 1500);
  };

  const photoTypes = [
    { id: 'material', label: '자재 전경/상세' },
    { id: 'invoice', label: '송장/납품서' },
    { id: 'defect', label: '차이/불량 (해당시)' }
  ];

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
          자재검수 등록
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 현장 선택 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            현장
          </label>
          <div className="site-selector">
            <div 
              className={`site-option ${formData.site === 'jongno' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, site: 'jongno'}))}
              style={{ padding: '8px' }}
            >
              종로타워
            </div>
            <div 
              className={`site-option ${formData.site === 'samhwa' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, site: 'samhwa'}))}
              style={{ padding: '8px' }}
            >
              삼화타워
            </div>
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
          {/* 자재명, 규격, 수량 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
              자재명 <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              name="materialName"
              placeholder="예: 시멘트, 철근, 도료 등"
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
                placeholder="예: 40kg, 13mm"
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
                placeholder="숫자 입력"
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
              placeholder="납품업체명 입력"
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
                pending: { label: '조건부합격', color: '#f59e0b' }
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

        {/* 사진 촬영/첨부 (히든 인풋 포함) */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            <span>현장 사진 촬영 / 첨부</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>등록된 사진: {photos.length}장</span>
          </label>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }} 
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {photoTypes.map(pt => (
              <button
                key={pt.id}
                type="button"
                onClick={() => handlePhotoUploadTrigger(pt.id)}
                style={{
                  padding: '12px 8px',
                  background: '#f1f5f9',
                  border: '1px dashed #94a3b8',
                  borderRadius: '8px',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📷</span>
                {pt.label}
              </button>
            ))}
          </div>

          {/* 사진 미리보기 영역 */}
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <img src={photo.previewUrl} alt="미리보기" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '4px', textAlign: 'center' }}>
                    {photoTypes.find(t => t.id === photo.type)?.label}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', lineHeight: '1' }}
                  >
                    ×
                  </button>
                </div>
              ))}
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
