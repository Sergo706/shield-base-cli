import path from 'node:path';
import consola from 'consola';
import fs from 'node:fs';
import { normalizePaths, resolveInputData } from '../normalizers.js';
import { convertor } from './convertor.js';
import { generateTypeFile } from '../generateTypes.js';
import type { Input, NormalizedSourceCompiler } from '../../../types/generalCompiler.js';

const logger = consola.withTag('COMPILER');


/**
 * Compiles JSON data into one or more MMDB databases via `mmdbctl`. Accepts
 * three input forms: a raw object array in memory, a path to a `.json` file,
 * or an array of {@link StringOfSources} for batch processing.
 *
 * Every record in the data must contain a `range` field with an IPv4/IPv6
 * address or CIDR range.
 *
 * @param input - Compilation config: data, output path, database name,
 *   mmdbctl path, and whether to generate TypeScript types.
 */
export async function mmdbCompiler<T>(input: Input<T>): Promise<void> {

    if (!fs.existsSync(normalizePaths(input.outputPath))) {
            logger.info(`Creating output directory: ${input.outputPath}`);
            fs.mkdirSync(normalizePaths(input.outputPath), { recursive: true });
    }
    
    const { resolved: INPUT_DATA, isPathArray } = resolveInputData<T>('mmdb', input.data);

    if (isPathArray) {
        for (const dataSource of INPUT_DATA as NormalizedSourceCompiler[]) {
            if (!fs.existsSync(dataSource.pathToJson)) {
                logger.fatal(`Couldn't find ${dataSource.pathToJson} does it exists?`);
                process.exit(1);
            }
        }
    } else if (typeof INPUT_DATA === 'string') {
        if (!fs.existsSync(INPUT_DATA)) {
            logger.fatal(`Couldn't find ${INPUT_DATA} does it exists?`);
            process.exit(1);
        }
    }

    if (typeof INPUT_DATA === 'string' || isPathArray) {
        logger.info('Processing data from file(s)...');
        const arraysOfData = Array.isArray(INPUT_DATA) ? (INPUT_DATA as NormalizedSourceCompiler[]) : [INPUT_DATA];

        for (const dataToProcess of arraysOfData) {
                const paths = typeof dataToProcess === 'string' ? dataToProcess : dataToProcess.pathToJson;
                const data = fs.readFileSync(paths, 'utf-8');
                const dbJson = JSON.parse(data) as T[];

                if (!Array.isArray(dbJson)) {
                    logger.fatal("Data source must be an array of records.");
                    process.exit(1);
                }

                const results: string[] = [];

                for (const record of dbJson) {
                    if (!('range' in (record as object))) {
                        logger.fatal("Each record in the array must contain a 'range' field.");
                        process.exit(1);
                     }

                      const recordsToInsert: T = { ...record };
                      results.push(JSON.stringify(recordsToInsert));
                }

                logger.info(`Compiling ${results.length.toString()} records into ${input.dataBaseName}.mmdb...`);
                
                const tempJson = typeof dataToProcess === 'string' ? 
                      path.resolve(normalizePaths(input.outputPath), `temp_json_${input.dataBaseName}.json`) :
                      dataToProcess.tempJsonOutput;

                const output = typeof dataToProcess === 'string' ? 
                      path.resolve(normalizePaths(input.outputPath), `${input.dataBaseName}.mmdb`) :
                      dataToProcess.output;

                const name = typeof dataToProcess === 'string' ? 
                     input.dataBaseName :
                     dataToProcess.dataBaseName;

                try {
                    await convertor(output, input.mmdbPath, tempJson, results);
                    if (input.generateTypes) {
                         logger.info(`Generating TypeScript definitions for ${name}...`);
                         generateTypeFile(dbJson, name, input.outputPath);
                         logger.success(`Types generated successfully for ${name}`);
                    }
                } catch (err) {
                    logger.error(`Failed to process ${name}:`, err);
                    throw err;
                } finally {
                    if (fs.existsSync(tempJson)) {
                        fs.unlinkSync(tempJson);
                    }
                 }
        }
    } else {
        const output = path.resolve(normalizePaths(input.outputPath), `${input.dataBaseName}.mmdb`);
        const tempJson = path.resolve(normalizePaths(input.outputPath), `temp_json_${input.dataBaseName}.json`);
        const dbJson = INPUT_DATA as T[];

        if (!Array.isArray(dbJson)) {
            logger.fatal("Data source must be an array of records.");
            process.exit(1);
        }

        const results: string[] = [];

        for (const record of dbJson) {

            if (!('range' in (record as object))) {
                logger.fatal("Each record in the array must contain a 'range' field.");
                process.exit(1);
             }

              const recordsToInsert: T = { ...record };
              results.push(JSON.stringify(recordsToInsert));
        }
         try {
            logger.info(`Processing raw records for ${input.dataBaseName}...`);
            await convertor(output, input.mmdbPath, tempJson, results);
                if (input.generateTypes) {
                    logger.info(`Generating TypeScript definitions for ${input.dataBaseName}...`);
                    generateTypeFile(dbJson, input.dataBaseName, input.outputPath);
                    logger.success(`Types generated successfully for ${input.dataBaseName}`);
            }
            logger.success(`Compilation complete for ${input.dataBaseName}`);
            return;
        } catch (err) {
            logger.error(`Failed to process ${input.dataBaseName}:`, err);
            throw err;
        } finally {
             if (fs.existsSync(tempJson)) {
                 fs.unlinkSync(tempJson);
             }
        }
    }
    return;
}
