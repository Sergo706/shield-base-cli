import consola from "consola";
import * as path from "path";
import { Readable } from 'stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import { downloadFile } from "../utils/fileDownloader.js";
import { DatabaseRecord, lmdbConvertor } from '../utils/generalCompiler/lmdbCompiler/convertor.js';
import { JA4 } from '../types/ja4.js';

const logger = consola.withTag('[JA4]');

/**
 * Downloads the JA4+ Database json fingerprints from https://ja4db.com
 * and saves it to disk.
 * Output: `<outputPath>/ja4.json`.
 *
 * @param outputPath - Directory where `ja4.json` will be written.
 */
export async function getJaDatabase(outputPath: string): Promise<void> {
    const output = path.resolve(outputPath, 'ja4.json');

    logger.start('Fetching JA4+ Database...');
    const url = 'https://ja4db.com/api/read/';
    try {
        await downloadFile(output, url);
    } catch (err) {
        throw err;
    }
}


/**
 * Streams the JA4+ Database directly from https://ja4db.com and compiles it
 * into an LMDB database for fast per-request fingerprint lookups.
 *
 * Each record is exploded by its non-null fingerprint fields so that any
 * JA4 variant (`ja4`, `ja4s`, `ja4h`, `ja4x`, `ja4t`, `ja4ts`, `ja4tscan`)
 * can be looked up directly by its fingerprint string as the key.
 *
 * Output files:
 * - `<outputPath>/ja4-db/ja4.mdb` — the LMDB data file.
 * - `<outputPath>/ja4-db/ja4.mdb-lock` — LMDB lock file, generated automatically alongside the database.
 *
 * @param outputPath - Base directory where `ja4-db/ja4.mdb` will be written.
 */
export async function getJaDatabaseLmdb(outputPath: string): Promise<void> {
    const output = path.resolve(process.cwd(), outputPath, 'ja4-db', 'ja4.mdb');
    const url = 'https://ja4db.com/api/read/';
    const maintainer = `https://ja4db.com`;
    logger.start('Fetching JA4+ Database...');

    const FP_FIELDS = [
        'ja4_fingerprint',
        'ja4s_fingerprint',
        'ja4h_fingerprint',
        'ja4x_fingerprint',
        'ja4t_fingerprint',
        'ja4ts_fingerprint',
        'ja4tscan_fingerprint',
    ] as const;

 try {

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch JA4 data: ${res.statusText}`);
    }

    const records: DatabaseRecord<JA4>[] = [];

    const pipeline = chain([
        Readable.fromWeb(res.body as unknown as Parameters<typeof Readable.fromWeb>[0]),
        parser(),
        streamArray(),
    ]);

    for await (const { value } of pipeline) {
        const entry = value as JA4;

        for (const field of FP_FIELDS) {
            const fp = entry[field];
            if (fp) {
                records.push({ 
                    key: fp,
                    data: {
                        ...entry,
                        date: new Date().toISOString(),
                        comment: `Maintained by ${maintainer}, transformed by Shield-Base` 
                    }
                });
            };
        }
    }

    logger.success(`SUCCESS: Discovered ${String(records.length)} fingerprint entries. Compiling...`);
    logger.info('Data sample:', records[0]);

    await lmdbConvertor<JA4>(output, 'ja4', records);
    logger.success(`COMPLETED: Successfully compiled JA4 data into LMDB database, to ${output}`);
  } catch (err: unknown) {
        logger.error('\nERROR during processing:', err);
        process.exit(1);
  }
}