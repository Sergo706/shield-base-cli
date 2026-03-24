import path from "path";
import type { StringOfSources, NormalizedSourceCompiler, LmdbSources } from "../../types/generalCompiler.js";

/**
 * Normalized representation of a {@link StringOfSources} entry for LMDB
 * compilation. Same as {@link NormalizedSourceCompiler} without `tempJsonOutput`,
 * since LMDB doesn't require a temporary JSON intermediate file.
 */
export type NormalizedLmdbSource = Omit<NormalizedSourceCompiler, 'tempJsonOutput'>;

/**
 * Resolves a path string or a {@link StringOfSources} entry to absolute paths.
 *
 * - When `data` is a `string`, it resolves it relative to `process.cwd()`.
 * - When `data` is a {@link StringOfSources}, it resolves all paths and sets
 *   the output extension to `.mdb` (lmdb) or `.mmdb` (mmdb).
 */
export function normalizePaths(data: string): string;
export function normalizePaths(data: StringOfSources, type: 'lmdb'): NormalizedLmdbSource;
export function normalizePaths(data: StringOfSources, type: 'mmdb'): NormalizedSourceCompiler;
export function normalizePaths(data: StringOfSources, type: 'lmdb' | 'mmdb'): NormalizedLmdbSource | NormalizedSourceCompiler;


export function normalizePaths(data: StringOfSources | string, type?: 'lmdb' | 'mmdb'): NormalizedLmdbSource | NormalizedSourceCompiler | string {
    if (typeof data === 'string') {
        return path.resolve(process.cwd(), data);
    }

    if (type === 'lmdb') {
        return {
            output: path.resolve(process.cwd(), data.outputPath, `${data.dataBaseName}.mdb`),
            pathToJson: path.resolve(process.cwd(), data.pathToJson),
            dataBaseName: data.dataBaseName,
        };
    } else {
        return {
            output: path.resolve(process.cwd(), data.outputPath, `${data.dataBaseName}.mmdb`),
            pathToJson: path.resolve(process.cwd(), data.pathToJson),
            tempJsonOutput: path.resolve(process.cwd(), data.outputPath, `temp_json_${data.dataBaseName}.json`),
            dataBaseName: data.dataBaseName,
        };
    }
}

/**
 * Normalizes the `data` field from a compiler input into a resolved form
 * ready for processing, and signals whether the result is a path-based
 * array of {@link StringOfSources} entries.
 *
 * - `'lmdb'` — accepts {@link LmdbSources}, resolves to `NormalizedLmdbSource[]`,
 *   a resolved path string, or a raw record array.
 * - `'mmdb'` — accepts `T[] | StringOfSources[] | string`, resolves to
 *   `NormalizedSourceCompiler[]`, a resolved path string, or a raw record array.
 */
export function resolveInputData<T>(
    type: 'lmdb',
    data: LmdbSources<T>
): { resolved: (T & {key: string})[] | NormalizedLmdbSource[] | string; isPathArray: boolean };

export function resolveInputData<T>(
    type: 'mmdb',
    data: T[] | StringOfSources[] | string
): { resolved: T[] | NormalizedSourceCompiler[] | string; isPathArray: boolean };


export function resolveInputData<T>(
    type: 'lmdb' | 'mmdb',
    data: LmdbSources<T> | T[] | StringOfSources[] | string
): { 
    resolved: (T & {key: string})[] | T[] | NormalizedLmdbSource[] | NormalizedSourceCompiler[] | string;  
    isPathArray: boolean 
} {

    if (typeof data === 'string') {
        return { resolved: path.resolve(process.cwd(), data), isPathArray: false };
    }

    const isStringOfSourcesArray = (arr: unknown[]): arr is StringOfSources[] => {
        return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'pathToJson' in arr[0] && 'dataBaseName' in arr[0];
    };

    if (Array.isArray(data) && isStringOfSourcesArray(data)) {
        if (type === 'lmdb') {
            const normalized = data.map(s => normalizePaths(s, 'lmdb'));
            return { resolved: normalized, isPathArray: true };
        } else {
            const normalized = data.map(s => normalizePaths(s, 'mmdb'));
            return { resolved: normalized, isPathArray: true };
        }
    }

    if (type === 'lmdb') {
        return { resolved: data as (T & {key: string})[], isPathArray: false };
    }

    return { resolved: data as T[], isPathArray: false };
}