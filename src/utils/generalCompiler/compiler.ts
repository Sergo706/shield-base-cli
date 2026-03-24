import { mmdbCompiler } from "./mmdbCompiler/generalCompiler.js";
import { lmdbCompiler } from "./lmdbCompiler/generalCompiler.js";
import { Input, LmdbInput } from "../../types/generalCompiler.js";

export type CompilerOptions<T> = 
    | { type: 'lmdb'; input: LmdbInput<T> }
    | { type: 'mmdb'; input: Input<T> };

export async function compiler<T>(options: CompilerOptions<T>): Promise<void>  {
    if (options.type === 'lmdb') {
        await lmdbCompiler(options.input);
        return; 
    } else {
        await mmdbCompiler(options.input);
        return;
    }
}