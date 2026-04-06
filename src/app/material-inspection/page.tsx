'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
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
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchHistory = async () => {
    try {
      // 해당 현장의 전체 내역 조회
      const res = await fetch(`/api/material?site=${site}&part=all`);
      const data = await res.json();
      if (data.success) {
        setHistoryItems(data.records || []);
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

      alert('성공적으로 저장되었습니다!');
      // 초기화
      setItems([createEmptyItem()]);
      // 리스트 갱신
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (record: any) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = async () => {
    try {
      const res = await fetch('/api/material', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        alert('수정되었습니다.');
        setEditingId(null);
        fetchHistory();
      } else {
        alert('수정 실패');
      }
    } catch (err) {
      console.error(err);
      alert('수정 중 오류 발생');
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
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
          현장 자재검수 시스템
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        
        {/* 공통 입력: 현장, 파트, 일자 */}
        <div style={{ padding: '16px', background: '#e2e8f0', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#334155' }}>기본 정보</h3>
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
          ➕ 자재 항목 추가하기
        </button>

        {/* 제출 구역 */}
        <div style={{ background: '#fff', padding: '16px' }}>
            <button 
              type="submit" 
              className="action-btn" 
              disabled={loading}
              style={{ width: '100%', background: 'var(--primary-color)', color: '#fff', padding: '16px', fontSize: '1.1rem' }}
            >
              {loading ? '일괄 저장 중...' : `총 ${items.length}개 자재 검수 제출하기`}
            </button>
        </div>
      </form>

      {/* 등록 현황 (관리자 제외 모바일 화면에서도 바로 확인) */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
          📝 최근 등록된 검수 내역
        </h3>
        
        {historyItems.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>아직 등록된 자재가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyItems.map((record) => (
              <div key={record.id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                {editingId === record.id ? (
                  // 수정 모드
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" className="input-field" value={editFormData.materialName} onChange={(e) => setEditFormData({...editFormData, materialName: e.target.value})} placeholder="자재명" />
                    <input type="text" className="input-field" value={editFormData.specification} onChange={(e) => setEditFormData({...editFormData, specification: e.target.value})} placeholder="규격" />
                    <input type="number" className="input-field" value={editFormData.quantity} onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})} placeholder="수량" />
                    <select className="input-field" value={editFormData.part} onChange={(e) => setEditFormData({...editFormData, part: e.target.value})}>
                      <option value="facility">시설</option>
                      <option value="cleaning">미화</option>
                    </select>
                    <select className="input-field" value={editFormData.inspectionResult} onChange={(e) => setEditFormData({...editFormData, inspectionResult: e.target.value})}>
                      <option value="pass">합격</option>
                      <option value="fail">불합격</option>
                      <option value="pending">조건부</option>
                    </select>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={saveEdit} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none' }}>저장</button>
                      <button onClick={cancelEdit} style={{ flex: 1, padding: '8px', background: '#94a3b8', color: 'white', borderRadius: '8px', border: 'none' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  // 일반 보기 모드
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                        {record.receiveDate} | {record.part === 'facility' ? '시설' : '미화'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: record.inspectionResult === 'pass' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {record.inspectionResult === 'pass' ? '합격' : (record.inspectionResult === 'fail' ? '불합격' : '조건부')}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>{record.materialName}</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#475569' }}>
                      규격: {record.specification || '-'} | 수량: {record.quantity || '-'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(record)} style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold' }}>수정</button>
                      <button onClick={() => deleteRecord(record.id)} style={{ flex: 1, padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 'bold' }}>삭제</button>
                      {record.photoBase64 && (
                        <button onClick={() => {
                          const win = window.open('', '_blank');
                          if(win) win.document.write(`<img src="${record.photoBase64}" style="max-width: 100%" />`);
                        }} style={{ flex: 1, padding: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px' }}>사진 보기</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 엑셀 자동 변환 다운로드 카드 (추가됨) */}
      <div style={{ marginTop: '32px', padding: '24px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', border: '1px solid #86efac' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>
          📊 [결재용] 서류 양식 자동 내보내기
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '16px', lineHeight: '1.4' }}>
          위에서 등록한 데이터들을 원본 엑셀 서식(CHM-JT-자재-002)에 자동으로 쏙쏙 박아넣어 하나의 엑셀 파일로 완성해 줍니다. 월말 보고 시 클릭 한 번으로 끝내세요!
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#166534' }}>조회 월</label>
            <input 
              type="month" 
              className="input-field" 
              defaultValue={new Date().toISOString().slice(0, 7)}
              id="download-month"
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#166534' }}>파트 구분</label>
            <select className="input-field" id="download-part" defaultValue={part}>
              <option value="facility">시설</option>
              <option value="cleaning">미화</option>
            </select>
          </div>
          <button 
            type="button" 
            className="action-btn"
            style={{ width: '100%', minWidth: '140px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', fontSize: '1.05rem', marginTop: '8px' }}
            onClick={() => {
              const downloadMonth = (document.getElementById('download-month') as HTMLInputElement).value;
              const downloadPart = (document.getElementById('download-part') as HTMLSelectElement).value;
              if (!downloadMonth) return alert('월을 선택해주세요.');
              window.open(`/api/admin/export-material-excel?site=${site}&part=${downloadPart}&month=${downloadMonth}`, '_blank');
            }}
          >
            엑셀(.xlsx) 통합 다운로드
          </button>
        </div>
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
