import { format, addDays, getDay, getYear, addMonths, addYears } from 'date-fns';

const holidays2025_2026 = [
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01', '2025-05-01',
  '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15', '2025-10-03',
  '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09',
  '2025-12-25',
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-05-01',
  '2026-05-05', '2026-05-24', '2026-05-25', '2026-06-06', '2026-08-15',
  '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-09',
  '2026-12-25',
];

export function isHolidayOrWeekend(dateString: string) {
  const d = new Date(dateString);
  const day = getDay(d); // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return true;
  if (holidays2025_2026.includes(dateString)) return true;
  return false;
}

export function getFirstWorkingDayOnOrAfter(dateStr: string) {
  let d = new Date(dateStr);
  while (isHolidayOrWeekend(format(d, 'yyyy-MM-dd'))) {
    d = addDays(d, 1);
  }
  return format(d, 'yyyy-MM-dd');
}

export function addWorkingDays(startDateStr: string, workingDays: number) {
  let currentDate = new Date(startDateStr);
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    currentDate = addDays(currentDate, 1);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (!isHolidayOrWeekend(dateStr)) {
      daysAdded++;
    }
  }
  return format(currentDate, 'yyyy-MM-dd');
}

export function calculateTrainings(hireDateStr: string, isNightWorker: boolean, department: string) {
  const isFacility = department === '시설/관리';
  const isCleaning = department === '미화';
  
  // 만약 입사일이 공휴일/주말이면 첫 번째 평일로 교육 개시일을 잡음
  const startOfTraining = getFirstWorkingDayOnOrAfter(hireDateStr);
  const tHire = startOfTraining;
  
  // 특별교육은 '시설/관리'만
  const tPressure = isFacility ? addWorkingDays(startOfTraining, 1) : '대상자 아님';
  const tBoiler = isFacility ? addWorkingDays(startOfTraining, 2) : '대상자 아님';
  const tFire = isFacility ? addWorkingDays(startOfTraining, 3) : '대상자 아님';
  const tElectric = isFacility ? addWorkingDays(startOfTraining, 4) : '대상자 아님';
  const tConfined = isFacility ? addWorkingDays(startOfTraining, 5) : '대상자 아님';

  // MSDS는 '시설/관리'와 '미화'만
  let tMSDS = '대상자 아님';
  let nextMSDSString = '대상자 아님';

  if (isFacility || isCleaning) {
    tMSDS = addWorkingDays(startOfTraining, 6);
    let msdsDate = new Date(tMSDS);
    let nextMSDSArray = [];
    for (let year = getYear(msdsDate) + 1; year <= 2030; year++) {
      let nextDate = addYears(msdsDate, year - getYear(msdsDate));
      nextMSDSArray.push(format(nextDate, 'yyyy-MM-dd'));
    }
    nextMSDSString = nextMSDSArray.join(', ');
  }

  // 특수건강검진
  let healthPre = '대상자 아님';
  let healthPost = '대상자 아님';
  let healthRegularString = '대상자 아님';

  if (isNightWorker) {
    const hireDate = new Date(hireDateStr);
    healthPre = hireDateStr; // 배치전
    const postDate = addMonths(hireDate, 6);
    healthPost = format(postDate, 'yyyy-MM-dd'); // 배치후 (6개월 뒤)

    let healthRegularArray = [];
    for (let year = getYear(postDate) + 1; year <= 2030; year++) {
      let regDate = addYears(postDate, year - getYear(postDate));
      healthRegularArray.push(format(regDate, 'yyyy-MM-dd'));
    }
    healthRegularString = healthRegularArray.join(', ');
  }

  return {
    trainingHire: tHire,
    trainingPressure: tPressure,
    trainingBoiler: tBoiler,
    trainingFire: tFire,
    trainingElectric: tElectric,
    trainingConfined: tConfined,
    trainingMSDS: tMSDS,
    nextTrainingMSDS: nextMSDSString,
    healthCheckPre: healthPre,
    healthCheckPost: healthPost,
    healthCheckRegular: healthRegularString
  };
}
