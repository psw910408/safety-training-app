'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import masterDataJson from '@/data/chillerMasterData.json';

const masterData = masterDataJson as Record<string, ChillerData[]>;

type ChillerData = {
  name: string;
  type: string;
  manufacturer: string;
  year: string;
  refrigerant: string;
  rt: number;
  chilledWaterPipe: { size: string, material: string, outerDiameter: string, thickness: string, separation: string };
  coolingWaterPipe: { size: string, material: string, outerDiameter: string, thickness: string, separation: string };
};

const MATERIALS = ["", "카본스틸", "카본스틸/압력배관", "동관", "스테인레스"];
const SIZES = ["", "8", "10", "15", "20", "25", "32", "40", "50", "65", "80", "100", "125", "150", "200", "250", "300", "350", "400"];

const PIPE_DICT: Record<string, {od: string, thick: string, sep: string}> = {
  "카본스틸-200": { od: "216.3", thick: "5.85", sep: "187.511" },
  "카본스틸-250": { od: "267.4", thick: "6.4", sep: "239.492" },
  "카본스틸-300": { od: "318.5", thick: "7", sep: "291.669" },
  "동관-200": { od: "206.38", thick: "5.08", sep: "153.92" },
  "동관-250": { od: "257.18", thick: "6.35", sep: "203.236" },
  "동관-150": { od: "159.0", thick: "5.18", sep: "104.64" },
  "동관-125": { od: "133.0", thick: "3.18", sep: "79.9" },
  "스테인레스스틸-250": { od: "267.4", thick: "3.4", sep: "227.6" },
  "스테인레스-250": { od: "267.4", thick: "3.4", sep: "227.6" },
  "카본스틸/압력배관-150": { od: "165.2", thick: "7.1", sep: "142.0" },
  "카본스틸/압력배관-200": { od: "216.3", thick: "8.2", sep: "196.804" },
  "카본스틸/압력배관-250": { od: "267.4", thick: "9.3", sep: "239.492" }
};

const STANDARD_OD: Record<string, string> = {
  "8": "13.8", "10": "17.3", "15": "21.7", "20": "27.2", "25": "34.0", "32": "42.7", "40": "48.6", "50": "60.5", 
  "65": "76.3", "80": "89.1", "100": "114.3", "125": "139.8", "150": "165.2", "200": "216.3", "250": "267.4", 
  "300": "318.5", "350": "355.6", "400": "406.4"
};

const getPipeSpec = (mat: string, size: string) => {
  if (!mat || !size) return null;
  const key = `${mat}-${size}`;
  if (PIPE_DICT[key]) return PIPE_DICT[key];
  
  // 기본 계산 로직 (사전에 없는 조합 방어)
  if (mat === '동관' || mat === '동') {
    const odMap: Record<string, string> = { "125": "133.0", "150": "159.0" };
    const od = odMap[size] || (parseFloat(size) * 1.05).toFixed(1);
    return { od, thick: "4.0", sep: (parseFloat(od) * 0.7).toFixed(1) };
  }
  
  if (STANDARD_OD[size]) {
    const od = STANDARD_OD[size];
    const thick = mat.includes('스테인레스') ? "3.4" : "6.0";
    const sep = (parseFloat(od) * 0.85).toFixed(1);
    return { od, thick, sep };
  }
  
  return null;
};

const INITIAL_FORM = {
  // 냉수 배관 규격 (Step 2)
  chilledPipeMat: '', chilledPipeSize: '', chilledPipeOD: '', chilledPipeThick: '', chilledPipeSep: '',
  // 냉각수 배관 규격 (Step 2)
  coolingPipeMat: '', coolingPipeSize: '', coolingPipeOD: '', coolingPipeThick: '', coolingPipeSep: '',

  // 온도: 자동제어 (Step 3)
  autoChilledIn: '', autoChilledOut: '', autoCoolingIn: '', autoCoolingOut: '',
  // 온도: 표면온도 (Step 3)
  surfChilledIn: '', surfChilledOut: '', surfCoolingIn: '', surfCoolingOut: '',
  
  // 냉수 유량 (Step 3)
  chilledFlowDesign: '', chilledTempInDesign: '', chilledTempOutDesign: '',
  chilledFlowMeasure: '', chilledTempInMeasure: '', chilledTempOutMeasure: '',
  
  // 냉각수 유량 (Step 3)
  coolingFlowDesign: '', coolingTempInDesign: '', coolingTempOutDesign: '',
  coolingFlowMeasure: '', coolingTempInMeasure: '', coolingTempOutMeasure: '',

  // 기타 압력 등 (Step 4)
  evaporatorPressure: '',
  condenserPressure: '',
  chilledPumpHz: '60',
  coolingPumpHz: '60',
  towerFanFlow: ''
};

