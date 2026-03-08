import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { consola } from 'consola';
import { execSync } from 'node:child_process';
import * as tar from 'tar';
import extractZip from 'extract-zip';

const VERSION = '1.4.8';
const LOCAL_BIN_DIR = path.join(os.homedir(), '.shield-base', 'bin');

function getTargetPlatform(): { plat: string; ext: string; isWindows: boolean } {
    const platform = os.platform();
    const arch = os.arch();

    let osName = '';
    let archName = '';
    let ext = '.tar.gz';
    let isWindows = false;

    if (platform === 'darwin') osName = 'darwin';
    else if (platform === 'linux') osName = 'linux';
    else if (platform === 'win32') {
        osName = 'windows';
        ext = '.zip';
        isWindows = true;
    } else throw new Error(`Unsupported OS: ${platform}`);

    if (arch === 'x64') archName = 'amd64';
    else if (arch === 'arm64') archName = 'arm64';
    else if (arch === 'ia32') archName = '386';
    else if (arch === 'arm') archName = 'arm';
    else throw new Error(`Unsupported Architecture: ${arch}`);

    return { plat: `${osName}_${archName}`, ext, isWindows };
}


export async function ensureMmdbctl(): Promise<string> {
    const { plat, ext, isWindows } = getTargetPlatform();
    const binaryName = isWindows ? 'mmdbctl.exe' : 'mmdbctl';
    const localBinaryPath = path.join(LOCAL_BIN_DIR, binaryName);

    try {
        execSync('mmdbctl --help', { stdio: 'ignore' });
        return 'mmdbctl';
    } catch {
 
    }

    if (fs.existsSync(localBinaryPath)) {
        return localBinaryPath;
    }

    consola.warn('The required engine "mmdbctl" is missing from your system.');
    const consent = await consola.prompt(
        'Would you like Shield-Base to automatically download and configure it locally?', 
        { type: 'confirm', initial: true }
    );

    if (!consent) {
        consola.error('Cannot proceed without mmdbctl. Exiting...');
        process.exit(1);
    }

    fs.mkdirSync(LOCAL_BIN_DIR, { recursive: true });
    
    const fileName = `mmdbctl_${VERSION}_${plat}`;
    const url = `https://github.com/ipinfo/mmdbctl/releases/download/mmdbctl-${VERSION}/${fileName}${ext}`;
    const archivePath = path.join(LOCAL_BIN_DIR, `${fileName}${ext}`);

    consola.start(`Downloading mmdbctl v${VERSION} for ${plat}...`);
    
    try {
        const response = await fetch(url);
        if (!response.ok || !response.body) throw new Error(`Failed to fetch: ${response.statusText}`);
        
        const fileStream = fs.createWriteStream(archivePath);
        await pipeline(response.body, fileStream);
        consola.success('Download complete. Extracting...');

        if (isWindows) {
            await extractZip(archivePath, { dir: LOCAL_BIN_DIR });
        } else {
            await tar.x({
                file: archivePath,
                cwd: LOCAL_BIN_DIR
            });
        }


        const extractedFiles = fs.readdirSync(LOCAL_BIN_DIR);
        const extractedBinary = extractedFiles.find(f => f.includes('mmdbctl') && f !== `${fileName}${ext}`);

        if (extractedBinary && extractedBinary !== binaryName) {
            fs.renameSync(
                path.join(LOCAL_BIN_DIR, extractedBinary), 
                localBinaryPath
            );
        }

        fs.unlinkSync(archivePath);
        
        if (!isWindows) {
            fs.chmodSync(localBinaryPath, 0o755);
        }

        consola.success('mmdbctl engine successfully installed locally!');
        return localBinaryPath;

    } catch (error) {
        consola.error('Failed to install mmdbctl automatically:', error);
        process.exit(1);
    }
}