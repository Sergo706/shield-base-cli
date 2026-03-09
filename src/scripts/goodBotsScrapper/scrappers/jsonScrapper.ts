import consola from 'consola';
import { BotIpData } from '../../../types/botsIps.js';

const logger = consola.withTag('GOOD-BOT-CRAWLER');

export async function jsonScrapper(name: string, urls: string[]): Promise<(BotIpData | string)[]> {
    logger.start(`Processing provider: ${name}...`);

    const promises = urls.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetch ${name} ${url} -> ${String(res.status)}`);    
        const data = await res.json() as BotIpData | BotIpData[];

        return Array.isArray(data) ? data : [data];
    });
            
    const results = await Promise.all(promises);
    return results.flat();
}