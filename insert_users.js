const workers = [
  { name: '박영원', department: '시설/관리', phone: '01033866350', hireDate: '2025-07-07', isNightWorker: false },
  { name: '이대희', department: '시설/관리', phone: '01053271908', hireDate: '2025-08-04', isNightWorker: false },
  { name: '이희장', department: '보안', phone: '01031877011', hireDate: '2026-03-03', isNightWorker: false },
  { name: '박춘수', department: '미화', phone: '01095115136', hireDate: '2025-08-01', isNightWorker: false },
  { name: '허영규', department: '시설/관리', phone: '01020796119', hireDate: '2024-08-22', isNightWorker: false },
  { name: '윤여현', department: '시설/관리', phone: '01072700300', hireDate: '2026-03-09', isNightWorker: false },
  { name: '허영도', department: '시설/관리', phone: '01049404472', hireDate: '2025-08-18', isNightWorker: false },
  { name: '김동원', department: '시설/관리', phone: '01042373742', hireDate: '2025-06-23', isNightWorker: false },
  { name: '박민수', department: '보안', phone: '01033119488', hireDate: '2024-03-15', isNightWorker: false },
  { name: '고건', department: '보안', phone: '01087056020', hireDate: '2024-11-11', isNightWorker: false },
  { name: '박종현', department: '시설/관리', phone: '01077091572', hireDate: '2024-09-02', isNightWorker: true },
  { name: '성민준', department: '시설/관리', phone: '01038747062', hireDate: '2026-03-19', isNightWorker: true },
  { name: '윤정운', department: '시설/관리', phone: '01073102466', hireDate: '2026-03-09', isNightWorker: true },
  { name: '서정현', department: '시설/관리', phone: '010-2854-7311', hireDate: '2025-02-24', isNightWorker: true },
  { name: '김상진', department: '시설/관리', phone: '010-4775-5673', hireDate: '2025-02-28', isNightWorker: true },
  { name: '한기현', department: '시설/관리', phone: '010-4544-6956', hireDate: '2025-06-02', isNightWorker: true },
  { name: '박시현', department: '시설/관리', phone: '010-4702-5475', hireDate: '2025-06-12', isNightWorker: true },
  { name: '곽동훈', department: '시설/관리', phone: '010-3297-0746', hireDate: '2025-07-14', isNightWorker: true }
];

async function insertAll() {
  for (let w of workers) {
    try {
      const res = await fetch('http://localhost:3000/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(w)
      });
      const data = await res.json();
      console.log(`Inserted ${w.name}:`, data);
    } catch(e) {
      console.error(`Failed ${w.name}:`, e);
    }
  }
}

insertAll();
