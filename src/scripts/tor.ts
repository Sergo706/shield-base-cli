/* eslint-disable @typescript-eslint/ban-ts-comment */
import { run } from "../utils/run.js";
import * as fs from 'fs';
import ipaddr from 'ipaddr.js';
import path from "path";
import type { OnionooPayload, TorRecord } from "../types/tor.js";
import consola from "consola";


const logger = consola.withTag('[TOR]');

export async function getTorLists(outputPath: string, mmdbPath: string): Promise<void> {
    const url = 'https://onionoo.torproject.org/details';
    const output = path.resolve(outputPath, 'tor.mmdb');
    const tempFileName = path.resolve(outputPath, 'temp_tor_nodes.json');

try {

    logger.info("\nFetching node data from Onionoo API...");
    const response = await fetch(url, {
    method: 'GET',
    headers: {
        'Accept-Encoding': 'gzip',
        'Accept': 'application/json'
    }

    });



    if (!response.ok) {
        logger.error(`ERROR: API fetch failed with status ${String(response.status)}`);
        return;
    }

    const data = await response.json() as OnionooPayload;
    logger.success('SUCCESS: Data received, mapping relay nodes...');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const rawNodes = data.relays || [];
    const toMap = rawNodes.filter((flags) => {

    const fl = flags.flags?.map(f => f.toLowerCase()) ?? [];
    return fl.includes("exit") ||
        fl.includes("valid") ||
        fl.includes("running") ||
        fl.includes("stable") ||
        fl.includes("hsdir") &&
        flags.exit_addresses &&
        flags.or_addresses;
    });



    if (toMap.length === 0) {
        logger.warn("WARNING: No relay nodes found matching criteria.");
        return;
    }

    const results: TorRecord[] = [];

    for (const node of toMap) {
        const ipsToProcess = [
            // eslint-disable-next-line @typescript-eslint/no-misused-spread
            ...(node.exit_addresses ?? []),
            ...(node.or_addresses ?? [])
        ];

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!ipsToProcess) continue;

    for (const ip of ipsToProcess) {

        let cleanIp = ip;
        if (cleanIp.startsWith('[')) {
            cleanIp = cleanIp.split(']:')[0].substring(1);
         } else {
            cleanIp = cleanIp.split(':')[0];
         }

    const parsedIp = ipaddr.parse(cleanIp);
    let finalNetworkAddress: string;

    if (parsedIp.kind() === 'ipv4') {
        const ipv4 = parsedIp as ipaddr.IPv4;
        const networkAddress = ipaddr.IPv4.networkAddressFromCIDR(`${ipv4.toString()}/24`);
        finalNetworkAddress = `${networkAddress.toString()}/24`;
    } else if (parsedIp.kind() === 'ipv6') {
        const ipv6 = parsedIp as ipaddr.IPv6;
        const networkAddress = ipaddr.IPv6.networkAddressFromCIDR(`${ipv6.toString()}/64`);
        finalNetworkAddress = `${networkAddress.toString()}/64`;
    } else {
        continue;
    }

    results.push({
        range: finalNetworkAddress,
        or_addresses: node.or_addresses?.join(',') ?? '',
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        exit_addresses: node.exit_addresses?.join(',') ?? '',
        last_seen: node.last_seen ?? "",
        last_changed_address_or_port: node.last_changed_address_or_port ?? "",
        first_seen: node.first_seen ?? "",
        running: node.running ?? false,
        flags: node.flags?.join(',') ?? "",
        country: node.country ?? "",
        country_name: node.country_name ?? "",
        as: node.as ?? "",
        as_name: node.as_name ?? "",
        last_restarted: node.last_restarted ?? "",
        exit_policy: node.exit_policy?.join(',') ?? '',
        exit_policy_summary: JSON.stringify(node.exit_policy_summary) || '',
        exit_policy_v6_summary: node.exit_policy_v6_summary ? JSON.stringify(node.exit_policy_v6_summary) : undefined,
        contact: node.contact ?? "Unknown",
        version_status: node.version_status ?? "",
        guard_probability: node.guard_probability ?? 0,
        middle_probability: node.middle_probability ?? 0,
        exit_probability: node.exit_probability ?? 0,
        recommended_version: node.recommended_version ?? false,
        measured: node.measured ?? false,
    });
  }

 }

    logger.info('SAMPLE:', results[0]);
    const ndjsonOutput = results.map(record => JSON.stringify(record)).join('\n');
    fs.writeFileSync(tempFileName, ndjsonOutput, 'utf-8');
    try {
        logger.info('Compiling MMDB with mmdbctl...');
        const convert = await run(`${mmdbPath} import -j -i ${tempFileName} -o ${output}`);
        if (convert.stdout) logger.info(`mmdbctl: ${convert.stdout.toString().trim()}`);

        logger.success(`COMPLETED: Successfully compiled Tor MMDB to ${output}\n`);

    } catch (error) {
        logger.error("ERROR: MMDB compilation failed:", error);
        return;
    }

    } catch (error: unknown) {
        logger.error("ERROR: Unexpected failure while fetching node list:", error);
        return;
    } finally {
        if (fs.existsSync(tempFileName)) {
        fs.unlinkSync(tempFileName);
    }
 
  }

} 