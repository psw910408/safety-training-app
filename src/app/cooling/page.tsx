'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import masterDataJson from '@/data/chillerMasterData.json';
import pipeDataJson from '@/data/pipeMasterData.json';

const masterData = masterDataJson as Record<string, ChillerData[]>;
const pipeData = pipeDataJson as any;

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

const getPipeSpec = (mat: string, size: string) => {
  if (!mat || !size) return null;
  let type = 'carbon';
  if (mat.includes('동')) type = 'copper';
  else if (mat.includes('스테인레스')) type = 'stainless';
  else if (mat.includes('카본스틸')) type = 'carbon';
  const spec = pipeData[type][size];
  if (spec && spec.od && spec.thick) return { od: spec.od, thick: spec.thick, sep: spec.sep };
  if (type === 'copper') {
    const od = (parseFloat(size) * 1.05).toFixed(1);
    return { od, thick: "4.0", sep: (parseFloat(od) * 0.7).toFixed(1) };
  } else {
    const od = (parseFloat(size) * 1.1).toFixed(1);
    return { od, thick: "6.0", sep: (parseFloat(od) * 0.85).toFixed(1) };
  }
};

const INITIAL_FORM = {
  inspDate: '', outTemp: '', outHumid: '',
  eqType: '', eqCapacity: '', eqPower: '', eqVolt: '', eqCurrent: '',
  chilledPipeMat: '', chilledPipeSize: '', chilledPipeOD: '', chilledPipeThick: '', chilledPipeSep: '',
  coolingPipeMat: '', coolingPipeSize: '', coolingPipeOD: '', coolingPipeThick: '', coolingPipeSep: '',
  
  cpChilledIn: '', cpChilledOut: '', cpCoolingIn: '', cpCoolingOut: '',
  cpCurrent: '', cpOilTemp: '', cpOilPress: '', cpEvapPress: '', cpCondPress: '',
  cpCapCtrl: '', cpEvapRefTemp: '', cpCondRefTemp: '', cpOilDiffPress: '',
  
  autoChilledIn: '', autoChilledOut: '', autoCoolingIn: '', autoCoolingOut: '',
  surfChilledIn: '', surfChilledOut: '', surfCoolingIn: '', surfCoolingOut: '',
  
  chilledFlowDesign: '', chilledTempInDesign: '', chilledTempOutDesign: '',
  chilledFlowMeasure: '', chilledTempInMeasure: '', chilledTempOutMeasure: '',
  coolingFlowDesign: '', coolingTempInDesign: '', coolingTempOutDesign: '',
  coolingFlowMeasure: '', coolingTempInMeasure: '', coolingTempOutMeasure: '',

  pumpChilledInvD: '', pumpChilledCurD: '', pumpChilledFlowD: '', pumpChilledHeadD: '', pumpChilledInPressD: '', pumpChilledOutPressD: '',
  pumpChilledInvM: '', pumpChilledCurM: '', pumpChilledFlowM: '', pumpChilledHeadM: '', pumpChilledInPressM: '', pumpChilledOutPressM: '',
  pumpCoolingInvD: '', pumpCoolingCurD: '', pumpCoolingFlowD: '', pumpCoolingHeadD: '', pumpCoolingInPressD: '', pumpCoolingOutPressD: '',
  pumpCoolingInvM: '', pumpCoolingCurM: '', pumpCoolingFlowM: '', pumpCoolingHeadM: '', pumpCoolingInPressM: '', pumpCoolingOutPressM: '',

  towerInvD: '', towerCurD: '', towerFlowD: '', towerPressD: '', towerInTempD: '', towerInHumidD: '', towerOutTempD: '', towerOutHumidD: '',
  towerInvM: '', towerCurM: '', towerFlowM: '', towerPressM: '', towerInTempM: '', towerInHumidM: '', towerOutTempM: '', towerOutHumidM: '',

  panelVoltD: '', panelCurD: '', panelPfD: '0.95',
  panelVoltM: '', panelCurM: '', panelPfM: '0.95'
};

const calcWetBulb = (tStr: string, rhStr: string) => {
  const T = parseFloat(tStr); const RH = parseFloat(rhStr);
  if (isNaN(T) || isNaN(RH)) return '-';
  const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
  return Tw.toFixed(2);
};

const calcEnthalpy = (tStr: string, rhStr: string) => {
  const T = parseFloat(tStr); const RH = parseFloat(rhStr);
  if (isNaN(T) || isNaN(RH)) return '-';
  const Pws = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
  const Pw = Pws * (RH / 100);
  const W = 0.622 * Pw / (1013.25 - Pw);
  const h_kJ = 1.006 * T + W * (2501 + 1.84 * T);
  return (h_kJ / 4.186).toFixed(2);
};

