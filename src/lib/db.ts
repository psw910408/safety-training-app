import { Redis } from 'ioredis';

// Create a singleton connection to Vercel KV (Redis)
const redis = new Redis(process.env.KV_URL || process.env.REDIS_URL || '');

class RedisDatabase {
  private site: string;
  constructor(site: string) {
    this.site = site;
  }

  // SELECT * FROM workers WHERE phone = ?
  async get(sql: string, phone: string) {
    const data = await redis.get(`workers:${this.site}`);
    if (!data) return null;
    const workers = JSON.parse(data);
    return workers.find((w: any) => w.phone === phone) || null;
  }

  // SELECT * FROM workers ORDER BY id DESC
  async all(sql: string) {
    const data = await redis.get(`workers:${this.site}`);
    if (!data) return [];
    const workers = JSON.parse(data);
    return workers.sort((a: any, b: any) => b.id - a.id);
  }

  // INSERT and DELETE compatibility
  async run(sql: string, ...params: any[]) {
    const sqlUpper = sql.trim().toUpperCase();
    
    if (sqlUpper.startsWith('INSERT')) {
      const data = await redis.get(`workers:${this.site}`);
      let workers = data ? JSON.parse(data) : [];
      const newId = workers.length > 0 ? Math.max(...workers.map((w: any) => w.id)) + 1 : 1;
      
      const newWorker = {
        id: newId,
        name: params[0],
        phone: params[1],
        department: params[2],
        hireDate: params[3],
        isNightWorker: params[4],
        trainingHire: params[5],
        trainingPressure: params[6],
        trainingBoiler: params[7],
        trainingFire: params[8],
        trainingElectric: params[9],
        trainingConfined: params[10],
        trainingMSDS: params[11],
        nextTrainingMSDS: params[12],
        healthCheckPre: params[13],
        healthCheckPost: params[14],
        healthCheckRegular: params[15]
      };
      
      // UNIQUE constraint check
      if (workers.find((w: any) => w.phone === newWorker.phone)) {
        const err: any = new Error('SQLITE_CONSTRAINT');
        err.code = 'SQLITE_CONSTRAINT';
        throw err;
      }

      workers.push(newWorker);
      await redis.set(`workers:${this.site}`, JSON.stringify(workers));
      return { lastID: newId };
    } 
    else if (sqlUpper.startsWith('DELETE')) {
      const id = params[0];
      const data = await redis.get(`workers:${this.site}`);
      let workers = data ? JSON.parse(data) : [];
      workers = workers.filter((w: any) => String(w.id) !== String(id));
      await redis.set(`workers:${this.site}`, JSON.stringify(workers));
      return { changes: 1 };
    }
  }
}

const dbs: { [key: string]: RedisDatabase } = {
  jongno: new RedisDatabase('jongno'),
  samhwa: new RedisDatabase('samhwa'),
};

export async function getDb(site: 'jongno' | 'samhwa' = 'jongno') {
  return dbs[site];
}
