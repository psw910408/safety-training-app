const https = require('https');
const options = { hostname: 'kvdb.io', port: 443, path: '/', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
req.write('email=antigravity@gemini.com');
req.end();
