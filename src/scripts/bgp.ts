import { createRegExp, exactly, digit, oneOrMore, charNotIn } from "magic-regexp";
import * as fs from 'fs';
import { run } from "../utils/run.js";
import path from "path";
import { AsnDictionaryEntry, BGPRouteRaw, BgpRecord } from "../types/bgp.js";
import { consola } from "consola";

const logger = consola.withTag('[ASN/BGP]');
/**
 * Fetches ASN definitions and the BGP routing table from bgp.tools, merges
 * them into enriched records, and compiles the result into an MMDB database.
 * Output: `<outputPath>/asn.mmdb`.
 *
 * @param userAgent - Contact string required by bgp.tools (format: `<name> [url] - <email>`).
 * @param outputPath - Directory where the compiled `asn.mmdb` will be written.
 * @param mmdbPath - Path to the `mmdbctl` binary, or `"mmdbctl"` if it is on PATH.
 */
export async function getBGPAndASN(userAgent: string, outputPath: string, mmdbPath: string) {
    const urls = ['https://bgp.tools/asns.csv', 'https://bgp.tools/table.jsonl'];
    const output = path.resolve(outputPath, 'asn.mmdb');
    const tempASNJson = path.resolve(outputPath, 'temp_asn_data.json');
    try {
        logger.info("\nFetching ASN Dictionary from BGP.tools...");
        const ansRes = await fetch(urls[0], {
            method: 'GET',
            headers: {
                'User-Agent': userAgent
            }
        });

        // AS1,"Level 3 Parent, LLC",Unknown
        // AS10,CSNET Coordination and Information Center,Unknown

        const rawAsnCsv = await ansRes.text();
        const asnDictionary = new Map<number, AsnDictionaryEntry>();
        const asnLines = rawAsnCsv.split('\n').slice(1);
        
        const regex = createRegExp(exactly('AS').and(oneOrMore(digit).groupedAs('asnNumber')));
        
        const nonQuotes = charNotIn('"').times.any();
        const quotePair = nonQuotes.and(exactly('"')).times(2);
        const splitRegex = createRegExp(
            exactly(',').before(quotePair.times.any().and(nonQuotes).at.lineEnd())
        );

        for (const line of asnLines) {
            if (!line) continue;
            const parts = line.split(splitRegex);

            const match = parts[0].match(regex);
            const asnNumber = match?.groups.asnNumber ? parseInt(match.groups.asnNumber, 10) : null;
            
            const quoteStripRegex = createRegExp(exactly('"').at.lineStart().or(exactly('"').at.lineEnd()), ['g']);
            const asnName = parts[1]?.replace(quoteStripRegex, '').trim() || 'Unknown';
            const asnClass = parts[2]?.trim() || 'Unknown';
            
            if (asnNumber !== null) {
                asnDictionary.set(asnNumber, { name: asnName, type: asnClass });
            }
        }
        logger.success(`SUCCESS: Loaded ${String(asnDictionary.size)} ASN definitions.`);
        logger.info("Fetching Routing Table...");
        const tableRes = await fetch(urls[1], {
            method: 'GET',
            headers: {
                'User-Agent': userAgent
            }
        });

        const rawTable = await tableRes.text();
        logger.info("Mapping CIDR to ASN data...");
        const routes = rawTable.split('\n');
        const results = [];

        for (const route of routes) {
            if (!route) continue;
              // {"CIDR":"1.1.1.0/24","ASN":13335,"Hits":509}
                const parsed = JSON.parse(route) as BGPRouteRaw;
                if (parsed.Hits < 10) continue; 
                
                const dictionaryLookup = asnDictionary.get(parsed.ASN) ?? { name: 'Unknown', type: 'Unknown' };

                const record: BgpRecord = {
                    range: parsed.CIDR,
                    asn_id: String(parsed.ASN),
                    asn_name: dictionaryLookup.name,
                    classification: dictionaryLookup.type,
                    hits: String(parsed.Hits)
                };
                results.push(JSON.stringify(record));
            }

        if (results.length > 0) {
            logger.log('SAMPLE:', results[0]);
        }

        logger.info(`Writing ${String(results.length)} enriched entries to temporary JSON...`);
        fs.writeFileSync(tempASNJson, results.join('\n'), 'utf-8');
        logger.info(`Compiling MMDB with mmdbctl to ${output}...`);
        
        const cmd = `${mmdbPath} import --in ${tempASNJson} --out ${output}`;
        const convert = await run(cmd);

        if (convert.stdout) logger.log(`mmdbctl: ${convert.stdout.toString().trim()}`);
        logger.success(`COMPLETED: Successfully compiled ASN MMDB to ${output}\n`);

    }  catch (error) {
            logger.error(`\nERROR during processing:`, error);
            process.exit(1);
    } finally {
        if (fs.existsSync(tempASNJson)) {
            fs.unlinkSync(tempASNJson);
        }
    }
}
