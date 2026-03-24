import {open, RootDatabaseOptionsWithPath} from "lmdb";
import 'lmdb';

declare module 'lmdb' {
    interface RootDatabaseOptions {
        /**  Disables the OS read-ahead caching. 
         * Useful for random access on databases larger than RAM. 
         */
        noReadAhead?: boolean;
    }
}
export interface DatabaseRecord<T> {
    key: string,
    data: T
}

export async function chunkProcess<T>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[], index: number) => Promise<void> | void
): Promise<void> {
  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processor(chunk, i);
  }
}

export async function lmdbConvertor<T>(outputPath: string, dbName: string, record: DatabaseRecord<T> | DatabaseRecord<T>[], overides?: RootDatabaseOptionsWithPath) {

    const db = open({
        path: outputPath,
        compression: true,
        pageSize: 4096,
        readOnly: false,
        name: dbName,
        useVersions: true,
        sharedStructuresKey: Symbol.for('structures'),
        cache: {
            validated: true
        },
        noReadAhead: true,
        maxReaders: 2024,
        ...overides
    });

    if (!Array.isArray(record)) {
        await db.put(record.key, record.data);
    } else {
        await chunkProcess<DatabaseRecord<T>>(record, 10000, async (chunk) => {
            const batch = chunk.map(item => db.put(item.key, item.data));
            await Promise.all(batch);
        });
    }

    await db.flushed;
    await db.close();
}