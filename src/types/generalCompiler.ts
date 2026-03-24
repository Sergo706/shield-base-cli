import { DatabaseRecord } from "../utils/generalCompiler/lmdbCompiler/convertor.js";

/**
 * Input configuration for {@link mmdbCompiler}.
 */
export interface Input<T> {
    outputPath: string;
    dataBaseName: string;
    data: T[] | StringOfSources[] | string;
    mmdbPath: string;
    generateTypes: boolean;
}

/**
 * Union of all data shapes accepted by {@link lmdbCompiler}. Supports
 * pre-keyed records, raw objects with a `key` or `id` field, batch file
 * sources, or a single path to a JSON file.
 */
export type LmdbSources<T> = DatabaseRecord<T>[] | StringOfSources[] | string | (T & {key: string})[];

/**
 * Input configuration for {@link lmdbCompiler}. Same as {@link Input} but
 * without `mmdbPath`, which is MMDB-specific. Each record in `data` must
 * contain a `key` or `id` field used as the LMDB lookup key.
 */
export type LmdbInput<T> = Omit<Input<T>, 'mmdbPath'> & {
    data: LmdbSources<T>;
};

/**
 * Describes a single JSON source file for batch compilation via
 * {@link mmdbCompiler} or {@link lmdbCompiler}.
 */
export interface StringOfSources {
    pathToJson: string,
    dataBaseName: string;
    outputPath: string;
}

/**
 * Normalized representation of a {@link StringOfSources} entry with resolved
 * absolute output file paths. Produced internally by {@link mmdbCompiler}.
 */
export interface NormalizedSourceCompiler {
    output: string;
    tempJsonOutput: string;
    pathToJson: string;
    dataBaseName: string;
}