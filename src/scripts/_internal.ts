import path from "path";
import { InputCache as __InputCache } from "../types/input.js";
import os from 'node:os';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import fs from 'node:fs';

export function __cache() {
    const _cacheOutput = path.join(os.homedir(), '.shield-base', '.cache.json');
    const _cacheDir = path.dirname(_cacheOutput);

 const _getCache = async (): Promise<Partial<__InputCache> | undefined> => {

    if (fs.existsSync(_cacheOutput)) {  
        try {
            const cachedFile = await readFile(_cacheOutput, 'utf-8');
            return JSON.parse(cachedFile) as __InputCache;
        } catch(err) {
            console.error(`Error reading cache`, err);
        }
    }
    return undefined;
 };


 const _setCache = async (_data: Partial<__InputCache>) => {

     if (!fs.existsSync(_cacheDir)) {
          fs.mkdirSync(_cacheDir, { recursive: true });
     }
     try {
         await writeFile(_cacheOutput, JSON.stringify(_data, null, 2), 'utf-8');
     } catch(err) {
        console.error(`Error setting cache`, err);
     }

     return;
 };

 const _deleteCache = async (_dataToDelete: Partial<__InputCache>, all?: true) => {
    if (all) {
        if (fs.existsSync(_cacheOutput)) {  
            try {
                await unlink(_cacheOutput);
            } catch(err) {
                console.error(`Error deleting cache`, err);
            }
        }
        return;
    }

    const current = await _getCache();
    if (!current) return;

    const keysToDelete = new Set(Object.keys(_dataToDelete));

    const updated = Object.fromEntries(
        Object.entries(current).filter(([k]) => !keysToDelete.has(k))
    ) as Partial<__InputCache>;

    try {
        await writeFile(_cacheOutput, JSON.stringify(updated, null, 2), 'utf-8');
    } catch(err) {
        console.error(`Error updating cache`, err);
    }
    return;
 };

 return {
    _getCache,
    _setCache,
    _deleteCache,
    _cacheOutput,
    _cacheDir
 };
}

export { ensureMmdbctl as __ensureMmdbctl } from "../utils/mmdbctlInstaller.js";
export { askForUserAgent as __askForUserAgent } from '../utils/userAgentInput.js';
export { restartData as __restartData } from "../utils/restart.js";