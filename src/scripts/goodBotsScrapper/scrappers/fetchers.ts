import consola from 'consola';
import { run } from '../../../utils/run.js';

const logger = consola.withTag('GOOD-BOT-CRAWLER');

let isCurlVerified = false;
export async function fetchWithCurl(url: string): Promise<string> {
    if (!isCurlVerified) {
        try {
            await run('command -v curl', { silent: true });
            isCurlVerified = true;
        } catch {
            logger.error('curl needed to be installed to run goodBots scrapper in order to avoid being blocked.');
            throw new Error('Fatal: curl is required for fallback scraping.');
        }
    }

    try {
        const { stdout } = await run(`curl -sL ${url}`, { silent: true });
        return typeof stdout === 'string' ? stdout : stdout.toString('utf-8');
    } catch (err) {
        logger.warn(`curl failed for ${url}: ${String(err)}`);
        return '';
    }
}

export async function downloadHtml(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,text/csv,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText} - ${String(response.status)}`);
        }

        const html = await response.text();
        return html;
    } catch (err) {
        logger.warn(`Fetch failed for ${url}:\n ${String(err)},\n Using curl instead...`);
        return await fetchWithCurl(url);
    }
}
