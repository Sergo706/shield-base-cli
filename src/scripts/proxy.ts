import fs from 'node:fs';
import { run } from '@sergo/utils/server';
import { createRegExp, exactly, charNotIn, anyOf, digit, oneOrMore } from 'magic-regexp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import consola from 'consola';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getListOfProxies(outputPath: string) {
    consola.log("\n[PROXY] Fetching initial Proxy list from Awesome-lists...");
    const output = path.resolve(__dirname, `${outputPath}/proxy.mmdb`);
    const tempProxyJson = path.resolve(__dirname, `${outputPath}/temp_proxy_data.json`);

    const seenIps = new Set<string>();
    const results: string[] = [];
    const urls = ['https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/PROXY/ALL_PROXY_Lists.csv', 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/refs/heads/master/firehol_proxies.netset'];
    
    const ipv4Regex = createRegExp(
            exactly(oneOrMore(digit), '.', oneOrMore(digit), '.', oneOrMore(digit), '.', oneOrMore(digit))
             .and(exactly('/', oneOrMore(digit)).optionally()) 
            .at.lineStart().at.lineEnd()
    );

    try {
        const resAwesome = await fetch(urls[0]);
        if (!resAwesome.ok) throw new Error(`[PROXY] ERROR: Failed to fetch awesome list: ${resAwesome.statusText}`);

        const csvText = await resAwesome.text();
        const lines = csvText.split('\n').slice(1);

        const nonQuotes = charNotIn('"').times.any();
        const quotePair = nonQuotes.and(exactly('"')).times(2);
        const splitAwesomeListRegex = createRegExp(
            exactly(',').before(quotePair.times.any().and(nonQuotes).at.lineEnd())
        );

        const stripAwesomeListRegex = createRegExp(
            anyOf(exactly('PROXY_ALL_'), exactly('_list.csv'), exactly('"')), 
            ['g', 'i']
        );



        for (const line of lines) {
            if (!line.trim()) continue;
            
            const [dest_ip, dest_port, metadata_comment] = line.split(splitAwesomeListRegex);

            if (!dest_ip || !ipv4Regex.test(dest_ip)) continue;
            
            if (seenIps.has(dest_ip)) continue;
            seenIps.add(dest_ip);

            const cleanComment = metadata_comment.replace(stripAwesomeListRegex, '').trim();

            const record = {
                range: `${dest_ip}/32`, 
                port: dest_port,
                comment: cleanComment
            };
            
            results.push(JSON.stringify(record));
        }
        
        consola.success(`[PROXY] SUCCESS: Finished Awesome-list. Discovered ${String(results.length)} unique IPs.`);
        consola.log('[PROXY] Fetching secondary data from FireHOL proxy list...');
        const resFirehol = await fetch(urls[1]);

        if (!resFirehol.ok) throw new Error(`[PROXY] ERROR: Failed to fetch FireHOL list: ${resFirehol.statusText}`);
        const textFirehol = await resFirehol.text();
        const fireholLines = textFirehol.split('\n');
        const commentRegex = createRegExp(exactly('#').at.lineStart());
        let fireholCount = 0;


        for (const line of fireholLines) {
            const trimmed = line.trim();
            if (!trimmed || commentRegex.test(trimmed)) continue;

            const ip = trimmed;
            
            if (!ipv4Regex.test(ip)) continue;
            
            if (seenIps.has(ip)) continue;
            seenIps.add(ip);

            const record = {
                range: ip,
                port: 'unknown',
                comment: `Ip from Firehol`
            };

            results.push(JSON.stringify(record));
            fireholCount++;
        }

        consola.success(`[PROXY] SUCCESS: Finished FireHOL. Added ${String(fireholCount)} NEW unique proxies. Total unique: ${String(results.length)}`);

        if (results.length > 0) {
            consola.log('[PROXY] SAMPLE:', results[0]);
        }

        consola.log(`[PROXY] Writing ${String(results.length)} unique proxies to temporary JSON...`);
        fs.writeFileSync(tempProxyJson, results.join('\n'), 'utf-8');
        consola.log('[PROXY] Compiling MMDB with mmdbctl...');

        const cmd = `mmdbctl import --in ${tempProxyJson} --out ${output}`;
        const convert = await run(cmd);
        if (convert.stdout) consola.log(`[PROXY] mmdbctl: ${convert.stdout.toString().trim()}`);
        consola.success(`[PROXY] COMPLETED: Successfully compiled Proxy MMDB to ${output}\n`);


    } catch (error) {
        consola.error('\n[PROXY] ERROR during processing:', error);
        process.exit(1);
    } finally {
        if (fs.existsSync(tempProxyJson)) {
            fs.unlinkSync(tempProxyJson);
        }
    }  
}