const calcCRT = (flowStr: string, hIn: string, hOut: string) => {
  const flow = parseFloat(flowStr); const hin = parseFloat(hIn); const hout = parseFloat(hOut);
  if (isNaN(flow) || isNaN(hin) || isNaN(hout)) return '-';
  return ((flow * 1.2 * Math.abs(hout - hin)) / 3900).toFixed(1);
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

  
  const handleDeleteDraft = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated); localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updated));
  };
  const handleRenameDraft = (id: number) => {
    const newTitle = prompt('새로운 이름을 입력하세요:');
    if (!newTitle) return;
    const updated = drafts.map(d => d.id === id ? { ...d, title: newTitle } : d);
    setDrafts(updated); localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updated));
  };
  const handleDeleteComp = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const updated = completed.filter(d => d.id !== id);
    setCompleted(updated); localStorage.setItem('cooling_inspection_completed', JSON.stringify(updated));
  };
  const handleRenameComp = (id: number) => {
    const newTitle = prompt('새로운 이름을 입력하세요:');
    if (!newTitle) return;
    const updated = completed.map(d => d.id === id ? { ...d, title: newTitle } : d);
    setCompleted(updated); localStorage.setItem('cooling_inspection_completed', JSON.stringify(updated));
  };

  useEffect(() => {
    try {
      const backup = localStorage.getItem('cooling_inspection_drafts');
      if (backup) setDrafts(JSON.parse(backup));
      const comp = localStorage.getItem('cooling_inspection_completed');
      if (comp) setCompleted(JSON.parse(comp));
    } catch (e) {}
  }, []);

  const handleSaveDraft = () => {
    const newDraft = { id: currentDraftId || Date.now(), siteText, eqText: eqText || '기기 미지정', title: `${siteText || '미지정'}-${eqText || '기기 미지정'}`, date: new Date().toLocaleString(), formData, step };
    const updatedDrafts = currentDraftId ? drafts.map(d => d.id === currentDraftId ? newDraft : d) : [...drafts, newDraft];
    if (!currentDraftId) setCurrentDraftId(newDraft.id);
    setDrafts(updatedDrafts);
    localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updatedDrafts));
    setLastSaved(new Date().toLocaleTimeString());
    alert('중간 저장되었습니다!');
  };

  const handleLoadDraft = (draft: any) => {
    if (confirm('현재 내용이 덮어씌워집니다. 불러오시겠습니까?')) {
      setSiteText(draft.siteText || ''); setEqText(draft.eqText || ''); setFormData(draft.formData || INITIAL_FORM); setStep(draft.step || 1); setCurrentDraftId(draft.id);
    }
  };

  useEffect(() => {
    const siteEqs = masterData[siteText] || [];
    const matchedEq = siteEqs.length > 0 ? siteEqs[0] : null;
    setEqSpecs(matchedEq || null);
    
    if (matchedEq) {
      setFormData(prev => ({
        ...prev,
        eqType: matchedEq.type || prev.eqType,
        eqCapacity: matchedEq.rt ? String(matchedEq.rt) : prev.eqCapacity,
        chilledPipeMat: matchedEq.chilledWaterPipe?.material?.includes('스테인레스') ? '스테인레스' : matchedEq.chilledWaterPipe?.material || prev.chilledPipeMat,
        chilledPipeSize: (matchedEq.chilledWaterPipe?.size || '').toLowerCase().replace(/a$/, '').trim() || prev.chilledPipeSize,
        coolingPipeMat: matchedEq.coolingWaterPipe?.material?.includes('스테인레스') ? '스테인레스' : matchedEq.coolingWaterPipe?.material || prev.coolingPipeMat,
        coolingPipeSize: (matchedEq.coolingWaterPipe?.size || '').toLowerCase().replace(/a$/, '').trim() || prev.coolingPipeSize,
      }));
    }
  }, [siteText, eqText]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'chilledPipeMat' || name === 'chilledPipeSize') {
      const spec = getPipeSpec((name === 'chilledPipeMat' ? value : formData.chilledPipeMat).trim(), (name === 'chilledPipeSize' ? value : formData.chilledPipeSize).toLowerCase().replace(/a$/, '').trim());
      if (spec) { newFormData.chilledPipeOD = spec.od; newFormData.chilledPipeThick = spec.thick; newFormData.chilledPipeSep = spec.sep; }
    }
    if (name === 'coolingPipeMat' || name === 'coolingPipeSize') {
      const spec = getPipeSpec((name === 'coolingPipeMat' ? value : formData.coolingPipeMat).trim(), (name === 'coolingPipeSize' ? value : formData.coolingPipeSize).toLowerCase().replace(/a$/, '').trim());
      if (spec) { newFormData.coolingPipeOD = spec.od; newFormData.coolingPipeThick = spec.thick; newFormData.coolingPipeSep = spec.sep; }
    }
    setFormData(newFormData);
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newComp = { id: Date.now(), siteText, eqText: eqText || '미지정', title: `${siteText || '미지정'}-${eqText || '미지정'}`, date: new Date().toLocaleString(), formData };
    const updatedComp = [newComp, ...completed];
    setCompleted(updatedComp);
    localStorage.setItem('cooling_inspection_completed', JSON.stringify(updatedComp));
    
    // Excel Export Call
    try {
      const res = await fetch('/api/export-cooling-excel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, siteText, eqText })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Cooling_Inspection_${eqText || 'Report'}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        alert('엑셀 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('엑셀 생성 오류 발생');
    }

    if (currentDraftId) {
      const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updatedDrafts));
    }
    alert('최종 저장 및 엑셀 다운로드가 완료되었습니다!');
    setFormData(INITIAL_FORM); setSiteText(''); setEqText(''); setCurrentDraftId(null); setStep(1);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };


  const calcDiff = (v1: string, v2: string) => (parseFloat(v1) - parseFloat(v2)) || 0;
  const calcRT = (lpm: string, t1: string, t2: string) => {
    const diff = calcDiff(t1, t2);
    if (!diff || isNaN(parseFloat(lpm))) return '-';
    return ((parseFloat(lpm) * 60 * Math.abs(diff)) / 3024).toFixed(1);
  };

  const panelKvaD = ((1.732 * parseFloat(formData.panelVoltD) * parseFloat(formData.panelCurD)) / 1000).toFixed(1);
  const panelKwD = (parseFloat(panelKvaD) * parseFloat(formData.panelPfD)).toFixed(1);
  const panelRtD = (parseFloat(panelKwD) * 860 / 3024).toFixed(1);

  const panelKvaM = ((1.732 * parseFloat(formData.panelVoltM) * parseFloat(formData.panelCurM)) / 1000).toFixed(1);
  const panelKwM = (parseFloat(panelKvaM) * parseFloat(formData.panelPfM)).toFixed(1);
  const panelRtM = (parseFloat(panelKwM) * 860 / 3024).toFixed(1);

  const measuredRt = calcRT(formData.chilledFlowMeasure, formData.chilledTempInMeasure, formData.chilledTempOutMeasure);
  const loadFactor = (!isNaN(parseFloat(measuredRt)) && !isNaN(parseFloat(formData.eqCapacity))) ? ((parseFloat(measuredRt) / parseFloat(formData.eqCapacity)) * 100).toFixed(1) : '-';
  const copD = (!isNaN(parseFloat(formData.eqCapacity)) && !isNaN(parseFloat(formData.eqPower))) ? (parseFloat(formData.eqCapacity) / (parseFloat(formData.eqPower) * 860 / 3024)).toFixed(2) : '-';
  const copM = (!isNaN(parseFloat(measuredRt)) && !isNaN(parseFloat(panelRtM))) ? (parseFloat(measuredRt) / parseFloat(panelRtM)).toFixed(2) : '-';

  return (
    <div className="card" style={{ padding: '20px', position: 'relative' }}>
      <style>{`
    input::-webkit-calendar-picker-indicator { display: none !important; } 
    input[type="date"]::-webkit-calendar-picker-indicator { display: block !important; }
    td .input-field { min-width: 60px; padding: 6px; }
    th { padding: 8px 4px; }
  `}</style>
      <div className="header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>❄️ 냉방장비 성능점검</h2></div>
        <div style={{ textAlign: 'right' }}>
          <button type="button" onClick={handleSaveDraft} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💾 임시 저장</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {[1, 2, 3, 4].map(num => (
          <div key={num} onClick={() => setStep(num)} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: step === num ? 'var(--primary-color)' : '#e2e8f0', color: step === num ? '#fff' : '#64748b', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>{num}단계</div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>1. 기기 정보 및 환경 스펙</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>점검일시</label><input type="date" name="inspDate" className="input-field" value={formData.inspDate} onChange={handleChange} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>외기온도(℃)</label><input type="number" step="0.1" name="outTemp" className="input-field" value={formData.outTemp} onChange={handleChange} /></div>
                <div style={{ flex: 1 }}><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>외기습도(%)</label><input type="number" step="0.1" name="outHumid" className="input-field" value={formData.outHumid} onChange={handleChange} /></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>사옥 선택</label><input type="text" list="site-list" className="input-field" value={siteText} onChange={(e) => setSiteText(e.target.value)} placeholder="ex: 종로타워" /><datalist id="site-list">{Object.keys(masterData).map(s => <option key={s} value={s} />)}</datalist></div>
              
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '24px' }}>
              <h4 style={{ color: '#10b981', marginBottom: '12px' }}>기본 스펙</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>형식</label><input type="text" name="eqType" className="input-field" value={formData.eqType} onChange={handleChange} placeholder="ex) 저압터보" /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>용량 (RT)</label><input type="number" name="eqCapacity" className="input-field" value={formData.eqCapacity} onChange={handleChange} placeholder="ex) 200" /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>전력 (KW)</label><input type="number" name="eqPower" className="input-field" value={formData.eqPower} onChange={handleChange} placeholder="ex) 210" /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>전압 (V)</label><input type="number" name="eqVolt" className="input-field" value={formData.eqVolt} onChange={handleChange} placeholder="ex) 380" /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>전류 (A)</label><input type="number" name="eqCurrent" className="input-field" value={formData.eqCurrent} onChange={handleChange} placeholder="ex) 379.2" /></div>
              </div>
            </div>
            <button type="button" className="btn" onClick={() => setStep(2)}>다음 단계로 ➔</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>2. 유량계 세팅용 배관 정보</h3>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #0369a1', marginBottom: '16px' }}>
              <h4 style={{ color: '#0369a1', marginBottom: '12px' }}>🔵 냉수 배관 규격</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>재질</label><select name="chilledPipeMat" className="input-field" value={formData.chilledPipeMat} onChange={handleChange}>{MATERIALS.map(m => <option key={m} value={m}>{m === "" ? "선택" : m}</option>)}</select></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>호칭(A)</label><select name="chilledPipeSize" className="input-field" value={formData.chilledPipeSize} onChange={handleChange}>{SIZES.map(s => <option key={s} value={s}>{s === "" ? "선택" : `${s}A`}</option>)}</select></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>외경 (mm)</label><input type="text" name="chilledPipeOD" className="input-field" value={formData.chilledPipeOD} onChange={handleChange} /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>두께 (mm)</label><input type="text" name="chilledPipeThick" className="input-field" value={formData.chilledPipeThick} onChange={handleChange} /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>센서 이격거리 (mm)</label><input type="text" name="chilledPipeSep" className="input-field" value={formData.chilledPipeSep} onChange={handleChange} /></div>
              </div>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #15803d', marginBottom: '24px' }}>
              <h4 style={{ color: '#15803d', marginBottom: '12px' }}>🟢 냉각수 배관 규격</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>재질</label><select name="coolingPipeMat" className="input-field" value={formData.coolingPipeMat} onChange={handleChange}>{MATERIALS.map(m => <option key={m} value={m}>{m === "" ? "선택" : m}</option>)}</select></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>호칭(A)</label><select name="coolingPipeSize" className="input-field" value={formData.coolingPipeSize} onChange={handleChange}>{SIZES.map(s => <option key={s} value={s}>{s === "" ? "선택" : `${s}A`}</option>)}</select></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>외경 (mm)</label><input type="text" name="coolingPipeOD" className="input-field" value={formData.coolingPipeOD} onChange={handleChange} /></div>
                <div><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>두께 (mm)</label><input type="text" name="coolingPipeThick" className="input-field" value={formData.coolingPipeThick} onChange={handleChange} /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label style={{fontSize:'0.8rem', fontWeight:'bold'}}>센서 이격거리 (mm)</label><input type="text" name="coolingPipeSep" className="input-field" value={formData.coolingPipeSep} onChange={handleChange} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}><button type="button" className="btn" style={{ background: '#64748b' }} onClick={() => setStep(1)}>⬅ 이전</button><button type="button" className="btn" onClick={() => setStep(3)}>다음 단계로 ➔</button></div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>3. 운전 현황 데이터 (제어반/펌프/냉각탑)</h3>
            
            {/* Control Panel */}
            <div style={{ marginBottom: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ marginBottom: '12px', color: '#334155' }}>🎛️ [냉동기 운전상태-Control Panel 값]</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div><label>냉수입구 온도(℃)</label><input type="number" step="0.1" name="cpChilledIn" className="input-field" value={formData.cpChilledIn} onChange={handleChange} /></div>
                <div><label>냉수출구 온도(℃)</label><input type="number" step="0.1" name="cpChilledOut" className="input-field" value={formData.cpChilledOut} onChange={handleChange} /></div>
                <div><label>냉각수입구 온도(℃)</label><input type="number" step="0.1" name="cpCoolingIn" className="input-field" value={formData.cpCoolingIn} onChange={handleChange} /></div>
                <div><label>냉각수출구 온도(℃)</label><input type="number" step="0.1" name="cpCoolingOut" className="input-field" value={formData.cpCoolingOut} onChange={handleChange} /></div>
                <div><label>증발기 냉매온도(℃)</label><input type="number" step="0.1" name="cpEvapRefTemp" className="input-field" value={formData.cpEvapRefTemp} onChange={handleChange} /></div>
                <div><label>응축기 냉매온도(℃)</label><input type="number" step="0.1" name="cpCondRefTemp" className="input-field" value={formData.cpCondRefTemp} onChange={handleChange} /></div>
                <div><label>오일 온도(℃)</label><input type="number" step="0.1" name="cpOilTemp" className="input-field" value={formData.cpOilTemp} onChange={handleChange} /></div>
                <div><label>전류 (A)</label><input type="number" step="0.1" name="cpCurrent" className="input-field" value={formData.cpCurrent} onChange={handleChange} /></div>
                <div><label>증발기 압력</label><input type="text" name="cpEvapPress" className="input-field" value={formData.cpEvapPress} onChange={handleChange} /></div>
                <div><label>응축기 압력</label><input type="text" name="cpCondPress" className="input-field" value={formData.cpCondPress} onChange={handleChange} /></div>
                <div><label>오일 압력</label><input type="text" name="cpOilPress" className="input-field" value={formData.cpOilPress} onChange={handleChange} /></div>
                <div><label>오일 차압</label><input type="text" name="cpOilDiffPress" className="input-field" value={formData.cpOilDiffPress} onChange={handleChange} /></div>
                <div style={{ gridColumn: '1 / span 2' }}><label>용량 제어 (%)</label><input type="text" name="cpCapCtrl" className="input-field" value={formData.cpCapCtrl} onChange={handleChange} /></div>
              </div>
            </div>

            {/* 유량 (기존 Step 3) */}
            <div style={{ marginBottom: '24px', border: '1px solid #0369a1', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ marginBottom: '12px', color: '#0369a1' }}>💧 [냉각 유량 및 온도] (측정값 필수입력)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px', whiteSpace: 'nowrap' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}><th>구분</th><th>유량(LPM)</th><th>입구온도</th><th>출구온도</th><th>ΔT</th><th>RT계산</th></tr></thead>
                  <tbody>
                    <tr><td colSpan={6} style={{background:'#f0fdf4', fontWeight:'bold', padding:'4px'}}>🔵 냉수</td></tr>
                    <tr style={{ borderBottom: '1px dashed #e2e8f0' }}><td>정격</td>
                      <td><input type="number" name="chilledFlowDesign" className="input-field" value={formData.chilledFlowDesign} onChange={handleChange} /></td>
                      <td><input type="number" name="chilledTempInDesign" className="input-field" value={formData.chilledTempInDesign} onChange={handleChange} /></td>
                      <td><input type="number" name="chilledTempOutDesign" className="input-field" value={formData.chilledTempOutDesign} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{Math.abs(calcDiff(formData.chilledTempInDesign, formData.chilledTempOutDesign)).toFixed(1)}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#0369a1'}}>{calcRT(formData.chilledFlowDesign, formData.chilledTempInDesign, formData.chilledTempOutDesign)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold' }}>측정</td>
                      <td><input type="number" name="chilledFlowMeasure" className="input-field" value={formData.chilledFlowMeasure} onChange={handleChange} /></td>
                      <td><input type="number" name="chilledTempInMeasure" className="input-field" value={formData.chilledTempInMeasure} onChange={handleChange} /></td>
                      <td><input type="number" name="chilledTempOutMeasure" className="input-field" value={formData.chilledTempOutMeasure} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{Math.abs(calcDiff(formData.chilledTempInMeasure, formData.chilledTempOutMeasure)).toFixed(1)}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#0369a1'}}>{calcRT(formData.chilledFlowMeasure, formData.chilledTempInMeasure, formData.chilledTempOutMeasure)}</td>
                    </tr>
                    <tr><td colSpan={6} style={{background:'#f0fdf4', fontWeight:'bold', padding:'4px'}}>🟢 냉각수</td></tr>
                    <tr style={{ borderBottom: '1px dashed #e2e8f0' }}><td>정격</td>
                      <td><input type="number" name="coolingFlowDesign" className="input-field" value={formData.coolingFlowDesign} onChange={handleChange} /></td>
                      <td><input type="number" name="coolingTempInDesign" className="input-field" value={formData.coolingTempInDesign} onChange={handleChange} /></td>
                      <td><input type="number" name="coolingTempOutDesign" className="input-field" value={formData.coolingTempOutDesign} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{Math.abs(calcDiff(formData.coolingTempInDesign, formData.coolingTempOutDesign)).toFixed(1)}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#15803d'}}>{calcRT(formData.coolingFlowDesign, formData.coolingTempInDesign, formData.coolingTempOutDesign)}</td>
                    </tr>
                    <tr><td style={{ fontWeight: 'bold' }}>측정</td>
                      <td><input type="number" name="coolingFlowMeasure" className="input-field" value={formData.coolingFlowMeasure} onChange={handleChange} /></td>
                      <td><input type="number" name="coolingTempInMeasure" className="input-field" value={formData.coolingTempInMeasure} onChange={handleChange} /></td>
                      <td><input type="number" name="coolingTempOutMeasure" className="input-field" value={formData.coolingTempOutMeasure} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{Math.abs(calcDiff(formData.coolingTempInMeasure, formData.coolingTempOutMeasure)).toFixed(1)}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#15803d'}}>{calcRT(formData.coolingFlowMeasure, formData.coolingTempInMeasure, formData.coolingTempOutMeasure)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 펌프 현황 */}
            <div style={{ marginBottom: '24px', border: '1px solid #10b981', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ marginBottom: '12px', color: '#047857' }}>🔄 [펌프운전 현황] (냉수/냉각수)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '800px', whiteSpace: 'nowrap' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}><th>구분</th><th>인버터(Hz)</th><th>전류(A)</th><th>유량</th><th>양정</th><th>입구압력</th><th>출구압력</th><th>ΔP(출-입)</th></tr></thead>
                  <tbody>
                    <tr><td colSpan={8} style={{background:'#f0fdf4', fontWeight:'bold', padding:'4px'}}>🔵 냉수펌프</td></tr>
                    <tr style={{ borderBottom: '1px dashed #e2e8f0' }}><td>정격</td>
                      <td><input type="number" name="pumpChilledInvD" className="input-field" value={formData.pumpChilledInvD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledCurD" className="input-field" value={formData.pumpChilledCurD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledFlowD" className="input-field" value={formData.pumpChilledFlowD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledHeadD" className="input-field" value={formData.pumpChilledHeadD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledInPressD" className="input-field" value={formData.pumpChilledInPressD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledOutPressD" className="input-field" value={formData.pumpChilledOutPressD} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{calcDiff(formData.pumpChilledOutPressD, formData.pumpChilledInPressD)}</td>
                    </tr>
                    <tr><td>측정</td>
                      <td><input type="number" name="pumpChilledInvM" className="input-field" value={formData.pumpChilledInvM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledCurM" className="input-field" value={formData.pumpChilledCurM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledFlowM" className="input-field" value={formData.pumpChilledFlowM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledHeadM" className="input-field" value={formData.pumpChilledHeadM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledInPressM" className="input-field" value={formData.pumpChilledInPressM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpChilledOutPressM" className="input-field" value={formData.pumpChilledOutPressM} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{calcDiff(formData.pumpChilledOutPressM, formData.pumpChilledInPressM)}</td>
                    </tr>
                    <tr><td colSpan={8} style={{background:'#f0fdf4', fontWeight:'bold', padding:'4px'}}>🟢 냉각수펌프</td></tr>
                    <tr style={{ borderBottom: '1px dashed #e2e8f0' }}><td>정격</td>
                      <td><input type="number" name="pumpCoolingInvD" className="input-field" value={formData.pumpCoolingInvD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingCurD" className="input-field" value={formData.pumpCoolingCurD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingFlowD" className="input-field" value={formData.pumpCoolingFlowD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingHeadD" className="input-field" value={formData.pumpCoolingHeadD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingInPressD" className="input-field" value={formData.pumpCoolingInPressD} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingOutPressD" className="input-field" value={formData.pumpCoolingOutPressD} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{calcDiff(formData.pumpCoolingOutPressD, formData.pumpCoolingInPressD)}</td>
                    </tr>
                    <tr><td>측정</td>
                      <td><input type="number" name="pumpCoolingInvM" className="input-field" value={formData.pumpCoolingInvM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingCurM" className="input-field" value={formData.pumpCoolingCurM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingFlowM" className="input-field" value={formData.pumpCoolingFlowM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingHeadM" className="input-field" value={formData.pumpCoolingHeadM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingInPressM" className="input-field" value={formData.pumpCoolingInPressM} onChange={handleChange} /></td>
                      <td><input type="number" name="pumpCoolingOutPressM" className="input-field" value={formData.pumpCoolingOutPressM} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{calcDiff(formData.pumpCoolingOutPressM, formData.pumpCoolingInPressM)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 냉각탑 현황 */}
            <div style={{ marginBottom: '24px', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ marginBottom: '12px', color: '#6d28d9' }}>💨 [냉각탑운전 현황] (공기선도 자동계산)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '1000px', whiteSpace: 'nowrap' }}>
                  <thead><tr style={{ background: '#f5f3ff' }}><th>구분</th><th>인버터</th><th>전류</th><th>풍량(m3/h)</th><th>정압</th><th>입구T</th><th>입구RH%</th><th>입구WB</th><th>입구H(kcal)</th><th>출구T</th><th>출구RH%</th><th>출구WB</th><th>출구H(kcal)</th><th>CRT</th></tr></thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed #e2e8f0' }}><td>정격</td>
                      <td><input type="number" name="towerInvD" className="input-field" value={formData.towerInvD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerCurD" className="input-field" value={formData.towerCurD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerFlowD" className="input-field" value={formData.towerFlowD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerPressD" className="input-field" value={formData.towerPressD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerInTempD" className="input-field" value={formData.towerInTempD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerInHumidD" className="input-field" value={formData.towerInHumidD} onChange={handleChange} /></td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcWetBulb(formData.towerInTempD, formData.towerInHumidD)}</td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcEnthalpy(formData.towerInTempD, formData.towerInHumidD)}</td>
                      <td><input type="number" name="towerOutTempD" className="input-field" value={formData.towerOutTempD} onChange={handleChange} /></td>
                      <td><input type="number" name="towerOutHumidD" className="input-field" value={formData.towerOutHumidD} onChange={handleChange} /></td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcWetBulb(formData.towerOutTempD, formData.towerOutHumidD)}</td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcEnthalpy(formData.towerOutTempD, formData.towerOutHumidD)}</td>
                      <td style={{background:'#f3e8ff', color:'#6d28d9', fontWeight:'bold'}}>{calcCRT(formData.towerFlowD, calcEnthalpy(formData.towerInTempD, formData.towerInHumidD), calcEnthalpy(formData.towerOutTempD, formData.towerOutHumidD))}</td>
                    </tr>
                    <tr><td>측정</td>
                      <td><input type="number" name="towerInvM" className="input-field" value={formData.towerInvM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerCurM" className="input-field" value={formData.towerCurM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerFlowM" className="input-field" value={formData.towerFlowM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerPressM" className="input-field" value={formData.towerPressM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerInTempM" className="input-field" value={formData.towerInTempM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerInHumidM" className="input-field" value={formData.towerInHumidM} onChange={handleChange} /></td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcWetBulb(formData.towerInTempM, formData.towerInHumidM)}</td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcEnthalpy(formData.towerInTempM, formData.towerInHumidM)}</td>
                      <td><input type="number" name="towerOutTempM" className="input-field" value={formData.towerOutTempM} onChange={handleChange} /></td>
                      <td><input type="number" name="towerOutHumidM" className="input-field" value={formData.towerOutHumidM} onChange={handleChange} /></td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcWetBulb(formData.towerOutTempM, formData.towerOutHumidM)}</td>
                      <td style={{background:'#faf5ff', fontWeight:'bold'}}>{calcEnthalpy(formData.towerOutTempM, formData.towerOutHumidM)}</td>
                      <td style={{background:'#f3e8ff', color:'#6d28d9', fontWeight:'bold', fontSize:'1.1rem'}}>{calcCRT(formData.towerFlowM, calcEnthalpy(formData.towerInTempM, formData.towerInHumidM), calcEnthalpy(formData.towerOutTempM, formData.towerOutHumidM))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}><button type="button" className="btn" style={{ background: '#64748b' }} onClick={() => setStep(2)}>⬅ 이전</button><button type="button" className="btn" onClick={() => setStep(4)}>다음 단계로 ➔</button></div>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>4. 종합 효율 분석 (부하율 및 COP)</h3>
            
            <div style={{ marginBottom: '24px', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', background: '#fffbeb' }}>
              <h4 style={{ marginBottom: '12px', color: '#b45309' }}>⚡ [냉동기판넬 운전전력]</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '500px' }}>
                  <thead><tr style={{ background: '#fde68a' }}><th>구분</th><th>전압(V)</th><th>전류(A)</th><th>KVA(자동)</th><th>역율(%)</th><th>운전전력(KW)</th><th>환산(RT)</th></tr></thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed #fbbf24' }}><td>정격</td>
                      <td><input type="number" name="panelVoltD" className="input-field" value={formData.panelVoltD} onChange={handleChange} /></td>
                      <td><input type="number" name="panelCurD" className="input-field" value={formData.panelCurD} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{panelKvaD !== 'NaN' ? panelKvaD : '-'}</td>
                      <td><input type="number" step="0.01" name="panelPfD" className="input-field" value={formData.panelPfD} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#b45309'}}>{panelKwD !== 'NaN' ? panelKwD : '-'}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#b45309'}}>{panelRtD !== 'NaN' ? panelRtD : '-'}</td>
                    </tr>
                    <tr><td>측정</td>
                      <td><input type="number" name="panelVoltM" className="input-field" value={formData.panelVoltM} onChange={handleChange} /></td>
                      <td><input type="number" name="panelCurM" className="input-field" value={formData.panelCurM} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold'}}>{panelKvaM !== 'NaN' ? panelKvaM : '-'}</td>
                      <td><input type="number" step="0.01" name="panelPfM" className="input-field" value={formData.panelPfM} onChange={handleChange} /></td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#b45309'}}>{panelKwM !== 'NaN' ? panelKwM : '-'}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color:'#b45309', fontSize:'1.1rem'}}>{panelRtM !== 'NaN' ? panelRtM : '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: '32px', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px', background: '#eff6ff' }}>
              <h4 style={{ marginBottom: '16px', color: '#1d4ed8', fontSize: '1.2rem', textAlign: 'center' }}>📈 [효율 지표 (부하율 및 COP)]</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>부하율 (%)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{loadFactor !== 'NaN' ? loadFactor : '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>(측정 냉수RT / 정격 용량)</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>COP (정격)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{copD !== 'NaN' ? copD : '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>(정격 용량 / 정격 환산RT)</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>COP (측정)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{copM !== 'NaN' ? copM : '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>(측정 냉수RT / 측정 환산RT)</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}><button type="button" className="btn" style={{ background: '#64748b', flex: '1' }} onClick={() => setStep(3)}>⬅ 이전</button><button type="submit" className="btn" style={{ flex: '2', background: '#10b981' }}>✅ 최종 분석 완료 및 저장</button></div>
          </div>
        )}
      </form>

      {/* 보관함 리스트 (기존 코드 동일) */}
      {drafts.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '2px dashed #cbd5e1', paddingTop: '16px' }}>
          <h4 style={{ marginBottom: '12px', color: '#475569' }}>💾 임시 저장 보관함 ({drafts.length}건)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drafts.map(draft => (
              <div key={draft.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{draft.title || `${draft.siteText || '사옥 미지정'}-${draft.eqText}`} <span onClick={() => handleRenameDraft(draft.id)} style={{cursor:'pointer', fontSize:'0.8rem'}}>✏️</span></div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>저장일시: {draft.date} / 진행: {draft.step}단계</div></div>
                <div style={{ display: 'flex', gap: '6px' }}><button type="button" onClick={() => handleLoadDraft(draft)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>불러오기</button><button type="button" onClick={() => handleDeleteDraft(draft.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '2px solid #10b981', paddingTop: '16px' }}>
          <h4 style={{ marginBottom: '12px', color: '#047857' }}>✅ 최종 완료된 점검 파일 ({completed.length}건)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completed.map(comp => (
              <div key={comp.id} style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>{comp.title || `${comp.siteText}-${comp.eqText}`} <span onClick={() => handleRenameComp(comp.id)} style={{cursor:'pointer', fontSize:'0.8rem'}}>✏️</span></div><div style={{ fontSize: '0.75rem', color: '#047857' }}>완료일시: {comp.date}</div></div>
                <div style={{ display: 'flex', gap: '6px' }}><button type="button" onClick={() => { if(confirm('다시 열어보시겠습니까? 현재 내용은 덮어씌워집니다.')) { setSiteText(comp.siteText); setEqText(comp.eqText); setFormData(comp.formData); setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>다시 열기</button><button type="button" onClick={() => handleDeleteComp(comp.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoolingInspectionPage() {
  return <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}><CoolingInspectionContent /></Suspense>;
}
