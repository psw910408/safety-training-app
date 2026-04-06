'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type InspectionItem = {
  id: string;
  materialName: string;
  specification: string;
  quantity: string;
  supplier: string;
  inspectionResult: string;
  photo: { previewUrl: string; base64: string } | null;
};

const createEmptyItem = (): InspectionItem => ({
  id: Math.random().toString(36).substr(2, 9),
  materialName: '',
  specification: '',
  quantity: '',
  supplier: '',
  inspectionResult: 'pass',
  photo: null,
});

function MaterialInspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSite = (searchParams.get('site') as 'jongno' | 'samhwa') || 'jongno';
  
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState(initialSite);
  const [part, setPart] = useState('facility');
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState<InspectionItem[]>([createEmptyItem()]);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleItemChange = (id: string, field: keyof InspectionItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
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
            resolve(canvas.toDataURL('image/webp', 0.6));
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

  const handleFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      try {
        const compressedBase64 = await compressImage(file);
        handleItemChange(id, 'photo', { previewUrl, base64: compressedBase64 });
      } catch (error) {
        console.error("이미지 압축 실패", error);
        alert('이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const removePhoto = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item?.photo) {
      URL.revokeObjectURL(item.photo.previewUrl);
    }
    handleItemChange(id, 'photo', null);
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.materialName)) {
      alert('모든 아이템의 자재명을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      // items를 저장하기 좋은 형태로 매핑
      const itemsToSave = items.map(i => ({
        materialName: i.materialName,
        specification: i.specification,
        quantity: i.quantity,
        supplier: i.supplier,
        inspectionResult: i.inspectionResult,
        photoBase64: i.photo?.base64 || null
      }));

      const res = await fetch('/api/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site,
          part,
          receiveDate,
          items: itemsToSave
        })
      });

      if (!res.ok) throw new Error('저장 실패');

      alert('자재검수 기록이 성공적으로 한 번에 저장되었습니다!');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ position: 'absolute', left: 0, top: '2px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-light)' }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111',textAlign: 'center' }}>
          현장 자재검수 일괄 등록
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 공통 입력: 현장, 파트, 일자 */}
        <div style={{ padding: '16px', background: '#e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#334155' }}>기본 정보 (공통 적용)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>현장</label>
              <select name="site" value={site} onChange={e => setSite(e.target.value as 'jongno' | 'samhwa')} className="input-field" style={{ padding: '10px' }}>
                <option value="jongno">종로타워</option>
                <option value="samhwa">삼화타워</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>파트</label>
              <select name="part" value={part} onChange={e => setPart(e.target.value)} className="input-field" style={{ padding: '10px' }}>
                <option value="facility">시설</option>
                <option value="cleaning">미화</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>입고 일자</label>
            <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} className="input-field" style={{ padding: '10px' }} required />
          </div>
        </div>

        {/* 개별 아이템 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item, index) => (
            <div key={item.id} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 'bold' }}>
                  <span style={{ display: 'inline-block', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', textAlign: 'center', lineHeight: '24px', marginRight: '6px', fontSize: '0.9rem' }}>
                    {index + 1}
                  </span>
                  등록할 자재
                </h4>
                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    삭제
                  </button>
                )}
              </div>

              {/* 자재명 */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="자재명 입력 (필수)"
                  value={item.materialName}
                  onChange={e => handleItemChange(item.id, 'materialName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="규격 (선택)"
                  value={item.specification}
                  onChange={e => handleItemChange(item.id, 'specification', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="반입 수량"
                  value={item.quantity}
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="납품처(제조사)"
                  value={item.supplier}
                  onChange={e => handleItemChange(item.id, 'supplier', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 검수 결과 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['pass', 'fail', 'pending'].map(res => {
                    const resMap: Record<string, {label: string, color: string}> = {
                      pass: { label: '합격', color: '#10b981' },
                      fail: { label: '불합격', color: '#ef4444' },
                      pending: { label: '조건부', color: '#f59e0b' }
                    };
                    const isSelected = item.inspectionResult === res;
                    return (
                      <div 
                        key={res}
                        onClick={() => handleItemChange(item.id, 'inspectionResult', res)}
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          border: `2px solid ${isSelected ? resMap[res].color : '#e2e8f0'}`,
                          borderRadius: '8px',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          color: isSelected ? resMap[res].color : '#64748b',
                          background: isSelected ? `${resMap[res].color}15` : '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
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
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={el => {fileInputRefs.current[item.id] = el}}
                  onChange={(e) => handleFileChange(item.id, e)}
                  style={{ display: 'none' }} 
                />

                {!item.photo ? (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[item.id]?.click()}
                    style={{
                      width: '100%', padding: '16px', background: '#fff', border: '2px dashed #94a3b8',
                      borderRadius: '12px', color: '#475569', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>📸</span> 사진 촬영
                  </button>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={item.photo.previewUrl} alt="미리보기" style={{ width: '100%', height: '200px', objectFit: 'contain', background: '#f8fafc', display: 'block' }} />
                    <button 
                      type="button"
                      onClick={() => removePhoto(item.id)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          style={{ width: '100%', padding: '16px', border: '2px dashed var(--primary-color)', background: '#f0f7ff', color: 'var(--primary-color)', fontSize: '1.05rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}
        >
          ➕ 자재 항목 추가하기
        </button>

        {/* 제출 버튼 */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', zIndex: 10, boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button 
              type="submit" 
              className="action-btn" 
              disabled={loading}
              style={{ width: '100%', background: 'var(--primary-color)', color: '#fff', padding: '16px', fontSize: '1.1rem' }}
            >
              {loading ? '일괄 저장 중...' : `총 ${items.length}개 자재 검수 저장하기`}
            </button>
          </div>
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
