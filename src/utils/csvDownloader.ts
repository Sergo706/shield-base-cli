import consola from "consola";
import * as fs from 'fs';
import { finished } from 'node:stream/promises';
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

const logger = consola.withTag('[CSV]');
/**
 * Downloads a raw CSV file from a URL and saves it to disk via a stream pipeline.
 *
 * @param outputPath - Absolute path where the CSV file will be saved.
 * @param url - URL of the CSV file to download.
 */
export async function downloadRawCsv(outputPath: string, url: string) {
    try {
        const res = await fetch(url);
         if (!res.ok || !res.body) {
            logger.error(`ERROR: Failed to fetch or body is empty: ${res.statusText}`);
            return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        await finished(Readable.fromWeb(res.body as WebReadableStream).pipe(fileStream));
        logger.success(`File downloaded and saved to ${outputPath}`);
        return;
    } catch (err) {
        logger.error('Error downloading file.', err);
        process.exit(1);
    }
}