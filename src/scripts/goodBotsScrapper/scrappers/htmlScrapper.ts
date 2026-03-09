import { downloadHtml } from './fetchers.js';
import { BotIpData } from '../../../types/botsIps.js';
import { normalizeExtractedMatch } from '../ipNormalizers.js';
import { botIpExtractor } from '../regex.js';
import consola from 'consola';

const logger = consola.withTag('GOOD-BOT-CRAWLER');

export async function htmlScrapper(urls: string[], name: string): Promise<(BotIpData | string)[]> {
    logger.start(`Processing provider: ${name}...`);
    const texts = (await Promise.all(urls.map(downloadHtml)));

    const allMatches = texts.flatMap((txt: string) => {
        const matches = Array.from(txt.matchAll(botIpExtractor));
                
        return matches.flatMap((m) => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!m.groups?.ip1) return [];
                        
            try {
                const normalized = normalizeExtractedMatch(
                        m.groups.ip1, 
                        m.groups.ip2, 
                        m.groups.mask
                );
                            
                return Array.isArray(normalized) ? normalized : [normalized];
            } catch (err) {
                logger.warn(`Failed to normalize extracted IP match from ${name}:`, m[0], `Message: ${String(err)}`);
                return [];
                }
            });
        });
        
        return [{
            creationTime: new Date().toISOString(),
            prefixes: Array.from(new Set(allMatches)).map((ip: string) => ({ ipv4Prefix: ip }))
        }];
}