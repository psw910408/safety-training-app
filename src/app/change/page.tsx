import { Suspense } from 'react';
import TrainingForm from '@/components/TrainingForm';

export default function ChangePage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>}>
      <TrainingForm 
        type="change" 
        title="🔄 작업내용 변경 시 교육" 
        desc="작업내용 변경에 따른 근로자/관리감독자 교육 양식"
      />
    </Suspense>
  );
}
