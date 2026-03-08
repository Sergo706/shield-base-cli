import fs from 'node:fs';
import { run } from "../utils/run.js";
import { createRegExp, exactly, digit, oneOrMore } from 'magic-regexp';
import path from 'node:path';
import consola from 'consola';




const THREAT_CONFIG = {
    firehol_anonymous: 'https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_anonymous.netset',
    firehol_l1: 'https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level1.netset',
    firehol_l2: 'https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level2.netset',
    firehol_l3: 'https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level3.netset',
    firehol_l4: 'https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level4.netset',
} as const;



export async function getThreatLists(outputPath: string, mmdbPath: string, selectedSources?: string[] | boolean) {

    const maintainerUrl = ' Maintainer: http://iplists.firehol.org/';
    const ipv4Regex = createRegExp(
            exactly(oneOrMore(digit), '.', oneOrMore(digit), '.', oneOrMore(digit), '.', oneOrMore(digit))
             .and(exactly('/', oneOrMore(digit)).optionally()) 
            .at.lineStart().at.lineEnd()
    );
    const commentRegex = createRegExp(exactly('#').at.lineStart());
    let tasks: { id: string, url: string }[] = [];

    if (Array.isArray(selectedSources)) {
        tasks = Object.entries(THREAT_CONFIG)
            .filter(([id]) => selectedSources.includes(id))
            .map(([id, url]) => ({ id, url }));
    } else if (Boolean(selectedSources)) {
        tasks = Object.entries(THREAT_CONFIG).map(([id, url]) => ({ id, url }));
    }
    
    if (tasks.length === 0) {
        consola.info('No valid FireHOL data sources selected. Skipping.');
        return;
    }
    try {
     consola.start(`Initializing fetch for ${String(tasks.length)} FireHOL stream(s)...`);

        const promises = tasks.map(async (task) => {
            const res = await fetch(task.url);
            return { id: task.id, res };
        });

    const resultsSettled = await Promise.allSettled(promises);
    consola.success(`[THREATS] SUCCESS: Fetched ${String(resultsSettled.length)} data streams from FireHOL.`);

    let ipsCount = 0;


    for (const result of resultsSettled) {

        if (result.status === 'rejected') {
            consola.error(`Promise rejected:`, result.reason);
            continue;
        }
        const { id, res } = result.value;
        const finalMsg = `${id} ${maintainerUrl}`;
        const results: string[] = [];
        consola.info(`[THREATS] Processing stream: ${id}...`);
        
        if (!res.ok) {
                consola.error(`Failed fetching ${id}: ${res.statusText}`);
                continue;
            }

            const rawTextData = await res.text();
            const lines = rawTextData.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || commentRegex.test(trimmed)) continue;

                const ip = trimmed;
                if (!ipv4Regex.test(ip)) continue;

                const record = {
                    range: ip,
                    comment: finalMsg
                 };

                 ipsCount++;
                results.push(JSON.stringify(record));
            }

        consola.info(`[THREATS] ${id} summary:`);
        consola.info(`         -> IPs Discovered: ${String(results.length)}`);
        consola.info(`         -> Rolling Total: ${String(ipsCount)}`);
        
        if (results.length > 0) {
            consola.info(`[THREATS] SAMPLE: ${results[0]}`);
            consola.info(`[THREATS] Writing entries to temporary JSON: temp_${id}.json`);
            const jsonName = path.resolve(outputPath, `temp_${id}.json`);
            const output = path.resolve(outputPath, `${id}.mmdb`);

            fs.writeFileSync(jsonName, results.join('\n'), 'utf-8');
            console.log(`[THREATS] Compiling MMDB with mmdbctl to ${output}...`);

            const cmd = `${mmdbPath} import --in ${jsonName} --out ${output}`;
            const convert = await run(cmd);
            if (convert.stdout) consola.box(`[THREATS] mmdbctl: ${convert.stdout.toString().trim()}`);

            if (fs.existsSync(jsonName)) {
                    fs.unlinkSync(jsonName);
            }
            consola.success(`[THREATS] SUCCESS: Compiled ${id}.mmdb\n`);
        } else {
            consola.warn(`[THREATS] WARNING: No valid IPs found for ${id}. Skipping.\n`);
        }
    }
    
    consola.success("[THREATS] COMPLETED: All threat intelligence sources processed successfully.\n");

    } catch (error) {
        consola.error('\n[THREATS] FATAL ERROR during processing:', error);
        process.exit(1);
    }
}