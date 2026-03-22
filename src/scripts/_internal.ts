import path from "path";
import { InputCache as __InputCache } from "../types/input.js";
import os from 'node:os';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import fs from 'node:fs';

export function __cache() {
    const _cacheOutput = path.join(os.homedir(), '.shield-base', '.cache.json');
    const _cacheDir = path.dirname(_cacheOutput);

 const _getCache = async (): Promise<Partial<__InputCache> | undefined> => {
     const cachedFile = await readFile(_cacheOutput, 'utf-8');
     return await JSON.parse(cachedFile) as __InputCache;
 };

 const _setCache = async (_data: Partial<__InputCache>) => {

     if (!fs.existsSync(_cacheDir)) {
          fs.mkdirSync(_cacheDir, { recursive: true });
     }

     await writeFile(_cacheOutput, JSON.stringify(_data, null, 2), 'utf-8');
     return;
 };

 const _deleteCache = async (_dataToDelete: Partial<__InputCache>, all?: true) => {
    if (all) {
        await unlink(_cacheOutput);
        return;
    }

    const current = await _getCache();
    if (!current) return;

    const keysToDelete = new Set(Object.keys(_dataToDelete));

    const updated = Object.fromEntries(
        Object.entries(current).filter(([k]) => !keysToDelete.has(k))
    ) as Partial<__InputCache>;

    await writeFile(_cacheOutput, JSON.stringify(updated, null, 2), 'utf-8');
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