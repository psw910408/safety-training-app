'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import masterData from '@/data/chillerMasterData.json';

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

export default function CoolingInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSite = searchParams.get('site') === 'samhwa' ? '삼화타워' : '종로타워';
  
  const [step, setStep] = useState(1);
  const [site, setSite] = useState(defaultSite);
  
  // Available equipment for selected site
  const [equipments, setEquipments] = useState<ChillerData[]>([]);
  const [selectedEqName, setSelectedEqName] = useState('');
  const [eqSpecs, setEqSpecs] = useState<ChillerData | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    // Step 2
    chillerCurrentControl: '100',
    chilledWaterTempIn: '',
    chilledWaterTempOut: '',
    coolingWaterTempIn: '',
    coolingWaterTempOut: '',
    evaporatorPressure: '',
    condenserPressure: '',
    // Step 3
    chilledPumpHz: '60',
    coolingPumpHz: '60',
    towerFanFlow: ''
  });

  useEffect(() => {
    // @ts-ignore
    const siteEqs = masterData[site] || [];
    setEquipments(siteEqs);
    if (siteEqs.length > 0) {
      setSelectedEqName(siteEqs[0].name);
      setEqSpecs(siteEqs[0]);
    } else {
      setSelectedEqName('');
      setEqSpecs(null);
    }
  }, [site]);

  useEffect(() => {
    const eq = equipments.find(e => e.name === selectedEqName);
    setEqSpecs(eq || null);
  }, [selectedEqName, equipments]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('냉방점검 데이터가 임시 저장되었습니다! (추후 Vercel KV 데이터베이스 연동 예정)');
    router.push('/');
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div className="header" style={{ marginBottom: '20px' }}>
        <h2>❄️ 냉방장비 성능점검</h2>
        <p>현장 모바일 점검 체크리스트</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3].map(num => (
          <div key={num} style={{ 
            flex: 1, 
            textAlign: 'center', 
            padding: '10px', 
            background: step === num ? 'var(--primary-color)' : '#e2e8f0',
            color: step === num ? '#fff' : '#64748b',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}>
            Step {num}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>기본 정보 및 스펙 확인</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>사옥 선택</label>
              <select className="input-field" value={site} onChange={(e) => setSite(e.target.value)}>
                {Object.keys(masterData).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>점검 기기 선택</label>
              <select className="input-field" value={selectedEqName} onChange={(e) => setSelectedEqName(e.target.value)}>
                {equipments.length === 0 && <option value="">등록된 기기 없음</option>}
                {equipments.map(eq => (
                  <option key={eq.name} value={eq.name}>{eq.name}</option>
                ))}
              </select>
            </div>

            {eqSpecs && (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ marginBottom: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> 장비 마스터 스펙 (자동 연동)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                  <div><strong>형식:</strong> {eqSpecs.type}</div>
                  <div><strong>제조사:</strong> {eqSpecs.manufacturer}</div>
                  <div><strong>용량:</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{eqSpecs.rt} RT</span></div>
                  <div><strong>냉매:</strong> {eqSpecs.refrigerant}</div>
                  <div style={{ gridColumn: '1 / span 2', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    <strong>🔵 냉수배관:</strong> {eqSpecs.chilledWaterPipe.size}mm / {eqSpecs.chilledWaterPipe.material}
                  </div>
                  <div style={{ gridColumn: '1 / span 2', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    <strong>🟢 냉각수배관:</strong> {eqSpecs.coolingWaterPipe.size}mm / {eqSpecs.coolingWaterPipe.material}
                  </div>
                </div>
              </div>
            )}
            
            <button type="button" className="btn" style={{ marginTop: '24px' }} onClick={() => setStep(2)}>다음 단계로 ➔</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>냉동기 운전 및 온도 측정</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold', color: '#0369a1' }}>🔵 냉수 입구온도 (℃)</label>
                <input type="number" step="0.1" name="chilledWaterTempIn" className="input-field" value={formData.chilledWaterTempIn} onChange={handleChange} placeholder="ex) 10.5" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold', color: '#0369a1' }}>🔵 냉수 출구온도 (℃)</label>
                <input type="number" step="0.1" name="chilledWaterTempOut" className="input-field" value={formData.chilledWaterTempOut} onChange={handleChange} placeholder="ex) 7.2" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold', color: '#15803d' }}>🟢 냉각수 입구 (℃)</label>
                <input type="number" step="0.1" name="coolingWaterTempIn" className="input-field" value={formData.coolingWaterTempIn} onChange={handleChange} placeholder="ex) 29.7" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold', color: '#15803d' }}>🟢 냉각수 출구 (℃)</label>
                <input type="number" step="0.1" name="coolingWaterTempOut" className="input-field" value={formData.coolingWaterTempOut} onChange={handleChange} placeholder="ex) 32.5" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>증발기 압력</label>
                <input type="text" name="evaporatorPressure" className="input-field" value={formData.evaporatorPressure} onChange={handleChange} placeholder="430mmHg" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>응축기 압력</label>
                <input type="text" name="condenserPressure" className="input-field" value={formData.condenserPressure} onChange={handleChange} placeholder="0.42 ㎏/㎠" />
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
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>펌프 및 냉각탑 운전현황</h3>
            
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>냉각탑 풍량 (㎥/h)</label>
              <input type="number" name="towerFanFlow" className="input-field" value={formData.towerFanFlow} onChange={handleChange} placeholder="ex) 134000" />
            </div>

            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', color: '#92400e', border: '1px solid #fde68a' }}>
              <strong>ℹ️ 스마트 분석 예정:</strong> 입력된 온도와 유량, 배관 사이즈를 바탕으로 부하율(%)과 COP(효율) 성능 지표가 데이터베이스에 자동 기록됩니다.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn" style={{ background: '#64748b', flex: '1' }} onClick={() => setStep(2)}>⬅ 이전</button>
              <button type="submit" className="btn" style={{ flex: '2', background: '#10b981' }}>✅ 점검 완료 및 임시 저장</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
