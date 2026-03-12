import { defineCommand } from "citty";
import { compiler } from "./generalCompiler.js";
import consola from "consola";
import { generateTypeFile } from "./generateTypes.js";
import { ensureMmdbctl } from "../mmdbctlInstaller.js";
import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { InputCache } from "../../types/input.js";
import path from "node:path";
import os from 'node:os';
import { StringOfSources } from "../../types/generalCompiler.js";

export const compileCommand = defineCommand({
  meta: {
    name: 'compile',
    description: 'Generate arbitrary MMDB databases and their associated TypeScript types',
  },

  args: {
    input: { type: 'positional', description: 'Path(s) to JSON data file(s)', required: true },
    outputDir: { type: 'string', description: 'Directory to save the MMDB and Types', required: false, default: './' },
    name: { type: 'string', description: 'Name of the output database', required: true },
    types: { type: 'boolean', description: 'Generate TypeScript types from the data', required: false, default: true },
  },
  
  async run({ args }) {
    consola.start(`Starting general compiler for ${args.name}...`);
    let mmdbPath = '';
    
    const cacheOutput = path.join(os.homedir(), '.shield-base', '.cache.json');
    let cache: Partial<InputCache> = {};

    if (fs.existsSync(cacheOutput)) { 
      const cacheedFile = await readFile(cacheOutput, 'utf-8');
      cache = JSON.parse(cacheedFile) as InputCache;
    }
    
    if (cache.mmdbctlPath) {
      mmdbPath = cache.mmdbctlPath;
    } else {
      consola.start('Verifying system dependencies...');
      mmdbPath = await ensureMmdbctl();
      cache.mmdbctlPath = mmdbPath;
    }

    const inputFiles = args._;

    if (inputFiles.length === 0) {
        consola.error("You must provide at least one input file!");
        process.exit(1);
    }

    const sources: StringOfSources[] = inputFiles.map((a, i) => {
        const name = inputFiles.length === 1 || i === 0 ? args.name : `${args.name}-${String(i)}`;
        return {
            pathToJson: a,
            dataBaseName: name,
            outputPath: args.outputDir
        };
    });

    try {
      await compiler({
        outputPath: args.outputDir,
        dataBaseName: args.name,
        data: sources, 
        mmdbPath: mmdbPath,
        generateTypes: args.types
      });
      
       const cacheDir = path.dirname(cacheOutput);

       if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
       }
      
      await writeFile(cacheOutput, JSON.stringify(cache, null, 2), 'utf-8');
      
      consola.success('Compilation and type generation complete!');
    } catch (error) {
      consola.error('Compiler failed:', error);
      process.exit(1);
    }
  }
});

export const typesCommand = defineCommand({ 
  meta: {
    name: 'Types',
    description: 'Generate types files from a json file',
  },

  args: {
    input: { type: 'positional', description: 'Path to raw JSON data file or a valid json data', required: true },
    name: { type: 'string', description: 'Name of the output file', required: true },
    outputDir: { type: 'string', description: 'Directory to save the Typescript file', required: false, default: './' },
  },

   run({ args }) { 
     const inputFiles = args._;


    if (inputFiles.length === 0) {
        consola.error("You must provide at least one input file!");
        process.exit(1);
    }

    try {
        inputFiles.forEach((input, i) => {
            const name = inputFiles.length === 1 || i === 0 ? args.name : `${args.name}-${String(i)}`;
            generateTypeFile(input, name, args.outputDir);
        });
    } catch (error) {
        consola.error('Failed to generate types:', error);
        process.exit(1);
    }
  }
});
