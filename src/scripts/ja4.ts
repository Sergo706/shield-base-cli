import consola from "consola";
import * as path from "path";
import { downloadFile } from "../utils/fileDownloader.js";


const logger = consola.withTag('[JA4-JSON]');

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