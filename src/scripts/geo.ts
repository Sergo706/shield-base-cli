import { run } from "../utils/run.js";
import * as fs from 'fs';
import * as path from "path";
import { fileURLToPath } from "url";
import type { GlobalCountry, GeoRecord } from "../types/geography.js";
import consola from "consola";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = [
    path.resolve(currentDir, './countries+states+cities.json'),
    path.resolve(currentDir, '../../public/countries+states+cities.json')
].find(p => fs.existsSync(p)) ?? path.resolve(currentDir, './countries+states+cities.json');

const logger = consola.withTag('[GEO/COUNTRY]');

/**
 * Fetches global IPv4-to-country mappings from Sapics and enriches each range
 * with country metadata (name, currency, timezone, etc.) from a local database.
 * Output: `<outputPath>/country.mmdb`.
 *
 * @param outputPath - Directory where the compiled `country.mmdb` will be written.
 * @param mmdbPath - Path to the `mmdbctl` binary, or `"mmdbctl"` if it is on PATH.
 */
export async function getGeoDatas(outputPath: string, mmdbPath: string) {
    logger.info("\nBuilding country index from local database...");

    const output = path.resolve(outputPath, 'country.mmdb');
    const tempGeoJson = path.resolve(outputPath, 'temp_country_data.json');
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const dbJson = JSON.parse(rawData) as GlobalCountry[];

    const countryIndex = new Map<string, GlobalCountry>();
    for (const country of dbJson) {
        countryIndex.set(country.iso2.toUpperCase(), country);
    }

    logger.info('Fetching global IPv4 Country mapping from Sapics...');
    const url = 'https://raw.githubusercontent.com/sapics/ip-location-db/refs/heads/main/geo-asn-country/geo-asn-country-ipv4.csv';

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`ERROR: Failed to fetch country data: ${res.statusText}`);
        }

        const csvText = await res.text();
        const lines = csvText.split('\n');
        
        logger.success(`SUCCESS: Received ${String(lines.length)} global IP ranges. Enriching data...`);
        const results: string[] = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split(',');
            const start = parts[0]?.trim();
            const end = parts[1]?.trim();
            const cc = parts[2]?.trim().toUpperCase();
            
            if (!start || !end || !cc) continue;

            const countryMeta = countryIndex.get(cc);

            const record: GeoRecord = {
                range: `${start}-${end}`,
                country_code: cc,
                region: countryMeta?.region ?? '',
                numericCode: countryMeta?.numeric_code ?? "",
                name: countryMeta?.name ?? "",
                native: countryMeta?.native ?? "",
                phone: countryMeta?.phonecode ?? "",
                capital: countryMeta?.capital ?? "",
                currency: countryMeta?.currency ?? "",
                currency_name: countryMeta?.currency_name ?? "",
                currency_symbol: countryMeta?.currency_symbol ?? "",
                iso639: countryMeta?.iso639 ?? '',
                languages: countryMeta?.translations ? Object.values(countryMeta.translations)[0] ?? "" : "",
                emoji: countryMeta?.emoji ?? "",
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                timezone: countryMeta?.timezones?.[0]?.zoneName ?? "",
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                utc_offset: countryMeta?.timezones?.[0]?.gmtOffsetName ?? "",
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                timeZoneName: countryMeta?.timezones?.[0]?.tzName ?? "",
                tld: countryMeta?.tld ?? "",
                nationality: countryMeta?.nationality ?? "",
                subregion: countryMeta?.subregion ?? ""
            };

            results.push(JSON.stringify(record));
        }

        logger.info(`Writing ${String(results.length)} enriched entries to temporary JSON...`);
        fs.writeFileSync(tempGeoJson, results.join('\n'), 'utf-8');

        logger.start('Compiling MMDB with mmdbctl...');

        const cmd = `${mmdbPath} import --in ${tempGeoJson} --out ${output}`;
        const convert = await run(cmd);
        
        if (convert.stdout) logger.log(`mmdbctl: ${convert.stdout.toString().trim()}`);
        logger.success(`COMPLETED: Successfully compiled Country MMDB to ${output}\n`);

    } catch (error) {
        logger.error('\nERROR during processing:', error);
        process.exit(1);
    } finally {
         if (fs.existsSync(tempGeoJson)) {
            fs.unlinkSync(tempGeoJson);
        }
    }
}
