export interface Input<T> {
    outputPath: string;
    dataBaseName: string;
    data: T[] | StringOfSources[] | string;
    mmdbPath: string;
    generateTypes: boolean;
}

export interface StringOfSources {
    pathToJson: string,
    dataBaseName: string;
    outputPath: string;
}

export interface NormalizedSource {
    output: string;
    tempJsonOutput: string;
    pathToJson: string;
    dataBaseName: string;
}
