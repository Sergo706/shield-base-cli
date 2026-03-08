/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import consola from 'consola';
import path from 'node:path';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { InputCache } from '../types/input.js';
import { 
    getBGPAndASN,
    buildCitiesData,
    generateData as executeAll,
    getGeoDatas,
    getListOfProxies,
    getThreatLists,
    getTorLists
} from '../scripts/index.js';

const cacheOutput = path.join(os.homedir(), '.shield-base', '.cache.json');

export async function restartData(outputPath: string, all: boolean): Promise<void> {
   
    if (!existsSync(cacheOutput)) { 
        consola.error('No cache found. Cannot restart. Please run a standard compilation first.');
        process.exit(1);
    }
    
    const cachedFile = await readFile(cacheOutput, 'utf-8');
    const cache = JSON.parse(cachedFile) as InputCache;
    
    if (!cache.selectedDataTypes || cache.selectedDataTypes.length === 0) {
        consola.warn('Cache is empty. No data sources to restart.');
        return;
    }

    if (all) {
       consola.info('Restarting ALL data sources...');
       await executeAll(outputPath, cache.useragent, true, cache.mmdbctlPath);
       consola.success('✨ All data successfully refreshed!');
       return;
    }

    consola.info(`Restarting data compilation from cache: ${cache.selectedDataTypes.join(', ')}`);

    const fireholSources = cache.selectedDataTypes.filter(s => s.startsWith('firehol_') || s === 'anonymous');
    const standardSources = cache.selectedDataTypes.filter(s => !s.startsWith('firehol_') && s !== 'anonymous');


    if (standardSources.includes('BGP')) {
        await getBGPAndASN(cache.useragent || '', outputPath, cache.mmdbctlPath);
    }
    if (standardSources.includes('City')) {
        await buildCitiesData(outputPath, cache.mmdbctlPath);
    }
    if (standardSources.includes('Geography')) {
        await getGeoDatas(outputPath, cache.mmdbctlPath);
    }
    if (standardSources.includes('Proxy')) {
        await getListOfProxies(outputPath, cache.mmdbctlPath);
    }
    if (standardSources.includes('Tor')) {
        await getTorLists(outputPath, cache.mmdbctlPath);
    }
    
    if (fireholSources.length > 0) {
        await getThreatLists(outputPath, cache.mmdbctlPath, fireholSources);
    }

    consola.success('✨ Cached data successfully refreshed!');
    return;
}