const http = require('http');
const https = require('https');

const postData = JSON.stringify({
  name: "박영호",
  phone: "010-1234-5678",
  department: "시설/관리",
  hireDate: "2026.01.02",
  isNightWorker: false,
  site: "jongno"
});

const req = https.request('https://safety-training-app.vercel.app/api/admin/workers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();

const postData2 = JSON.stringify({
  name: "김철수",
  phone: "010-8888-9999",
  department: "미화",
  hireDate: "2026.02.15",
  isNightWorker: false,
  site: "jongno"
});

const req2 = https.request('https://safety-training-app.vercel.app/api/admin/workers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData2)
  }
}, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

req2.write(postData2);
req2.end();
