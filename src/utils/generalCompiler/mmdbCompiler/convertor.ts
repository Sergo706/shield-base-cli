import consola from "consola";
import { run } from "../../run.js";
import fs from 'node:fs';

export async function convertor(output: string, mmdbPath: string, tempJsonPath: string, results: string[]): Promise<void> {
    try {
       fs.writeFileSync(tempJsonPath, results.join('\n'), 'utf-8');

        const cmd = `${mmdbPath} import --in ${tempJsonPath} --out ${output}`;
        const convert = await run(cmd);    
        if (convert.stdout) consola.log(`mmdbctl: ${convert.stdout.toString().trim()}`);
    } catch (err) {
        throw err;
    }
}