import { Suspense } from 'react';
import TrainingForm from '@/components/TrainingForm';

export default function SpecialPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}>
      <TrainingForm 
        type="special" 
        title="⚠️ 특별 교육 (현장)" 
        desc="현장 특별 작업(전기, 밀폐공간 등) 진행 시 특화 교육 양식"
      />
    </Suspense>
  );
}
