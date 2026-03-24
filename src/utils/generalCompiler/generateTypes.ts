/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import JsonToTS from "@riavzon/json-to-ts";
import { normalizePaths } from "./normalizers.js";
import fs from 'node:fs';
import path from 'node:path';
import consola from 'consola';

const logger = consola.withTag('TYPE-GEN');

/**
 * Generates TypeScript type definitions from a JSON source and writes them to
 * a `.ts` file. The source can be an in-memory object/array, a raw JSON
 * string, or a path to a `.json` file.
 *
 * @param jsonSource - The JSON data to derive types from.
 * @param name - Base name for the root interface and output file
 *   (for example, `"MyDb"` → `mydbTypes.ts`).
 * @param outPutPath - Directory where the generated type file will be written.
 */
export function generateTypeFile(jsonSource: unknown, name: string, outPutPath: string): void {
let parsedJson;

    if (typeof jsonSource === 'object' && jsonSource !== null) {
        logger.info(`Processing direct JSON object for ${name}...`);
        parsedJson = jsonSource;
    } 
    else if (typeof jsonSource === 'string') {
        try {
            parsedJson = JSON.parse(jsonSource);
            logger.info(`Processing JSON string for ${name}...`);
        } catch {
            try {
                const fileContent = fs.readFileSync(jsonSource, 'utf-8');
                logger.info(`Reading JSON from file: ${jsonSource}`);
                parsedJson = JSON.parse(fileContent);
            } catch {
                throw new Error(`Failed to parse as JSON, and failed to read/parse as file path: ${jsonSource}`);
            }
        }
    } 
    else {
        throw new Error('jsonSource must be a JSON object, a JSON string, or a valid file path.');
    }
    
    const pathDir = normalizePaths(outPutPath);
    const typeDefinitions: string[] = JsonToTS(parsedJson, {
        rootName: name,
        useTypeAlias: false
    });

    const fileContent = typeDefinitions.join('\n\n');
    const fileName = `${name.toLowerCase()}Types.ts`;
    const fullPath = path.join(pathDir, fileName);

    fs.writeFileSync(fullPath, fileContent, 'utf-8');
    logger.success(`Type definitions for ${name} written to ${fullPath}`);
}