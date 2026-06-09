// A drop-in replacement for ioredis using kvdb.io for completely free, no-auth serverless storage
const BUCKET = 'SPmfeQk63wTUT2yUue1a1s';
const BASE_URL = `https://kvdb.io/${BUCKET}`;

export class Redis {
  constructor(url?: string, options?: any) {}

  async get(key: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE_URL}/${key}`, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`KVDB get error: ${res.statusText}`);
      return await res.text();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/${key}`, {
        method: 'POST',
        body: value,
        headers: { 'Content-Type': 'text/plain' }
      });
      if (!res.ok) throw new Error(`KVDB set error: ${res.statusText}`);
    } catch (e) {
      console.error(e);
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const data = await this.get(key);
    if (!data) return [];
    try {
      const arr = JSON.parse(data);
      if (!Array.isArray(arr)) return [];
      const end = stop === -1 ? arr.length : stop + 1;
      return arr.slice(start, end);
    } catch (e) {
      return [];
    }
  }

  async lpush(key: string, value: string): Promise<void> {
    const data = await this.get(key);
    const arr = data ? JSON.parse(data) : [];
    arr.unshift(value);
    await this.set(key, JSON.stringify(arr));
  }

  async lset(key: string, index: number, value: string): Promise<void> {
    const data = await this.get(key);
    if (!data) return;
    const arr = JSON.parse(data);
    if (index >= 0 && index < arr.length) {
      arr[index] = value;
      await this.set(key, JSON.stringify(arr));
    }
  }

  async lrem(key: string, count: number, value: string): Promise<void> {
    const data = await this.get(key);
    if (!data) return;
    let arr = JSON.parse(data);
    if (count > 0) {
      const idx = arr.indexOf(value);
      if (idx !== -1) arr.splice(idx, 1);
    } else {
      arr = arr.filter((v: string) => v !== value);
    }
    await this.set(key, JSON.stringify(arr));
  }
}
