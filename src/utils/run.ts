import child from 'node:child_process';
import util from 'node:util';
import type { ExecOptions } from 'node:child_process';

export interface RunResult {
    stdout: string | Buffer;
    stderr: string | Buffer;
}

const execAsync = util.promisify(child.exec);

export interface RunOptions extends ExecOptions {
    silent?: boolean;
}

export const run = async (command: string, options: RunOptions = {}): Promise<RunResult> => {
    try {
        const { stdout, stderr } = await execAsync(command, {
            ...options,
            maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10, 
        });

        const result: RunResult = {
            stdout: typeof stdout === 'string' ? stdout.trim() : stdout,
            stderr: typeof stderr === 'string' ? stderr.trim() : stderr,
        };

        if (!options.silent) {
            console.log(`[run]: ${command}`);
            if (result.stdout) console.log('stdout:', result.stdout);
            if (result.stderr) console.error('stderr:', result.stderr);
        }

        return result;
    } catch (error: unknown) {

        console.error(`Execution failed for command: "${command}"`);
        
        if (typeof error === 'object' && error !== null) {
            const e = error as { stderr?: string; stdout?: string };
            if (e.stderr) console.error('Error Output:', e.stderr);
        }
        
        throw error;
    }
};