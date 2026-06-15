const XLSX = require('xlsx');
const fs = require('fs');

const path = 'D:\\1. CHM본사\\12. 인공지능\\00. 사옥별 냉동기 배관 사이즈.xlsx';
const wb = XLSX.readFile(path);

const cleanVal = (v) => {
  if (v === undefined || v === null) return '';
  let str = String(v).trim();
  str = str.replace(/\(.*?\)/g, '').trim();
  return str;
};

const pipeData = { carbon: {}, copper: {}, stainless: {}, su: {} };

// Copper
const copperSheet = wb.Sheets['Copper'];
const cData = XLSX.utils.sheet_to_json(copperSheet, { header: 1 });
cData.forEach(row => {
  if (!row || !row[0]) return;
  const rawSize = String(row[0]);
  if (!rawSize.includes('A') && !rawSize.match(/^[0-9]+$/)) return;
  const size = rawSize.replace(/[^0-9]/g, '');
  if (!size) return;
  pipeData.copper[size] = {
    od: cleanVal(row[1]),
    thick: cleanVal(row[2]),
    sep: cleanVal(row[4]) || cleanVal(row[5])
  };
});

// Carbon Steel
const carbonSheet = wb.Sheets['Carbon Steel'];
const csData = XLSX.utils.sheet_to_json(carbonSheet, { header: 1 });
csData.forEach(row => {
  if (!row || !row[0]) return;
  const rawSize = String(row[0]);
  if (!rawSize.includes('A') && !rawSize.match(/^[0-9]+$/)) return;
  const size = rawSize.replace(/[^0-9]/g, '');
  if (!size) return;
  pipeData.carbon[size] = {
    od: cleanVal(row[1]),
    thick: cleanVal(row[2]),
    sep: cleanVal(row[4]) || cleanVal(row[5])
  };
});

// Stainless Steel
const stsSheet = wb.Sheets['Stainless Steel'];
const stData = XLSX.utils.sheet_to_json(stsSheet, { header: 1 });
stData.forEach(row => {
  if (!row || !row[0]) return;
  const rawSize = String(row[0]);
  if (!rawSize.includes('A') && !rawSize.match(/^[0-9]+$/)) return;
  const size = rawSize.replace(/[^0-9]/g, '');
  if (!size) return;
  pipeData.stainless[size] = {
    od: cleanVal(row[1]),
    thick: cleanVal(row[5]),
    sep: cleanVal(row[7]) || cleanVal(row[4])
  };
});

fs.writeFileSync('src/data/pipeMasterData.json', JSON.stringify(pipeData, null, 2));
console.log('pipeMasterData.json regenerated successfully.');
