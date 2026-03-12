import path from "path";
import type { StringOfSources, NormalizedSource } from "../../types/generalCompiler.js";

export function normalizePaths(data: string): string;
export function normalizePaths(data: StringOfSources): NormalizedSource;

export function normalizePaths(data: StringOfSources| string): NormalizedSource | string {
    if (typeof data === 'string') {
        return path.resolve(process.cwd(), data);
    }
    else {
        return {
            output: path.resolve(process.cwd(), data.outputPath, `${data.dataBaseName}.mmdb`),
            tempJsonOutput: path.resolve(process.cwd(), data.outputPath, `temp_json_${data.dataBaseName}.json`),
            pathToJson: path.resolve(process.cwd(), data.pathToJson),
            dataBaseName: data.dataBaseName,
        };
    }
}
