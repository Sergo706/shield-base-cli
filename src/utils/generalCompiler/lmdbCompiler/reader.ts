import consola from "consola";
import { open, RootDatabaseOptionsWithPath } from "lmdb";

function openDb(dbPath: string, dbName: string, overrides?: Partial<RootDatabaseOptionsWithPath>) {
    return open({
        path: dbPath,
        compression: true,
        readOnly: true,
        name: dbName,
        useVersions: true,
        sharedStructuresKey: Symbol.for('structures'),
        ...overrides,
    });
}

/** Get a single record by exact key */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getByKey<T>(dbPath: string, dbName: string, key: string): T | undefined {
    const db = openDb(dbPath, dbName);
    const result = (db.get(key) as unknown) as T | undefined;

    consola.log(`[get] key="${key}"`, 
        result ?? '(not found)'
    );
    
    void db.close();
    if (result) return result;
    return undefined;
}

/** Get the first N records */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getRange<T>(dbPath: string, dbName: string, limit = 10): { key: string; data: T }[] {
    const db = openDb(dbPath, dbName);
    const results: { key: string; data: T }[] = [];

    for (const { key, value } of db.getRange({ limit })) {
        results.push({ key: key as string, data: (value as unknown) as T });
    }

    consola.log(`[range] first ${limit.toString()} records:`);
    console.dir(results, { depth: 5 });
    
    void db.close();
    return results;
}

/** Get records whose key starts with a prefix */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getByPrefix<T>(dbPath: string, dbName: string, prefix: string, limit = 20): { key: string; data: T }[] {
    const db = openDb(dbPath, dbName);
    const results: { key: string; data: T }[] = [];

    for (const { key, value } of db.getRange({ start: prefix, limit })) {
        if (!(key as string).startsWith(prefix)) break;
        results.push({ key: key as string, data: (value as unknown) as T });
    }

    consola.log(`[prefix] key prefix="${prefix}" 
     (${results.length.toString()} results):`
    );
    console.dir(results, { depth: 5 });
    void db.close();
    return results;
}

/** Count total records */
export function countRecords(dbPath: string, dbName: string): number {
    const db = openDb(dbPath, dbName);
    const count = db.getCount();
    consola.log(`[count] total records: ${count.toString()}`);
    void db.close();
    return count;
}

/** Check whether a key exists without reading the value */
export function doesExist(dbPath: string, dbName: string, key: string): boolean {
    const db = openDb(dbPath, dbName);
    const exists = db.doesExist(key);
    consola.log(`[exists] key="${key}":`, exists);
    void db.close();
    return exists;
}
/** Return low level LMDB environment statistics (page size, depth, record count, etc.) */
export function stats(dbPath: string, dbName: string) {
    const db = openDb(dbPath, dbName);
    const stats = db.getStats();
    consola.log(stats);

    void db.close();
    return stats;
}

/**
 * Permanently delete all records and the named sub database.
 * This operation is irreversible. The database file remains on disk but the
 * sub-database is wiped. Opens the environment in write mode.
 */
export async function drop(dbPath: string, dbName: string) {
    const db = openDb(dbPath, dbName, { readOnly: false });
    await db.drop();
    consola.log(`Deleted`);

    void db.close();
    return;
}

   
