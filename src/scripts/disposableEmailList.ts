import consola from 'consola';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseRecord, lmdbConvertor } from '../utils/generalCompiler/lmdbCompiler/convertor.js';
import { EmailListRecord } from '../types/disposableEmails.js';

const logger = consola.withTag('[Disposable-Email-List]');

/**
 * Downloads the disposable email domain blocklist from disposable-email-domains
 * and saves it as a plain-text file.
 * Output: `<outputPath>/disposable_email_blocklist.txt`.
 *
 * @param outputPath - Directory where `disposable_email_blocklist.txt` will be written.
 */
export async function getDisposableEmailList(outputPath: string): Promise<void> {
    const output = path.resolve(outputPath, 'disposable_email_blocklist.txt');  
    const url = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf';

    logger.info('Fetching Disposable Email List...');
    try {
        const res = await fetch(url);

         if (!res.ok) {
            logger.error(`ERROR: Failed to fetch or body is empty: ${res.statusText}`);
            return;
        }

        const data = await res.text();
        await writeFile(output, data, 'utf-8');
        logger.success('File downloaded successfully.');
        return;
    } catch(err) {
        logger.error('Failed downloading file', err);
        process.exit(1);
    }
}

/**
 * Fetches the disposable email domain blocklist from disposable-email-domains
 * and compiles it into an LMDB database for fast per-request domain lookups.
 *
 * Each domain is stored as-is (lowercased) as the key, enabling O(log n)
 * exact lookups — ideal for checking whether an email domain is disposable
 * on every incoming request.
 *
 * Output files:
 * - `<outputPath>/email-db/disposable-emails.mdb` — the LMDB data file.
 * - `<outputPath>/email-db/disposable-emails.mdb-lock` — LMDB lock file, generated automatically alongside the database.
 *
 * @param outputPath - Base directory where `email-db/disposable-emails.mdb` will be written.
 */
export async function getDisposableEmailLmdbList(outputPath: string): Promise<void> {
        const output = path.resolve(process.cwd(), outputPath, 'email-db', 'disposable-emails.mdb');
        const url = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf';
        const maintainer = 'https://github.com/disposable-email-domains/disposable-email-domains';

    logger.info('Fetching Disposable Email List...');

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`ERROR: Failed to fetch country data: ${res.statusText}`);
        }
        
        const text = await res.text();
        const lines = text.split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(Boolean);
        logger.success(`SUCCESS: Received ${String(lines.length)} email domains. Cleaning data...`);

        const results: DatabaseRecord<EmailListRecord>[] = [];
        
        for (const domain of lines) {
            const record: DatabaseRecord<EmailListRecord> = {
                key: domain,
                data: {
                    domain,
                    date: new Date().toISOString(),
                    comment: `Maintained by ${maintainer} transformed by Shield-Base`
                }
            };
            results.push(record);
        }
        logger.info('Data sample:', results[0]);

        logger.success(`SUCCESS: Finished Cleaning. Discovered ${String(results.length)} unique records, Compiling...`);
        await lmdbConvertor<EmailListRecord>(output, 'email', results);
        logger.success(`COMPLETED: Successfully compiled disposable email data, into LMDB database, to ${output}\n`);

    } catch(err: unknown) {
        logger.error('\nERROR during processing:', err);
        process.exit(1);
    }
}