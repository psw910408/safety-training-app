'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type InspectionItem = {
  id: string;
  materialName: string;
  specification: string;
  quantity: string;
  supplier: string;
  photo: { previewUrl: string; base64: string } | null;
};

const createEmptyItem = (): InspectionItem => ({
  id: Math.random().toString(36).substr(2, 9),
  materialName: '',
  specification: '',
  quantity: '',
  supplier: '',
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
  const [historyBatches, setHistoryBatches] = useState<any[]>([]);
  
  // 수정 모드 관리
  const [editBatchId, setEditBatchId] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/material?site=${site}&part=all`);
      const data = await res.json();
      if (data.success) {
        setHistoryBatches(data.records || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [site]);

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
          const MAX_SIZE = 800; 

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
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // WebP 대신 JPEG 사용 (엑셀 호환성)
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
    if (item?.photo && item.photo.previewUrl) {
      URL.revokeObjectURL(item.photo.previewUrl);
    }
    handleItemChange(id, 'photo', null);
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]!.value = '';
    }
  };

  const [workDescription, setWorkDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.materialName)) {
      alert('모든 아이템의 자재명을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        id: editBatchId, // PUT일 경우 사용
        site,
        part,
        receiveDate,
        workDescription,
        items: items.map(i => ({
          id: i.id,
          materialName: i.materialName,
          specification: i.specification,
          quantity: i.quantity,
          supplier: i.supplier,
          photoBase64: i.photo?.base64 || null
        }))
      };

      const url = '/api/material';
      const method = editBatchId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('저장 실패');

      alert(editBatchId ? '성공적으로 수정되었습니다!' : '성공적으로 저장되었습니다!');
      
      // 폼 초기화
      setItems([createEmptyItem()]);
      setEditBatchId(null);
      setWorkDescription('');
      // 리스트 갱신
      fetchHistory();
      
      // 최상단 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startEditBatch = (batch: any) => {
    setSite(batch.site);
    setPart(batch.part);
    setReceiveDate(batch.receiveDate);
    setWorkDescription(batch.workDescription || '');
    setEditBatchId(batch.id);
    
    const loadedItems = batch.items.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      materialName: item.materialName || '',
      specification: item.specification || '',
      quantity: item.quantity || '',
      supplier: item.supplier || '',
      photo: item.photoBase64 ? { previewUrl: item.photoBase64, base64: item.photoBase64 } : null
    }));
    setItems(loadedItems);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBatch = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? (등록된 모든 자재가 삭제됩니다)')) return;
    try {
      const res = await fetch(`/api/material?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchHistory();
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ position: 'absolute', left: 0, top: '2px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-light)' }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111',textAlign: 'center' }}>
          {editBatchId ? '자재검수 내역 수정모드 ✏️' : '현장 자재검수 시스템'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        
        {/* 공통 입력: 현장, 파트, 일자 */}
        <div style={{ padding: '16px', background: editBatchId ? '#fef08a' : '#e2e8f0', borderRadius: '12px', transition: 'all 0.3s' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#334155' }}>
            {editBatchId ? '기본 정보 (수정 중)' : '기본 정보'}
          </h3>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>입고 일자</label>
              <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} className="input-field" style={{ padding: '10px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>작업 내용</label>
              <input type="text" placeholder="예: 4월분 자재입고 사진" value={workDescription} onChange={e => setWorkDescription(e.target.value)} className="input-field" style={{ padding: '10px' }} required />
            </div>
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
                  placeholder="예: 멀티조인트"
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

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="납품처(제조사) - 선택"
                  value={item.supplier}
                  onChange={e => handleItemChange(item.id, 'supplier', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 사진 버튼 */}
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
          ➕ 추가 자재 등록하기
        </button>

        {/* 제출 구역 */}
        <div style={{ background: '#fff', padding: '16px', display: 'flex', gap: '10px' }}>
            {editBatchId && (
              <button 
                type="button"
                onClick={() => {
                  setItems([createEmptyItem()]);
                  setEditBatchId(null);
                }}
                className="action-btn"
                style={{ flex: 1, background: '#94a3b8', color: '#fff', padding: '16px', fontSize: '1.1rem' }}
              >
                수정 취소
              </button>
            )}
            <button 
              type="submit" 
              className="action-btn" 
              disabled={loading}
              style={{ flex: editBatchId ? 2 : 1, background: editBatchId ? '#f59e0b' : 'var(--primary-color)', color: '#fff', padding: '16px', fontSize: '1.1rem' }}
            >
              {loading ? '처리 중...' : (editBatchId ? `총 ${items.length}개 자재 수정 완료` : `총 ${items.length}개 자재 검수 제출하기`)}
            </button>
        </div>
      </form>

      {/* 등록 현황 (관리자 제외 모바일 화면에서도 바로 확인) */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
          📝 최근 등록된 검수 내역
        </h3>
        
        {historyBatches.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>아직 등록된 자재가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {historyBatches.map(batch => (
              <div key={batch.id} style={{ border: '2px solid #cbd5e1', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
                {/* 배치 헤더 */}
                <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>
                      📅 {batch.receiveDate} ({batch.part === 'facility' ? '시설' : '미화'})
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>등록 항목: {batch.items ? batch.items.length : 0}건</p>
                  </div>
                  <button 
                    onClick={() => window.open(`/api/admin/export-material-excel?site=${site}&part=${batch.part}&date=${batch.receiveDate}&id=${batch.id}`, '_blank')}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    문서 저장
                  </button>
                </div>
                
                {/* 뱃지 형식의 아이템 요약 */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {(batch.items || []).map((item: any, i: number) => (
                      <span key={item.id || i} style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid #bfdbfe' }}>
                        {item.materialName} ({item.quantity})
                      </span>
                    ))}
                  </div>

                  {/* 일괄 수정/삭제 액션 버튼 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEditBatch(batch)} style={{ flex: 1, padding: '10px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold' }}>
                      전체 수정하기 (항목 추가/삭제)
                    </button>
                    <button onClick={() => deleteBatch(batch.id)} style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 'bold' }}>
                      전체 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
