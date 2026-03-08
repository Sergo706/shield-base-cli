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

const fireholUrl = 'https://github.com/firehol/blocklist-ipsets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = defineCommand({
  meta: {
    name: 'shield-base-cli',
    version: '1.0.0',
    description: 'Offline IP threat intelligence & GeoIP MMDB compiler',
  },

  args: {
    ...commands
  },

async run({ args }) {
    consola.box('🛡️ Welcome to Shield-Base!');

    const includeFirehol = args.acceptFireholRisk;
    let contactInfo = '';

    if (!includeFirehol || args.all) {
      consola.warn(`Some data included in "Threats" and "Proxy" may include specific fields that have different types of licensing.\nPlease check for more info: ${fireholUrl}`);
    }

    if (includeFirehol) {
      consola.success('FireHOL databases included in scope.');
    } else {
      consola.info('Skipping FireHOL datasets.');
    }

    type Source = typeof sources[number]['value'];
    let selectedSources: Source[] = [];
    const allSourceValues = sources.map(s => s.value);

    const flaggedSources: Source[] = [];
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
        ]
      });

      if (mode === 'all') {
        selectedSources = [...allSourceValues];
      } else {
        selectedSources = await consola.prompt('Select data sources to compile', {
          type: 'multiselect',
          options: sources.map(s => ({
            label: s.label,
            value: s.value,
          }))
        }) as unknown as Source[];
      }
    }

    if (selectedSources.length === 0) {
      consola.error('No data sources selected for compilation. Exiting...');
      process.exit(1);
    }


if (selectedSources.includes('BGP')) {
      if (contactInfo) {
        const validation = isValidUserAgent(contactInfo);
        if (!validation) {
          consola.error(`Invalid --contact flag provided: ${String(validation)}`);
          process.exit(1);
        }

        consola.success('Valid contact info provided via --contact flag. Skipping prompt.');
      } else {
        const bgpAction = await consola.prompt(
          'BGP.tools requires contact information (User-Agent) to prevent API blocking. How would you like to proceed?',
          {
            type: 'select',
            options: [
              { label: 'Provide details', value: 'provide' },
              { label: 'Exclude BGP Data', value: 'exclude' }
            ]
          }
        );

        if (bgpAction === 'provide') {
          contactInfo = await askForUserAgent();
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

    for (const source of selectedSources) {
      consola.start(`Initializing ${source} compiler...`);
      
      
      consola.success(`${source} compilation complete.`);
    }

    consola.success('All selected tasks completed successfully!');
}
});

await runMain(start);