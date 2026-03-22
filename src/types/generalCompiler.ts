/**
 * Input configuration for {@link compiler}.
 */
export interface Input<T> {
    outputPath: string;
    dataBaseName: string;
    data: T[] | StringOfSources[] | string;
    mmdbPath: string;
    generateTypes: boolean;
}

/**
 * Describes a single JSON source file for batch compilation via {@link compiler}.
 */
export interface StringOfSources {
    pathToJson: string,
    dataBaseName: string;
    outputPath: string;
}

/**
 * Normalized representation of a {@link StringOfSources} entry with resolved
 * output file paths. Produced internally by {@link compiler}.
 */
export interface NormalizedSource {
    output: string;
    tempJsonOutput: string;
    pathToJson: string;
    dataBaseName: string;
}
