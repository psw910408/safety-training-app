import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

const dbs: { [key: string]: Database | null } = {
  jongno: null,
  samhwa: null,
};

export async function getDb(site: 'jongno' | 'samhwa' = 'jongno') {
  if (!dbs[site]) {
    dbs[site] = await open({
      filename: path.join(process.cwd(), `${site}.db`),
      driver: sqlite3.Database
    });

    await dbs[site]!.exec(`
      CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL,
        hireDate TEXT NOT NULL,
        isNightWorker INTEGER NOT NULL DEFAULT 0,
        trainingHire TEXT,
        trainingPressure TEXT,
        trainingBoiler TEXT,
        trainingFire TEXT,
        trainingElectric TEXT,
        trainingConfined TEXT,
        trainingMSDS TEXT,
        nextTrainingMSDS TEXT,
        healthCheckPre TEXT,
        healthCheckPost TEXT,
        healthCheckRegular TEXT
      )
    `);
  }
  return dbs[site]!;
}
