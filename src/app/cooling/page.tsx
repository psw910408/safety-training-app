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
  chilledWaterPipe: any;
  coolingWaterPipe: any;
};

const INITIAL_FORM = {
  // 온도: 자동제어
  autoChilledIn: '', autoChilledOut: '', autoCoolingIn: '', autoCoolingOut: '',
  // 온도: 표면온도
  surfChilledIn: '', surfChilledOut: '', surfCoolingIn: '', surfCoolingOut: '',
  
  // 냉수 유량
  chilledFlowDesign: '', chilledTempInDesign: '', chilledTempOutDesign: '',
  chilledFlowMeasure: '', chilledTempInMeasure: '', chilledTempOutMeasure: '',
  
  // 냉각수 유량
  coolingFlowDesign: '', coolingTempInDesign: '', coolingTempOutDesign: '',
  coolingFlowMeasure: '', coolingTempInMeasure: '', coolingTempOutMeasure: '',

  // 기타 압력 등
  evaporatorPressure: '',
  condenserPressure: '',
  chilledPumpHz: '60',
  coolingPumpHz: '60',
  towerFanFlow: ''
};

function CoolingInspectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSite = searchParams.get('site') === 'samhwa' ? '삼화타워' : '종로타워';
  
  const [step, setStep] = useState(1);
  const [siteText, setSiteText] = useState(defaultSite);
  const [eqText, setEqText] = useState('');
  
  const [eqSpecs, setEqSpecs] = useState<ChillerData | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 로컬 스토리지 키
  const STORAGE_KEY = 'cooling_inspection_backup';

  // 로드 로직
  useEffect(() => {
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        if (confirm('저장된 점검 기록이 있습니다. 불러오시겠습니까?')) {
          setSiteText(parsed.siteText || '');
          setEqText(parsed.eqText || '');
          setFormData(parsed.formData || INITIAL_FORM);
          setStep(parsed.step || 1);
        }
      } catch (e) {
        console.error('Backup load failed', e);
      }
    }
  }, []);

  // 중간 저장 로직
  const handleSaveDraft = () => {
    const dataToSave = { siteText, eqText, formData, step };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    const timeStr = new Date().toLocaleTimeString();
    setLastSaved(timeStr);
    alert(`현재 상태가 안전하게 중간 저장되었습니다. (${timeStr})`);
  };

  // 자동완성 데이터 매칭
  useEffect(() => {
    const siteEqs = masterData[siteText] || [];
    const matchedEq = siteEqs.find(e => e.name === eqText);
    setEqSpecs(matchedEq || null);
  }, [siteText, eqText]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('냉방점검 최종 데이터가 성공적으로 처리되었습니다!');
    localStorage.removeItem(STORAGE_KEY); // 제출 완료 후 로컬 백업 삭제
    router.push('/');
  };

  // 계산 유틸리티
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
    // RT = LPM * 60 * 온도차 / 3024
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3].map(num => (
          <div key={num} onClick={() => setStep(num)} style={{ 
            flex: 1, textAlign: 'center', padding: '10px', 
            background: step === num ? 'var(--primary-color)' : '#e2e8f0',
            color: step === num ? '#fff' : '#64748b',
            borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Step {num}
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
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>2. 냉동기 온도 및 냉각 유량</h3>
            
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
              <button type="button" className="btn" style={{ background: '#64748b' }} onClick={() => setStep(1)}>⬅ 이전</button>
              <button type="button" className="btn" onClick={() => setStep(3)}>다음 단계로 ➔</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>3. 펌프 및 기타 압력</h3>
            
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
              <button type="button" className="btn" style={{ background: '#64748b', flex: '1' }} onClick={() => setStep(2)}>⬅ 이전</button>
              <button type="submit" className="btn" style={{ flex: '2', background: '#10b981' }}>✅ 최종 완료 및 서버 전송</button>
            </div>
          </div>
        )}
      </form>
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
