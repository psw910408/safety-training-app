require('dotenv').config({ path: '.env.local' });
const { Redis } = require('ioredis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Extract REDIS_URL from Vercel's injected env
const redis = new Redis(process.env.REDIS_URL);

async function migrateSite(site) {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(process.cwd(), `${site}.db`);
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error(`Cannot open ${site}.db:`, err.message);
        return resolve();
      }
      
      db.all('SELECT * FROM workers', async (err, rows) => {
        if (err) {
          console.error(`Query error on ${site}:`, err);
          return resolve();
        }
        
        console.log(`Loaded ${rows.length} rows from ${site}.db`);
        if (rows.length > 0) {
          await redis.set(`workers:${site}`, JSON.stringify(rows));
          console.log(`Migrated ${site} to Redis!`);
        }
        resolve();
      });
    });
  });
}

async function main() {
  await migrateSite('jongno');
  await migrateSite('samhwa');
  redis.quit();
  console.log('Migration complete!');
}

main().catch(console.error);
