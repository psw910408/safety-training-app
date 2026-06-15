const XLSX = require('xlsx');
const fs = require('fs');

const path = 'D:\\1. CHM본사\\12. 인공지능\\냉방장비 성능점검 Check list - T타워 20230724-0727.xls';

try {
  const wb = XLSX.readFile(path);
  console.log("=== Check list Excel ===");
  wb.SheetNames.forEach(sheet => {
    console.log("Sheet:", sheet);
    // Get raw data with formulas if possible
    const ws = wb.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Print first 40 rows to see the layout
    for (let i = 0; i < Math.min(40, data.length); i++) {
       console.log(`Row ${i}:`, data[i]);
    }
  });
} catch(e) { console.error(e); }
