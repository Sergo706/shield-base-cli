import consola from 'consola';
import fs from 'node:fs';
import { normalizePaths, resolveInputData } from '../normalizers.js';
import { lmdbConvertor, DatabaseRecord } from './convertor.js';
import type { LmdbInput } from '../../../types/generalCompiler.js';
import type { NormalizedLmdbSource } from '../normalizers.js';
import path from 'node:path';
import { generateTypeFile } from '../generateTypes.js';

const logger = consola.withTag('LMDB-COMPILER');

/**
 * Compiles data into an LMDB database. Accepts three input forms: a raw
 * object array in memory, a path to a `.json` file, or an array of
 * {@link StringOfSources} for batch processing.
 *
 * Each record must contain a `key` or `id` field this value becomes the
 * LMDB lookup key. Records missing both fields cause a fatal error.
 * Invalid or non-object entries are skipped with a warning.
 *
 * When `generateTypes` is `true`, a TypeScript type definition file is
 * written alongside the database using the first record's shape.
 *
 * Output files:
 * - `<outputPath>/<dataBaseName>.mdb` - the LMDB data file.
 * - `<outputPath>/<dataBaseName>.mdb-lock` - LMDB lock file, generated automatically alongside the database.
 *
 * @param input - Compilation config: data, output path, database name, and if to generate types.
 */
export async function lmdbCompiler<T>(input: LmdbInput<T>): Promise<void> {

    if (!fs.existsSync(normalizePaths(input.outputPath))) {
        logger.info(`Creating output directory: ${input.outputPath}`);
        fs.mkdirSync(normalizePaths(input.outputPath), { recursive: true });
    }

    const { resolved: INPUT_DATA, isPathArray } = resolveInputData<T>('lmdb', input.data);

    if (isPathArray) {
        for (const dataSource of INPUT_DATA as NormalizedLmdbSource[]) {
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
        const arraysOfData = Array.isArray(INPUT_DATA) ? (INPUT_DATA as NormalizedLmdbSource[]) : [INPUT_DATA];

        for (const dataToProcess of arraysOfData) {
            const filePath = typeof dataToProcess === 'string' ? dataToProcess : dataToProcess.pathToJson;
            const data = fs.readFileSync(filePath, 'utf-8');
            const dbJson = JSON.parse(data) as T[];
            const results: DatabaseRecord<T>[] = [];

            if (!Array.isArray(dbJson)) {
                logger.fatal('Data source must be an array of records.');
                process.exit(1);
            }
            

            for (const record of dbJson) {
                if (!record || typeof record !== 'object') {
                    logger.warn(`Skipping invalid or empty record entry: 
                        ${String(record)}
                    `);
                    continue; 
                }

                const item = record as Record<string, unknown>;

                if (!('key' in item) && !('id' in item)) {
                    logger.fatal("Each record must contain at least an 'id' or a 'key' field.");
                    process.exit(1);
                }

                const identifier = (item.key ?? item.id) as string;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { key, id, ...cleanData } = item;

                const recordToInsert: DatabaseRecord<T> = {
                    key: identifier,
                    data: cleanData as T
                };

                results.push(recordToInsert);
            }

            logger.info(`Compiling ${results.length.toString()} records into ${input.dataBaseName}.mdb...`);

            const output = typeof dataToProcess === 'string' ?
                       path.resolve(normalizePaths(input.outputPath), `${input.dataBaseName}.mdb`) :
                       dataToProcess.output;
            
            const name = typeof dataToProcess === 'string' ? 
                                 input.dataBaseName :
                                 dataToProcess.dataBaseName;

            try {
                await lmdbConvertor<T>(output, name, results);

                if (input.generateTypes) {
                    logger.info(`Generating TypeScript definitions for ${name}...`);
                    generateTypeFile(dbJson, name, input.outputPath);
                    logger.success(`Types generated successfully for ${name}`);
                }

            } catch (err) {
                logger.error(`Failed to process ${name}:`, err);
                throw err;
            }
        }
    } else {
        const output = path.resolve(normalizePaths(input.outputPath), `${input.dataBaseName}.mdb`);
        const dbJson = INPUT_DATA as (T & (Record<'key', string> | Record<'id', string>))[];

        if (!Array.isArray(dbJson)) {
            logger.fatal('Data source must be an array of records.');
            process.exit(1);
        }

        const results: DatabaseRecord<T>[] = [];

            for (const record of dbJson) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!record || typeof record !== 'object') {
                    logger.warn(`Skipping invalid or empty record entry: ${String(record)}`);
                    continue; 
                }

                const item = record as Record<string, unknown>;

                if (!('key' in item) && !('id' in item)) {
                    logger.fatal("Each record must contain at least an 'id' or a 'key' field.");
                    process.exit(1);
                }

                const identifier = (item.key ?? item.id) as string;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { key, id, ...cleanData } = item;

                const recordToInsert: DatabaseRecord<T> = {
                    key: identifier,
                    data: cleanData as T
                };

                results.push(recordToInsert);
            }

            logger.info(`Compiling ${results.length.toString()} records into ${input.dataBaseName}.mdb...`);

        try {
            await lmdbConvertor<T>(output, input.dataBaseName, results);
            logger.success(`Compilation complete for ${input.dataBaseName}`);

            if (input.generateTypes) {
                logger.info(`Generating TypeScript definitions for ${input.dataBaseName}...`);
                generateTypeFile(dbJson, input.dataBaseName, input.outputPath);
                logger.success(`Types generated successfully for ${input.dataBaseName}`);
            }
            
        } catch (err) {
            logger.error(`Failed to process ${input.dataBaseName}:`, err);
            throw err;
        }
    }
}