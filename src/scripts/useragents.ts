import consola from "consola";
import * as path from "path";
import { downloadFile } from "../utils/fileDownloader.js";
import { charNotIn, createRegExp, exactly } from "magic-regexp";
import { Severity, Usage, UserAgentRecord } from "../types/useragent.js";
import { DatabaseRecord, lmdbConvertor } from "../utils/generalCompiler/lmdbCompiler/convertor.js";


const logger = consola.withTag('[USERAGENT]');

/**
 * Downloads the suspicious HTTP user-agent CSV list from mthcht/awesome-lists
 * and saves it to disk.
 * Output: `<outputPath>/useragent.csv`.
 *
 * @param outputPath - Directory where `useragent.csv` will be written.
 */
export async function getUserAgentList(outputPath: string): Promise<void> {
    const output = path.resolve(outputPath, 'useragent.csv');

    logger.start('Fetching useragent list...');
    const url = 'https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/suspicious_http_user_agents_list.csv';
    try {
        await downloadFile(output, url);           
    } catch (err) {
        throw err;
    }
}

/**
 * Fetches the suspicious HTTP user-agent CSV list from mthcht/awesome-lists,
 * cleans each entry, and compiles it into an LMDB database for fast
 * per-request lookups.
 *
 * Each user-agent pattern has its regex special characters escaped and
 * wildcard `*` characters converted to `.*` so the stored value can be
 * used directly as a regex pattern against incoming request user-agents.
 * The raw user-agent string is used as the key.
 *
 * Output files:
 * - `<outputPath>/useragent-db/useragent.mdb` — the LMDB data file.
 * - `<outputPath>/useragent-db/useragent.mdb-lock` — LMDB lock file, generated automatically alongside the database.
 *
 * @param outputPath - Base directory where `useragent-db/useragent.mdb` will be written.
 */
export async function getUserAgentLmdbList(outputPath: string): Promise<void> {
    const output = path.resolve(process.cwd(), outputPath, 'useragent-db', 'useragent.mdb');
    logger.start('Fetching useragent list...');
    const url = 'https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/suspicious_http_user_agents_list.csv';
    const maintainer = 'https://github.com/mthcht/awesome-lists';

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`ERROR: Failed to fetch country data: ${res.statusText}`);
        }
        const csvText = await res.text();
        const lines = csvText.split('\n').slice(1);

        logger.success(`SUCCESS: Received ${String(lines.length)} user agents. Cleaning data...`);
        const results: DatabaseRecord<UserAgentRecord>[] = [];
        
        const nonQuotes = charNotIn('"').times.any();
        const quotePair = nonQuotes.and(exactly('"')).times(2);
        const splitRegex = createRegExp(
            exactly(',').before(quotePair.times.any().and(nonQuotes).at.lineEnd())
        );

        const makeBool = (val: string): boolean | null => val === 'yes' ? true : val === 'no' ? false : null;
        const cleanUa = (ua: string): string =>
            ua.split('*')
                .map(s => createRegExp(exactly(s)).source)
                .join('.*');

        for (const line of lines) {
            if (!line.trim()) continue;
            const [
                http_user_agent, 
                metadata_description, 
                metadata_tool,
                metadata_category,
                metadata_link,
                metadata_priority,
                metadata_fp_risk,
                metadata_severity,
                metadata_usage,
                metadata_flow_from_external,
                metadata_flow_from_internal,
                metadata_flow_to_internal,
                metadata_flow_to_external,
                metadata_for_successful_external_login_events,
                metadata_comment
            ] = line.split(splitRegex);

            if (!http_user_agent) continue;

            const record: DatabaseRecord<UserAgentRecord> = {
                key: http_user_agent,
                data: {
                    useragent_rx: cleanUa(http_user_agent),
                    metadata_description,
                    metadata_tool,
                    metadata_category,
                    metadata_link,
                    metadata_priority: metadata_priority as Severity,
                    metadata_fp_risk: metadata_fp_risk as Severity,
                    metadata_severity: metadata_severity as Severity,
                    metadata_usage: metadata_usage as Usage,
                    metadata_flow_from_external: makeBool(metadata_flow_from_external),
                    metadata_flow_from_internal: makeBool(metadata_flow_from_internal),
                    metadata_flow_to_internal: makeBool(metadata_flow_to_internal),
                    metadata_flow_to_external: makeBool(metadata_flow_to_external),
                    metadata_for_successful_external_login_events: makeBool(metadata_for_successful_external_login_events),
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    metadata_comment: metadata_comment ?? 'N/A',
                    date: new Date().toISOString(),
                    comment: `Data maintained by ${maintainer}, transformed by Shield-base`
                }
            };
            results.push(record);
        }
        logger.info('Data sample:', results[0]);
        logger.success(`SUCCESS: Finished Cleaning. Discovered ${String(results.length)} unique records, Compiling...`);
        await lmdbConvertor<UserAgentRecord>(output, 'useragent', results);
        logger.success(`COMPLETED: Successfully compiled Useragents data, into LMDB database, to ${output}\n`);

    } catch(err: unknown) {
        logger.error('\nERROR during processing:', err);
        process.exit(1);
    }
}
