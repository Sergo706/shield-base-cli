#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { consola } from 'consola';
import { commands, sources } from './utils/commands.js';
import { askForUserAgent } from './utils/userAgentInput.js';
import { isValidUserAgent } from "./utils/validateUserAgent.js";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
    getBGPAndASN,
    buildCitiesData,
    generateData as executeAll,
    getGeoDatas,
    getListOfProxies,
    getThreatLists,
    getTorLists
} from './scripts/index.js';
import { ensureMmdbctl } from './utils/mmdbctlInstaller.js';
import type { InputCache } from './types/input.js';
import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { restartData } from './utils/restart.js';

const fireholUrl = 'https://github.com/firehol/blocklist-ipsets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = defineCommand({
  meta: {
    name: 'shield-base',
    version: '1.0.0',
    description: 'Offline IP threat intelligence & GeoIP MMDB compiler',
  },

  args: {
    ...commands
  },
 
async run({ args }) {
    consola.box('Welcome to Shield-Base!');


    const includeFirehol = args.acceptFireholRisk;

    const cacheOutput = path.join(os.homedir(), '.shield-base', '.cache.json');
    let cache: Partial<InputCache> = {};

    if (fs.existsSync(cacheOutput)) { 
      const cacheedFile = await readFile(cacheOutput, 'utf-8');
      cache = JSON.parse(cacheedFile) as InputCache;
    }

    let mmdbPath = '';
    if (cache.mmdbctlPath && fs.existsSync(cache.mmdbctlPath)) {
      mmdbPath = cache.mmdbctlPath;
    } else {
      consola.start('Verifying system dependencies...');
      mmdbPath = await ensureMmdbctl();
      cache.mmdbctlPath = mmdbPath;
    }


    if (includeFirehol && !cache.license) {
      cache.license = true;
      consola.success('FireHOL databases included in scope.');
    }  else {
      consola.warn(`Some data included in "Threats" and "Proxy" may include specific fields that have different types of licensing.\nPlease check for more info: ${fireholUrl}`);
      consola.info('Skipping FireHOL datasets.');
    }

    type Source = typeof sources[number]['value'];
    let selectedSources: Source[] = [];
    const allSourceValues = sources.map(s => s.value);

    const flaggedSources: Source[] = [];

    if (args.refreshAll || args.refresh) {
        consola.info('Initializing data restart...');
        const isAll = !!args.refreshAll;
        const outputPath = path.resolve(__dirname, args.path ?? import.meta.dirname);
        
        await restartData(outputPath, isAll);
        return;
    }
    
    if (args.bgp) flaggedSources.push('BGP');
    if (args.city) flaggedSources.push('City');
    if (args.geo) flaggedSources.push('Geography');
    if (args.proxy) flaggedSources.push('Proxy');
    if (args.tor) flaggedSources.push('Tor');
    if (args.l1) flaggedSources.push('firehol_l1');
    if (args.l2) flaggedSources.push('firehol_l2');
    if (args.l3) flaggedSources.push('firehol_l3');
    if (args.l4) flaggedSources.push('firehol_l4');
    if (args.anonymous) flaggedSources.push('firehol_anonymous');
    
    if (args.all) {
      consola.info('Argument --all passed. Selecting all available sources...');
      selectedSources = [...allSourceValues];
    } else if (flaggedSources.length > 0) {
      consola.info(`Specific sources selected via flags: ${flaggedSources.join(', ')}`);
      selectedSources = flaggedSources;
    } else {
      const mode = await consola.prompt('Choose your data', {
        type: 'select',
        options: [
          { label: 'All (Recommended)', value: 'all' },
          { label: 'Select Multiple', value: 'custom' }
        ],
        cancel: 'null' 
      });

      if (mode === null) {
            consola.fail('Operation cancelled. Exiting Shield-Base...');
            process.exit(1); 
       }

      if (mode === 'all') {
        selectedSources = [...allSourceValues];
      } else {
        selectedSources = await consola.prompt('Select data sources to compile', {
          type: 'multiselect',
          options: sources.map(s => ({
            label: s.label,
            value: s.value,
            hint: s.hint,
            cancel: 'null'
          }))
        }) as unknown as Source[];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (selectedSources.length === 0 || !selectedSources) {
      consola.error('No data sources selected for compilation. Exiting...');
      process.exit(1);
    }

    cache.selectedDataTypes = selectedSources;
    let contactInfo = args.contact;

if (selectedSources.includes('BGP')) {
      if (contactInfo) {
        const validation = isValidUserAgent(contactInfo);
        if (validation !== true) {
          consola.error(`Invalid --contact flag provided: ${String(validation)}`);
          process.exit(1);
        }
        cache.useragent = contactInfo;
        consola.success('Valid contact info provided via --contact flag. Skipping prompt.');
      } else if (cache.useragent) {
        contactInfo = cache.useragent;
        consola.info('Loaded BGP contact info from cache.');
      } else {
        const bgpAction = await consola.prompt(
          'BGP.tools requires contact information (User-Agent) to prevent API blocking. How would you like to proceed?',
          {
            type: 'select',
            options: [
              { label: 'Provide details', value: 'provide' },
              { label: 'Exclude BGP Data', value: 'exclude' }
            ],
            cancel: 'null'
          }
        );

        if (!bgpAction) {
            consola.fail('Operation cancelled. Exiting Shield-Base...');
            process.exit(1); 
        }

        if (bgpAction === 'provide') {
          contactInfo = await askForUserAgent();
          cache.useragent = contactInfo;
        } else {
          consola.info('Excluding BGP from the compilation queue...');
          selectedSources = selectedSources.filter(source => source !== 'BGP');
          
          if (selectedSources.length === 0) {
            consola.error('No data sources remaining for compilation. Exiting...');
            process.exit(1);
          }
        }
      }
    }


    consola.start(`Compiling data sources: ${selectedSources.join(', ')}...`);
    const output = path.resolve(__dirname, args.path ?? import.meta.dirname);
    consola.info(`Output directory mapped to: ${output}`);
    const isRunningAll = selectedSources.length === allSourceValues.length;
    if (isRunningAll) {
        consola.start('🚀 Compiling all data sources...');
        await executeAll(output, contactInfo ?? '', true, mmdbPath);
    } else {

    consola.info('Running partial pipeline for selected sources...');
    
    const fireholSources = selectedSources.filter(s => s.startsWith('firehol_'));
    const standardSources = selectedSources.filter(s => !s.startsWith('firehol_'));

    const executionQueue: { name: string, task: () => Promise<void> }[] = [];

    if (standardSources.includes('BGP')) {
        executionQueue.push({ name: 'BGP & ASN', task: () => getBGPAndASN(contactInfo ?? '', output, mmdbPath) });
    }
    if (standardSources.includes('City')) {
        executionQueue.push({ name: 'City (Geofeed)', task: () => buildCitiesData(output, mmdbPath) });
    }
    if (standardSources.includes('Geography')) {
        executionQueue.push({ name: 'Country (Sapics)', task: () => getGeoDatas(output, mmdbPath) });
    }
    if (standardSources.includes('Proxy')) {
        executionQueue.push({ name: 'Proxies', task: () => getListOfProxies(output, mmdbPath) });
    }
    if (standardSources.includes('Tor')) {
        executionQueue.push({ name: 'Tor Nodes', task: () => getTorLists(output, mmdbPath) });
    }
    if (fireholSources.length > 0) {
        executionQueue.push({ name: `Threats (${String(fireholSources.length)} lists)`, task: () => getThreatLists(output, mmdbPath, fireholSources) });
    }

    if (args.parallel) {
        consola.start(`Running ${String(executionQueue.length)} compilation jobs...`);
        const results = await Promise.allSettled(executionQueue.map(q => q.task()));
        
        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                consola.error(`[${executionQueue[index].name}] Failed:`, res.reason);
            }
        });
    } else {
        consola.start(`Running ${String(executionQueue.length)} compilation jobs sequentially...`);
        for (const q of executionQueue) {
            consola.start(`Initializing ${q.name} compiler...`);
            await q.task();
            consola.success(`${q.name} compilation complete.`);
        }
    }
  }


    const cacheDir = path.dirname(cacheOutput);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    await writeFile(cacheOutput, JSON.stringify(cache, null, 2), 'utf-8');

    consola.success(`✨ All data successfully compiled!\n You can view at ${output}`);
}
});

await runMain(start);