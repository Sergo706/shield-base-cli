import consola from "consola";
import * as path from "path";
import { downloadFile } from "../utils/fileDownloader.js";


const logger = consola.withTag('[USERAGENT-CSV]');

/**
 * Downloads the suspicious HTTP user-agent CSV list from mthcht/awesome-lists
 * and saves it to disk.
 * Output: `<outputPath>/useragent.csv`.
 *
 * @param outputPath - Directory where `useragent.csv` will be written.
 */
export async function getUserAgentList(outputPath: string): Promise<void> {
    const output = path.resolve(outputPath, 'useragent.csv');

    logger.start('Fetching useragent list...');
    const url = 'https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/suspicious_http_user_agents_list.csv';
    try {
        await downloadFile(output, url);           
    } catch (err) {
        throw err;
    }
}