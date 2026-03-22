import child from 'node:child_process';
import util from 'node:util';
import type { ExecOptions } from 'node:child_process';

/**
 * Result returned by {@link run}.
 */
export interface RunResult {
    stdout: string | Buffer;
    stderr: string | Buffer;
}

const execAsync = util.promisify(child.exec);

/**
 * Options accepted by {@link run}. Extends Node.js `ExecOptions` with an
 * optional `silent` flag to suppress console output.
 */
export interface RunOptions extends ExecOptions {
    silent?: boolean;
}

/**
 * Executes a shell command asynchronously and returns its stdout and stderr.
 *
 * @param command - The shell command to execute.
 * @param options - Optional execution settings. Set `silent: true` to suppress
 *   console output.
 * @returns A promise resolving to `{ stdout, stderr }`.
 * @throws If the command exits with a non-zero status.
 */
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