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

/**
 * Re-runs data compilation using settings saved in the Shield-Base cache
 * (`~/.shield-base/.cache.json`). Requires at least one prior successful run.
 *
 * @param outputPath - Directory where recompiled databases will be written.
 * @param all - When `true`, recompiles all available data sources. When `false`,
 *   recompiles only the sources recorded in the cache.
 */
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
    const executionRestartQueue: { name: string, task: () => Promise<void> }[] = [];

    if (standardSources.includes('BGP')) {
         executionRestartQueue.push({ name: 'BGP & ASN', task: () => getBGPAndASN(cache.useragent || '', outputPath, cache.mmdbctlPath) });
    }

    if (standardSources.includes('City')) {
        executionRestartQueue.push({
            name: 'City',
            task: () => buildCitiesData(cache.outPutPath, cache.mmdbctlPath),
        });
    }
    if (standardSources.includes('Geography')) {
        executionRestartQueue.push({
            name: 'Geography',
            task: () =>  getGeoDatas(cache.outPutPath, cache.mmdbctlPath)
        });
    }

    if (standardSources.includes('Proxy')) {
        executionRestartQueue.push({
            name: 'Proxy',
            task: () =>  getListOfProxies(cache.outPutPath, cache.mmdbctlPath)
        });
    }

    if (standardSources.includes('Tor')) {
        executionRestartQueue.push({
            name: 'Tor',
            task: () =>  getTorLists(cache.outPutPath, cache.mmdbctlPath)
        });
    }
    
    if (fireholSources.length > 0) {
        executionRestartQueue.push({
            name: 'Threats',
            task: () =>  getThreatLists(cache.outPutPath, cache.mmdbctlPath, fireholSources)
        });
    }
        consola.start(`Running ${String(executionRestartQueue.length)} restart jobs...`);
        const results = await Promise.allSettled(executionRestartQueue.map(q => q.task()));
        
        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                consola.error(`[${executionRestartQueue[index].name}] Failed:`, res.reason);
            }
        });

    consola.success('✨ Cached data successfully refreshed!');
    return;
}