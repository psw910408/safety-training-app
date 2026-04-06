import { Suspense } from 'react';
import TrainingForm from '@/components/TrainingForm';

export default function MSDSPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}>
      <TrainingForm 
        type="msds" 
        title="🧪 물질안전보건자료(MSDS) 교육" 
        desc="부서(시설/미화)별 취급물질 맞춤형 MSDS 교육 진행"
      />
    </Suspense>
  );
}
