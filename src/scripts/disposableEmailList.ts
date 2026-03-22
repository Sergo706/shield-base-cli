import consola from 'consola';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const logger = consola.withTag('[Disposable-Email-List-TXT]');

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