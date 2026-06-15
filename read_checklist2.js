const XLSX = require('xlsx');
const fs = require('fs');

const path = 'D:\\1. CHM본사\\12. 인공지능\\냉방장비 성능점검 Check list - T타워 20230724-0727.xls';

try {
  const wb = XLSX.readFile(path);
  wb.SheetNames.forEach(sheet => {
    if (sheet.includes('냉각탑')) {
       console.log("Found tower sheet:", sheet);
       const ws = wb.Sheets[sheet];
       const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
       for (let i = 0; i < Math.min(40, data.length); i++) {
          console.log(`Row ${i}:`, data[i]);
       }
    }
  });
  
  // If not found in sheet name, search all sheets for "냉각탑"
  console.log("Searching all sheets for 냉각탑...");
  wb.SheetNames.forEach(sheet => {
    const ws = wb.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let found = false;
    for (let i = 0; i < data.length; i++) {
       const rowStr = JSON.stringify(data[i]);
       if (rowStr.includes('냉각탑') || rowStr.includes('CRT') || rowStr.includes('엔탈피')) {
          if (!found) {
             console.log("Found in sheet:", sheet);
             found = true;
          }
          console.log(`Row ${i}:`, data[i]);
       }
    }
  });
} catch(e) { console.error(e); }
