'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval } from 'date-fns';

interface CalendarEvent {
  date: Date;
  dateStr: string;
  title: string;
  workerName: string;
  department: string;
  type: 'recruit' | 'special' | 'msds' | 'health';
}

function AdminCalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [site, setSite] = useState<'jongno' | 'samhwa'>(
    (searchParams.get('site') as 'jongno' | 'samhwa') || 'jongno'
  );
  const [workers, setWorkers] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_auth') === 'psw910408_verified') {
        setIsAdmin(true);
      }
    }
  }, []);

  // Filters state
  const [filters, setFilters] = useState({
    recruit: true,
    special: true,
    msds: true,
    health: true,
  });

  const [selectedGroup, setSelectedGroup] = useState<CalendarEvent[] | null>(null);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workers?site=${site}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWorkers(data.data);
        generateEvents(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, [site]);

  const parseDateString = (dateStr: string) => {
    if (!dateStr) return null;
    const clean = dateStr.trim();
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(clean)) {
      const parts = clean.split('.');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const parts = clean.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return null;
  };

  const addEvent = (arr: CalendarEvent[], rawDateStr: string | null, workerName: string, department: string, title: string, type: 'recruit' | 'special' | 'msds' | 'health') => {
    const d = parseDateString(rawDateStr || '');
    if (d) {
      arr.push({ date: d, dateStr: format(d, 'yyyy.MM.dd'), title, workerName, department, type });
    }
  };

  const generateEvents = (workerData: any[]) => {
    const newEvents: CalendarEvent[] = [];
    workerData.forEach(w => {
      addEvent(newEvents, w.trainingHire, w.name, w.department, '채용시 교육', 'recruit');
      addEvent(newEvents, w.trainingPressure, w.name, w.department, '특별(압력)', 'special');
      addEvent(newEvents, w.trainingBoiler, w.name, w.department, '특별(보일러)', 'special');
      addEvent(newEvents, w.trainingFire, w.name, w.department, '특별(화기)', 'special');
      addEvent(newEvents, w.trainingElectric, w.name, w.department, '특별(전기)', 'special');
      addEvent(newEvents, w.trainingConfined, w.name, w.department, '특별(밀폐)', 'special');
      addEvent(newEvents, w.trainingMSDS, w.name, w.department, 'MSDS(최초)', 'msds');
      
      // 콤마로 분리된 다중 날짜(정기교육) 처리 로직
      if (w.nextTrainingMSDS && w.nextTrainingMSDS !== '대상자 아님') {
        w.nextTrainingMSDS.split(',').forEach((dt: string) => addEvent(newEvents, dt, w.name, w.department, 'MSDS(정기)', 'msds'));
      }
      
      addEvent(newEvents, w.healthCheckPre, w.name, w.department, '특건(배치전)', 'health');
      addEvent(newEvents, w.healthCheckPost, w.name, w.department, '특건(배치후)', 'health');
      
      if (w.healthCheckRegular && w.healthCheckRegular !== '대상자 아님') {
        w.healthCheckRegular.split(',').forEach((dt: string) => addEvent(newEvents, dt, w.name, w.department, '특건(정기)', 'health'));
      }
    });
    setEvents(newEvents);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'recruit': return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: '🔰' };
      case 'special': return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', icon: '🔥' };
      case 'msds': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', icon: '🧪' };
      case 'health': return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', icon: '🏥' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', icon: '📌' };
    }
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>📅 현장 전체 캘린더</h2>
        <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => router.push(isAdmin ? '/admin' : '/')}>
          {isAdmin ? '🔙 데이터 명부로 이동' : '🔙 바탕화면 메인으로'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <label style={{ 
            padding: '10px 24px', border: `2px solid ${site === 'jongno' ? 'var(--primary-color)' : '#ddd'}`, 
            borderRadius: '12px', cursor: 'pointer', background: site === 'jongno' ? '#f0f7ff' : '#fff',
            fontWeight: site === 'jongno' ? 'bold' : 'normal', transition: 'all 0.2s'
          }}>
            <input type="radio" value="jongno" checked={site === 'jongno'} onChange={() => setSite('jongno')} style={{ display: 'none' }} />
            🏢 종로타워
          </label>
          <label style={{ 
            padding: '10px 24px', border: `2px solid ${site === 'samhwa' ? 'var(--primary-color)' : '#ddd'}`, 
            borderRadius: '12px', cursor: 'pointer', background: site === 'samhwa' ? '#f0f7ff' : '#fff',
            fontWeight: site === 'samhwa' ? 'bold' : 'normal', transition: 'all 0.2s'
          }}>
            <input type="radio" value="samhwa" checked={site === 'samhwa'} onChange={() => setSite('samhwa')} style={{ display: 'none' }} />
            🏢 삼화타워
          </label>
      </div>

      {/* 필터 바 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '10px', color: '#475569' }}>
          필터 보기:
        </div>
        {[
          { key: 'recruit', label: '채용시 교육', icon: '🔰', color: '#0369a1' },
          { key: 'special', label: '특별 교육', icon: '🔥', color: '#b91c1c' },
          { key: 'msds', label: 'MSDS', icon: '🧪', color: '#b45309' },
          { key: 'health', label: '특수건강검진', icon: '🏥', color: '#15803d' },
        ].map(f => (
          <label key={f.key} style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', 
            padding: '8px 16px', borderRadius: '30px', 
            background: filters[f.key as keyof typeof filters] ? `${f.color}15` : '#f1f5f9',
            border: `1px solid ${filters[f.key as keyof typeof filters] ? f.color : 'transparent'}`,
            color: filters[f.key as keyof typeof filters] ? f.color : '#94a3b8',
            transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.9rem'
          }}>
            <input type="checkbox" checked={filters[f.key as keyof typeof filters]} onChange={() => toggleFilter(f.key as keyof typeof filters)} style={{ display: 'none' }} />
            {f.icon} {f.label}
          </label>
        ))}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* 달력 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
          <button style={{ padding: '8px 20px', fontSize: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            ◀ 이전
          </button>
          
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            {format(currentDate, 'yyyy년 MM월')}
          </h3>
          
          <button style={{ padding: '8px 20px', fontSize: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            다음 ▶
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: 'var(--text-light)' }}>일정 병합 중입니다...</div>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ padding: '12px 0', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem', color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#64748b' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {days.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const dayFilteredEvents = events.filter(e => isSameDay(e.date, day) && filters[e.type]);
                const isToday = isSameDay(day, new Date());
                
                // 이벤트 그룹핑 알고리즘: 종류와 제목이 같으면 묶기!
                const groupedMap: { [key: string]: typeof dayFilteredEvents } = {};
                dayFilteredEvents.forEach(e => {
                  const key = `${e.type}::${e.title}`;
                  if (!groupedMap[key]) groupedMap[key] = [];
                  groupedMap[key].push(e);
                });

                return (
                  <div key={day.toString()} style={{
                    minHeight: '140px', padding: '10px',
                    borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f1f5f9',
                    borderBottom: i >= days.length - 7 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: isCurrentMonth ? '#fff' : '#fafafa',
                  }}>
                    <div style={{ 
                      display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '28px', height: '28px',
                      fontWeight: '800', marginBottom: '10px', borderRadius: '50%', fontSize: '0.9rem',
                      color: isToday ? '#fff' : (day.getDay() === 0 ? '#ef4444' : day.getDay() === 6 ? '#3b82f6' : '#475569'),
                      backgroundColor: isToday ? '#0ea5e9' : 'transparent',
                      opacity: isCurrentMonth ? 1 : 0.3
                    }}>
                      {format(day, 'd')}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.values(groupedMap).map((group, idx) => {
                        const first = group[0];
                        const style = getTypeColor(first.type);
                        const label = group.length > 1 
                                    ? `${first.title} (${first.workerName.substring(0, 1)}*${first.workerName.substring(2) || ''} 외 ${group.length - 1}명)`
                                    : `${first.title} (${first.workerName})`;

                        return (
                          <div key={idx} onClick={() => setSelectedGroup(group)} style={{
                            backgroundColor: style.bg, border: `1px solid ${style.border}`, color: style.text,
                            padding: '6px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                            cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            transition: 'transform 0.1s', display: 'flex', alignItems: 'center', gap: '4px'
                          }} 
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <span>{style.icon}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 모달 창 */}
      {selectedGroup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }} onClick={() => setSelectedGroup(null)}>
          <div style={{ 
            background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ background: getTypeColor(selectedGroup[0].type).bg, padding: '24px', borderBottom: `1px solid ${getTypeColor(selectedGroup[0].type).border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: getTypeColor(selectedGroup[0].type).text, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getTypeColor(selectedGroup[0].type).icon} {selectedGroup[0].title}
                </h3>
                <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: getTypeColor(selectedGroup[0].type).text }}>×</button>
              </div>
              <p style={{ margin: '8px 0 0 0', color: getTypeColor(selectedGroup[0].type).text, opacity: 0.8, fontSize: '0.9rem' }}>
                {format(selectedGroup[0].date, 'yyyy년 MM월 dd일')}
              </p>
            </div>
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '12px', fontSize: '0.85rem' }}>대상 인원 총 {selectedGroup.length}명</div>
              {selectedGroup.map((evt, idx) => (
                <div key={idx} style={{ 
                  padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{evt.workerName}</span>
                  <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>{evt.department}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminCalendarPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>캘린더 로딩 중...</div>}>
      <AdminCalendarContent />
    </Suspense>
  );
}
