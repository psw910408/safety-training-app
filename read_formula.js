const XLSX = require('xlsx');
const fs = require('fs');

const path = 'D:\\1. CHM본사\\12. 인공지능\\냉방장비 성능점검 Check list - T타워 20230724-0727.xls';

try {
  const wb = XLSX.readFile(path, { cellFormula: true });
  const ws = wb.Sheets['24 HR 전기식냉동기'];
  if (ws) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 56; R <= 62; R++) {
      for (let C = 0; C <= 15; C++) {
        const cellAddress = XLSX.utils.encode_cell({c: C, r: R});
        const cell = ws[cellAddress];
        if (cell && cell.f) {
           console.log(`Cell ${cellAddress} formula: ${cell.f} | value: ${cell.v}`);
        }
      }
    }
  }
} catch(e) { console.error(e); }
