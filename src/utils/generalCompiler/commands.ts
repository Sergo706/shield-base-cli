import { defineCommand } from "citty";
import consola from "consola";
import { generateTypeFile } from "./generateTypes.js";
import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { InputCache } from "../../types/input.js";
import path from "node:path";
import os from 'node:os';
import { ensureMmdbctl } from "../mmdbctlInstaller.js";
import { StringOfSources } from "../../types/generalCompiler.js";
import { compiler, CompilerOptions } from "./compiler.js";



export const generalCompiler = defineCommand({
    meta: {
        name: 'Compiler',
        description: 'Generate arbitrary MMDB/LMDB databases and their associated TypeScript types'
    },

    args: {
        type: { type: 'enum', description: 'The compiler to use', options: ['lmdb', 'mmdb'], required: true, valueHint: 'mmdb' },
        input: { type: 'positional', description: 'Path(s) to JSON data file(s)', required: true },
        outputDir: { type: 'string', description: 'Directory to save the database files and Types', required: false, default: './' },
        name: { type: 'string', description: 'Name of the output databases and types', required: true, valueHint: 'myDb' },
        types: { type: 'boolean', description: 'Generate TypeScript types from the data', required: false, default: true },
    },


    async run({ args }) { 
        consola.start(`Starting general compiler for ${args.name}...`);
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

        let options: CompilerOptions<unknown>;

        if (args.type === 'lmdb') {
           options = {
            type: 'lmdb',
            input: {
                outputPath: args.outputDir,
                dataBaseName: args.name,
                generateTypes: args.types,
                data: sources,
            }
        };
            await compiler(options);
            
        } else {
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

                options = {
                    type: 'mmdb',
                    input: {
                        outputPath: args.outputDir,
                        dataBaseName: args.name,
                        generateTypes: args.types,
                        data: sources,
                        mmdbPath
                    }
               };

              try {
                 await compiler(options);
                 const cacheDir = path.dirname(cacheOutput);

                 if (!fs.existsSync(cacheDir)) {
                         fs.mkdirSync(cacheDir, { recursive: true });
                 }
                 
                 await writeFile(cacheOutput, JSON.stringify(cache, null, 2), 'utf-8');

              } catch (error) {
                    consola.error('Compiler failed:', error);
                    process.exit(1);
                }
        }

        consola.success(`Compilation and type generation complete!
            You can view your data at ${args.outputDir}
        `);
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
