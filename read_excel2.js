const XLSX = require('xlsx');
const fs = require('fs');

const path1 = 'D:\\1. CHM본사\\12. 인공지능\\00. 사옥별 냉동기 배관 사이즈.xlsx';

try {
  const wb = XLSX.readFile(path1);
  console.log("=== 00. 사옥별 냉동기 배관 사이즈.xlsx ===");
  wb.SheetNames.forEach(sheet => {
    console.log("Sheet:", sheet);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 });
    console.log(data.slice(0, 10)); // Print first 10 rows
  });
} catch(e) { console.error(e); }
