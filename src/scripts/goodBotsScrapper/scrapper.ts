import path from 'path';
import fs  from 'node:fs';
import consola from 'consola';
import { urls } from './urls.js';
import { BotIpsLists, BotIpPrefix } from '../../types/botsIps.js';
import { run } from '../../utils/run.js';
import { normalizeIp } from './ipNormalizers.js';
import { jsonScrapper } from './scrappers/jsonScrapper.js';
import { htmlScrapper } from './scrappers/htmlScrapper.js';
import {ProvidersLists} from '../../types/botsIps.js';

const logger = consola.withTag('GOOD-BOT-CRAWLER');

/**
 * Scrapes IP ranges from official provider geofeeds (Google, Bing, Apple,
 * Meta, and others) and compiles them into an MMDB database. Accepts optional
 * custom provider configs to extend the built-in dataset.
 * Output: `<outputPath>/goodBots.mmdb`.
 *
 * @param outputPath - Directory where the compiled `goodBots.mmdb` will be written.
 * @param mmdbPath - Path to the `mmdbctl` binary, or `"mmdbctl"` if it is on PATH.
 * @param customUrls - Optional list of additional provider URL configs to merge.
 *   Each entry must include `name`, `type` (`"JSON"` | `"CSV"` | `"HTML"`), and `urls`.
 */
export async function getCrawlersIps(outputPath: string, mmdbPath: string, customUrls?: ProvidersLists[]) {

    logger.start('Starting Good Bots IP scraper...');
    const databasePath = path.resolve(outputPath, './goodBots.mmdb');
    const providers = [...urls, ...(customUrls ?? [])];

    
    if (customUrls && customUrls.length > 0) {
        customUrls.forEach((prov) => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!prov.name || !prov.type || !prov.urls) {
                throw new Error(`Provider ${prov.name || 'unknown'} is missing required fields.`);
            }
        });
    } 

    const ipDb: BotIpsLists = {};


    for (const provider of providers) {
         if (provider.type === 'JSON') {
            ipDb[provider.name] = await jsonScrapper(provider.name, provider.urls);
        } else {
            ipDb[provider.name] = await htmlScrapper(provider.urls, provider.name);
        }
    }

    consola.info(`Building data...`);

    const mmdbRecords = Object.entries(ipDb).flatMap(([provider, snapshots]) => {
        return snapshots.flatMap((snap) => {
            if (typeof snap === 'string') {
                try {
                    return [{
                        range: normalizeIp(snap),
                        provider: provider,
                        syncToken: 'unknown',
                        creationTime: new Date().toISOString()
                    }];
                } catch (err) {
                    logger.warn(`Invalid ip format skipping: ${snap} -> ${String(err)}`);
                    return null;
                }
            }
            return snap.prefixes.map((p: BotIpPrefix) => {
                const rawIp = p.ipv4Prefix ?? p.ipv6Prefix ?? '';
                if (!rawIp) return null;

                try {
                    return {
                        range: normalizeIp(rawIp),
                        provider: provider,
                        syncToken: snap.syncToken,
                        creationTime: snap.creationTime
                    };
                } catch (err) {
                    logger.warn(`Invalid ip format skipping from prefix: ${rawIp} -> ${String(err)}`);
                    return null;
                }
            }).filter(Boolean);
        });
    });

    logger.info(`Total records to import: ${String(mmdbRecords.length)}`);

    const tempJsonPath = path.resolve(outputPath, 'temp_bots.json');

    const jsonLines = mmdbRecords.map(r => JSON.stringify(r)).join('\n');

    fs.writeFileSync(tempJsonPath, jsonLines, 'utf-8');

    try {
        logger.info('Compiling MMDB...');
        const cmd = `${mmdbPath} import --in ${tempJsonPath} --out ${databasePath}`;
        await run(cmd);
        logger.success(`Successfully generated ${databasePath}`);
    } catch (err) {
        logger.error(`Failed to compile MMDB: ${String(err)}`);
        throw err;
    } finally {
        if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
        }
    }
}