const XLSX = require('xlsx');
const fs = require('fs');

const path = 'D:\\1. CHM본사\\12. 인공지능\\00. 사옥별 냉동기 배관 사이즈.xlsx';
const wb = XLSX.readFile(path);

const cleanVal = (v) => {
  if (v === undefined || v === null) return '';
  let str = String(v).trim();
  // remove trailing (S2/W) etc
  str = str.replace(/\(.*?\)/g, '').trim();
  return str;
};

const pipeData = {
  carbon: {},
  copper: {},
  stainless: {},
  su: {}
};

// Copper
const copperSheet = wb.Sheets['Copper'];
if (copperSheet) {
  const data = XLSX.utils.sheet_to_json(copperSheet, { header: 1 });
  for (let i = 8; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    const size = String(row[0]).replace(/[^0-9]/g, '');
    pipeData.copper[size] = {
      od: cleanVal(row[1]),
      thick: cleanVal(row[2]),
      sep: cleanVal(row[4])
    };
  }
}

// Carbon Steel
const carbonSheet = wb.Sheets['Carbon Steel'];
if (carbonSheet) {
  const data = XLSX.utils.sheet_to_json(carbonSheet, { header: 1 });
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    const size = String(row[0]).replace(/[^0-9]/g, '');
    pipeData.carbon[size] = {
      od: cleanVal(row[1]),
      thick: cleanVal(row[2]),
      sep: cleanVal(row[4])
    };
  }
}

// Stainless
const stsSheet = wb.Sheets['Stainless Steel'];
if (stsSheet) {
  const data = XLSX.utils.sheet_to_json(stsSheet, { header: 1 });
  // 10S 기준 (두께, 내경, 이격거리) -> row index 8부터. 컬럼: 호칭=0, 실외경=1, 10S두께=5, 10S이격거리=7
  for (let i = 8; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    const size = String(row[0]).replace(/[^0-9]/g, '');
    pipeData.stainless[size] = {
      od: cleanVal(row[1]),
      thick: cleanVal(row[5]),
      sep: cleanVal(row[7])
    };
  }
}

fs.writeFileSync('src/data/pipeMasterData.json', JSON.stringify(pipeData, null, 2));
console.log('pipeMasterData.json generated successfully.');