function CoolingInspectionContent() {
  const [step, setStep] = useState(1);
  const [siteText, setSiteText] = useState('');
  const [eqText, setEqText] = useState('');
  
  const [eqSpecs, setEqSpecs] = useState<ChillerData | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [drafts, setDrafts] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);

  const STORAGE_KEY = 'cooling_inspection_drafts';
  const COMPLETED_KEY = 'cooling_inspection_completed';

  useEffect(() => {
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) {
      try { setDrafts(JSON.parse(backup)); } catch (e) {}
    }
    const comp = localStorage.getItem(COMPLETED_KEY);
    if (comp) {
      try { setCompleted(JSON.parse(comp)); } catch (e) {}
    }
  }, []);

  const handleSaveDraft = () => {
    const timeStr = new Date().toLocaleString();
    const newDraft = {
      id: currentDraftId || Date.now(),
      siteText,
      eqText: eqText || '기기 미지정',
      date: timeStr,
      formData,
      step
    };
    
    let updatedDrafts = [];
    if (currentDraftId) {
      updatedDrafts = drafts.map(d => d.id === currentDraftId ? newDraft : d);
    } else {
      updatedDrafts = [...drafts, newDraft];
      setCurrentDraftId(newDraft.id);
    }
    
    setDrafts(updatedDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
    setLastSaved(new Date().toLocaleTimeString());
    alert(`현재 상태가 보관함에 저장되었습니다! 화면 아래에서 저장된 목록을 확인할 수 있습니다.`);
  };

  const handleLoadDraft = (draft: any) => {
    if (confirm('현재 작성 중인 내용이 덮어씌워집니다. 불러오시겠습니까?')) {
      setSiteText(draft.siteText || '');
      setEqText(draft.eqText || '');
      setFormData(draft.formData || INITIAL_FORM);
      setStep(draft.step || 1);
      setCurrentDraftId(draft.id);
    }
  };

  const handleDeleteDraft = (id: number) => {
    if (confirm('이 임시 저장본을 완전히 삭제하시겠습니까?')) {
      const updated = drafts.filter(d => d.id !== id);
      setDrafts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (currentDraftId === id) setCurrentDraftId(null);
    }
  };

  useEffect(() => {
    const siteEqs = masterData[siteText] || [];
    const matchedEq = siteEqs.find(e => e.name === eqText);
    setEqSpecs(matchedEq || null);

    const normalizeMat = (m: string) => {
      if (m.includes('스테인레스')) return '스테인레스';
      if (m === '동') return '동관';
      return m;
    };
    const normalizeSize = (s: string) => s.toLowerCase().replace(/a$/, '').trim();

    if (matchedEq) {
      setFormData(prev => ({
        ...prev,
        chilledPipeMat: normalizeMat(matchedEq.chilledWaterPipe?.material || prev.chilledPipeMat),
        chilledPipeSize: normalizeSize(matchedEq.chilledWaterPipe?.size || prev.chilledPipeSize),
        chilledPipeOD: matchedEq.chilledWaterPipe?.outerDiameter || prev.chilledPipeOD,
        chilledPipeThick: matchedEq.chilledWaterPipe?.thickness || prev.chilledPipeThick,
        chilledPipeSep: matchedEq.chilledWaterPipe?.separation || prev.chilledPipeSep,
        
        coolingPipeMat: normalizeMat(matchedEq.coolingWaterPipe?.material || prev.coolingPipeMat),
        coolingPipeSize: normalizeSize(matchedEq.coolingWaterPipe?.size || prev.coolingPipeSize),
        coolingPipeOD: matchedEq.coolingWaterPipe?.outerDiameter || prev.coolingPipeOD,
        coolingPipeThick: matchedEq.coolingWaterPipe?.thickness || prev.coolingPipeThick,
        coolingPipeSep: matchedEq.coolingWaterPipe?.separation || prev.coolingPipeSep,
      }));
    }
  }, [siteText, eqText]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Auto-fill dictionary logic for pipe dimensions
    if (name === 'chilledPipeMat' || name === 'chilledPipeSize') {
      const mat = name === 'chilledPipeMat' ? value : formData.chilledPipeMat;
      const size = name === 'chilledPipeSize' ? value : formData.chilledPipeSize;
      const cleanSize = size.toLowerCase().replace(/a$/, '').trim();
      const spec = getPipeSpec(mat.trim(), cleanSize);
      if (spec) {
        newFormData.chilledPipeOD = spec.od;
        newFormData.chilledPipeThick = spec.thick;
        newFormData.chilledPipeSep = spec.sep;
      }
    }
    if (name === 'coolingPipeMat' || name === 'coolingPipeSize') {
      const mat = name === 'coolingPipeMat' ? value : formData.coolingPipeMat;
      const size = name === 'coolingPipeSize' ? value : formData.coolingPipeSize;
      const cleanSize = size.toLowerCase().replace(/a$/, '').trim();
      const spec = getPipeSpec(mat.trim(), cleanSize);
      if (spec) {
        newFormData.coolingPipeOD = spec.od;
        newFormData.coolingPipeThick = spec.thick;
        newFormData.coolingPipeSep = spec.sep;
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeStr = new Date().toLocaleString();
    const newComp = {
      id: Date.now(),
      siteText,
      eqText: eqText || '기기 미지정',
      date: timeStr,
      formData
    };

    const updatedComp = [newComp, ...completed];
    setCompleted(updatedComp);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(updatedComp));

    if (currentDraftId) {
      const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
      setDrafts(updatedDrafts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
    }

    alert('✅ 점검 데이터가 최종 완료되어 하단 보관함에 저장되었습니다!');
    
    // 폼 초기화 및 화면 이동
    setFormData(INITIAL_FORM);
    setSiteText('');
    setEqText('');
    setCurrentDraftId(null);
    setStep(1);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const calcDiff = (inTemp: string, outTemp: string) => {
    const vIn = parseFloat(inTemp);
    const vOut = parseFloat(outTemp);
    if (isNaN(vIn) || isNaN(vOut)) return '-';
    return (vIn - vOut).toFixed(1);
  };

  const calcRT = (lpm: string, inTemp: string, outTemp: string) => {
    const vLpm = parseFloat(lpm);
    const vIn = parseFloat(inTemp);
    const vOut = parseFloat(outTemp);
    if (isNaN(vLpm) || isNaN(vIn) || isNaN(vOut)) return '-';
    const diff = vIn - vOut;
    return ((vLpm * 60 * diff) / 3024).toFixed(1);
  };

  return (
    <div className="card" style={{ padding: '20px', position: 'relative' }}>
      <style>{`
        input::-webkit-calendar-picker-indicator {
          display: none !important;
        }
      `}</style>
      <div className="header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>❄️ 냉방장비 성능점검</h2>
          <p>모바일 기입 시스템 (전국 통합)</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button type="button" onClick={handleSaveDraft} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>
            💾 중간 저장
          </button>
          {lastSaved && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{lastSaved} 백업됨</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {[1, 2, 3, 4].map(num => (
          <div key={num} onClick={() => setStep(num)} style={{ 
            flex: 1, textAlign: 'center', padding: '10px 4px', 
            background: step === num ? 'var(--primary-color)' : '#e2e8f0',
            color: step === num ? '#fff' : '#64748b',
            borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {num}단계
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>1. 기기 정보 (수기 입력 및 자동완성)</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>사옥 선택</label>
              <input type="text" list="site-list" className="input-field" value={siteText} onChange={(e) => setSiteText(e.target.value)} placeholder="ex: 삼화타워" />
              <datalist id="site-list">
                {Object.keys(masterData).map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>점검 냉동기 선택</label>
              <input type="text" list="eq-list" className="input-field" value={eqText} onChange={(e) => setEqText(e.target.value)} placeholder="ex: 스크류냉동기 1호기" />
              <datalist id="eq-list">
                {(masterData[siteText] || []).map(eq => <option key={eq.name} value={eq.name} />)}
              </datalist>
            </div>

            {eqSpecs ? (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #10b981', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ marginBottom: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✅</span> 장비 매칭 완료! (마스터 데이터 연동)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                  <div><strong>형식:</strong> {eqSpecs.type}</div>
                  <div><strong>제조사:</strong> {eqSpecs.manufacturer}</div>
                  <div><strong>용량:</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{eqSpecs.rt} RT</span></div>
                  <div><strong>냉매:</strong> {eqSpecs.refrigerant}</div>
                  <div style={{ gridColumn: '1 / span 2', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px dashed #10b981' }}>
                    <strong>🔵 냉수배관:</strong> {eqSpecs.chilledWaterPipe.size}mm / {eqSpecs.chilledWaterPipe.material}
                  </div>
                  <div style={{ gridColumn: '1 / span 2', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px dashed #10b981' }}>
                    <strong>🟢 냉각수배관:</strong> {eqSpecs.coolingWaterPipe.size}mm / {eqSpecs.coolingWaterPipe.material}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d', fontSize: '0.9rem', color: '#b45309' }}>
                ℹ️ 위 입력칸에 글자를 치면 목록이 나옵니다. (목록에 없는 기기면 그대로 수기 진행 가능합니다.)
              </div>
            )}
            
            <button type="button" className="btn" style={{ marginTop: '24px' }} onClick={() => setStep(2)}>다음 단계로 ➔</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>2. 유량계 세팅용 배관 정보</h3>
            
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #0369a1', marginBottom: '16px' }}>
              <h4 style={{ color: '#0369a1', marginBottom: '12px' }}>🔵 냉수 배관 규격</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>재질</label>
                  <select name="chilledPipeMat" className="input-field" value={formData.chilledPipeMat} onChange={handleChange}>
                    {MATERIALS.map(m => <option key={m} value={m}>{m === "" ? "선택" : m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>호칭(A)</label>
                  <select name="chilledPipeSize" className="input-field" value={formData.chilledPipeSize} onChange={handleChange}>
                    {SIZES.map(s => <option key={s} value={s}>{s === "" ? "선택" : `${s}A`}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>외경 (mm)</label><input type="text" name="chilledPipeOD" className="input-field" value={formData.chilledPipeOD} onChange={handleChange} /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>두께 (mm)</label><input type="text" name="chilledPipeThick" className="input-field" value={formData.chilledPipeThick} onChange={handleChange} /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>센서 이격거리 (mm)</label><input type="text" name="chilledPipeSep" className="input-field" value={formData.chilledPipeSep} onChange={handleChange} /></div>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #15803d', marginBottom: '24px' }}>
              <h4 style={{ color: '#15803d', marginBottom: '12px' }}>🟢 냉각수 배관 규격</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>재질</label>
                  <select name="coolingPipeMat" className="input-field" value={formData.coolingPipeMat} onChange={handleChange}>
                    {MATERIALS.map(m => <option key={m} value={m}>{m === "" ? "선택" : m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>호칭(A)</label>
                  <select name="coolingPipeSize" className="input-field" value={formData.coolingPipeSize} onChange={handleChange}>
                    {SIZES.map(s => <option key={s} value={s}>{s === "" ? "선택" : `${s}A`}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>외경 (mm)</label><input type="text" name="coolingPipeOD" className="input-field" value={formData.coolingPipeOD} onChange={handleChange} /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>두께 (mm)</label><input type="text" name="coolingPipeThick" className="input-field" value={formData.coolingPipeThick} onChange={handleChange} /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>센서 이격거리 (mm)</label><input type="text" name="coolingPipeSep" className="input-field" value={formData.coolingPipeSep} onChange={handleChange} /></div>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d', fontSize: '0.9rem', color: '#b45309', marginBottom: '24px' }}>
              ℹ️ 재질과 호칭을 기입하면 외경, 두께, 센서이격거리가 <strong>사전 기반으로 자동 입력</strong>됩니다! (수기로 덮어쓰기도 가능합니다)
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn" style={{ background: '#64748b' }} onClick={() => setStep(1)}>⬅ 이전</button>
              <button type="button" className="btn" onClick={() => setStep(3)}>다음 단계로 ➔</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>3. 냉동기 온도 및 냉각 유량</h3>
            
            {/* 섹션 A: 냉동기 온도 */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>🌡️ [냉동기 온도] (단위: ℃)</h4>
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '450px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>측정 방식</th>
                      <th style={{ padding: '8px', textAlign: 'center', color:'#0369a1' }}>냉수 입구</th>
                      <th style={{ padding: '8px', textAlign: 'center', color:'#0369a1' }}>냉수 출구</th>
                      <th style={{ padding: '8px', textAlign: 'center', color:'#15803d' }}>냉각수 입구</th>
                      <th style={{ padding: '8px', textAlign: 'center', color:'#15803d' }}>냉각수 출구</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>자동제어<br/>기록값</td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="autoChilledIn" className="input-field" style={{padding:'6px'}} value={formData.autoChilledIn} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="autoChilledOut" className="input-field" style={{padding:'6px'}} value={formData.autoChilledOut} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="autoCoolingIn" className="input-field" style={{padding:'6px'}} value={formData.autoCoolingIn} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="autoCoolingOut" className="input-field" style={{padding:'6px'}} value={formData.autoCoolingOut} onChange={handleChange} /></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>표면온도<br/>측정값</td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="surfChilledIn" className="input-field" style={{padding:'6px'}} value={formData.surfChilledIn} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="surfChilledOut" className="input-field" style={{padding:'6px'}} value={formData.surfChilledOut} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="surfCoolingIn" className="input-field" style={{padding:'6px'}} value={formData.surfCoolingIn} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="surfCoolingOut" className="input-field" style={{padding:'6px'}} value={formData.surfCoolingOut} onChange={handleChange} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 섹션 B: 냉각 유량 */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💧 [냉각 유량] (RT 자동계산)</span>
                <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px' }}>
                  RT = LPM × 60 × ΔT ÷ 3024
                </span>
              </h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>배관구분</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>유량(LPM)</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>입구온도</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>출구온도</th>
                      <th style={{ padding: '8px', textAlign: 'center', background: '#e0f2fe' }}>온도차(ΔT)</th>
                      <th style={{ padding: '8px', textAlign: 'center', background: '#dbeafe' }}>냉방열량(RT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 냉수 설계 */}
                    <tr style={{ borderBottom: '1px dashed #e2e8f0', background: '#fafafa' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#0369a1' }}>냉수 (설계)</td>
                      <td style={{ padding: '4px' }}><input type="number" name="chilledFlowDesign" className="input-field" style={{padding:'6px'}} value={formData.chilledFlowDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="chilledTempInDesign" className="input-field" style={{padding:'6px'}} value={formData.chilledTempInDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="chilledTempOutDesign" className="input-field" style={{padding:'6px'}} value={formData.chilledTempOutDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f0f9ff' }}>{calcDiff(formData.chilledTempInDesign, formData.chilledTempOutDesign)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1', background: '#eff6ff' }}>{calcRT(formData.chilledFlowDesign, formData.chilledTempInDesign, formData.chilledTempOutDesign)}</td>
                    </tr>
                    {/* 냉수 측정 */}
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#0369a1' }}>냉수 (측정)</td>
                      <td style={{ padding: '4px' }}><input type="number" name="chilledFlowMeasure" className="input-field" style={{padding:'6px', border: '1px solid #0369a1'}} value={formData.chilledFlowMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="chilledTempInMeasure" className="input-field" style={{padding:'6px', border: '1px solid #0369a1'}} value={formData.chilledTempInMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="chilledTempOutMeasure" className="input-field" style={{padding:'6px', border: '1px solid #0369a1'}} value={formData.chilledTempOutMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f0f9ff' }}>{calcDiff(formData.chilledTempInMeasure, formData.chilledTempOutMeasure)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1', fontSize:'1.1rem', background: '#eff6ff' }}>{calcRT(formData.chilledFlowMeasure, formData.chilledTempInMeasure, formData.chilledTempOutMeasure)}</td>
                    </tr>
                    
                    {/* 냉각수 설계 */}
                    <tr style={{ borderBottom: '1px dashed #e2e8f0', background: '#fafafa' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#15803d' }}>냉각수 (설계)</td>
                      <td style={{ padding: '4px' }}><input type="number" name="coolingFlowDesign" className="input-field" style={{padding:'6px'}} value={formData.coolingFlowDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="coolingTempInDesign" className="input-field" style={{padding:'6px'}} value={formData.coolingTempInDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="coolingTempOutDesign" className="input-field" style={{padding:'6px'}} value={formData.coolingTempOutDesign} onChange={handleChange} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f0fdf4' }}>{calcDiff(formData.coolingTempInDesign, formData.coolingTempOutDesign)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#15803d', background: '#f0fdfa' }}>{calcRT(formData.coolingFlowDesign, formData.coolingTempInDesign, formData.coolingTempOutDesign)}</td>
                    </tr>
                    {/* 냉각수 측정 */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#15803d' }}>냉각수 (측정)</td>
                      <td style={{ padding: '4px' }}><input type="number" name="coolingFlowMeasure" className="input-field" style={{padding:'6px', border: '1px solid #15803d'}} value={formData.coolingFlowMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="coolingTempInMeasure" className="input-field" style={{padding:'6px', border: '1px solid #15803d'}} value={formData.coolingTempInMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.1" name="coolingTempOutMeasure" className="input-field" style={{padding:'6px', border: '1px solid #15803d'}} value={formData.coolingTempOutMeasure} onChange={handleChange} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f0fdf4' }}>{calcDiff(formData.coolingTempInMeasure, formData.coolingTempOutMeasure)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#15803d', fontSize:'1.1rem', background: '#f0fdfa' }}>{calcRT(formData.coolingFlowMeasure, formData.coolingTempInMeasure, formData.coolingTempOutMeasure)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn" style={{ background: '#64748b' }} onClick={() => setStep(2)}>⬅ 이전</button>
              <button type="button" className="btn" onClick={() => setStep(4)}>다음 단계로 ➔</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>4. 펌프 및 기타 압력</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>증발기 압력</label>
                <input type="text" name="evaporatorPressure" className="input-field" value={formData.evaporatorPressure} onChange={handleChange} placeholder="ex) 430mmHg" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>응축기 압력</label>
                <input type="text" name="condenserPressure" className="input-field" value={formData.condenserPressure} onChange={handleChange} placeholder="ex) 0.42 ㎏/㎠" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>냉수펌프 인버터 (Hz)</label>
                <input type="number" step="0.1" name="chilledPumpHz" className="input-field" value={formData.chilledPumpHz} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>냉각수펌프 인버터 (Hz)</label>
                <input type="number" step="0.1" name="coolingPumpHz" className="input-field" value={formData.coolingPumpHz} onChange={handleChange} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>냉각탑 풍량 (㎥/h)</label>
              <input type="number" name="towerFanFlow" className="input-field" value={formData.towerFanFlow} onChange={handleChange} placeholder="ex) 134000" />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn" style={{ background: '#64748b', flex: '1' }} onClick={() => setStep(3)}>⬅ 이전</button>
              <button type="submit" className="btn" style={{ flex: '2', background: '#10b981' }}>✅ 최종 완료 및 저장</button>
            </div>
          </div>
        )}
      </form>

      {/* 보관함 (임시 저장본) */}
      {drafts.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '2px dashed #cbd5e1', paddingTop: '16px', animation: 'fadeIn 0.3s ease' }}>
          <h4 style={{ marginBottom: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💾</span> 임시 저장 보관함 ({drafts.length}건)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drafts.map(draft => (
              <div key={draft.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{draft.siteText || '사옥 미지정'} - {draft.eqText}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>저장일시: {draft.date} / 진행: {draft.step}단계</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => handleLoadDraft(draft)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>불러오기</button>
                  <button type="button" onClick={() => handleDeleteDraft(draft.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최종 완료 보관함 */}
      {completed.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '2px solid #10b981', paddingTop: '16px', animation: 'fadeIn 0.3s ease' }}>
          <h4 style={{ marginBottom: '12px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> 최종 완료된 점검 파일 ({completed.length}건)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completed.map(comp => (
              <div key={comp.id} style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>{comp.siteText} - {comp.eqText}</div>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>완료일시: {comp.date}</div>
                </div>
                <button type="button" onClick={() => {
                  if(confirm('완료된 파일을 다시 열어보시겠습니까? 현재 작성중인 내용은 덮어씌워집니다.')) {
                     setSiteText(comp.siteText);
                     setEqText(comp.eqText);
                     setFormData(comp.formData);
                     setStep(1);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  다시 열기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function CoolingInspectionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}>
      <CoolingInspectionContent />
    </Suspense>
  );
}
