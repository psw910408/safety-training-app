require('dotenv').config({ path: '.env.local' });
const { Redis } = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

async function updateDept(site) {
  const data = await redis.get(`workers:${site}`);
  if (!data) return;
  const workers = JSON.parse(data);
  let changes = 0;
  
  workers.forEach(w => {
    if ((w.name === '박영원' || w.name === '박영호') && w.department === '시설/관리') {
      w.department = '관리';
      changes++;
    }
  });
  
  if (changes > 0) {
    await redis.set(`workers:${site}`, JSON.stringify(workers));
    console.log(`Updated ${changes} workers on ${site}!`);
  } else {
    console.log(`No changes needed on ${site}.`);
  }
}

async function main() {
  await updateDept('jongno');
  await updateDept('samhwa');
  redis.quit();
  console.log('Update finished!');
}

main().catch(console.error);
