import { run } from "../utils/run.js";
import * as fs from 'fs';
import * as path from "path";
import { fileURLToPath } from "url";
import type { GlobalCountry, GeoRecord } from "../types/geography.js";
import consola from "consola";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, './countries+states+cities.json');

export async function getGeoDatas(outputPath: string, mmdbPath: string) {
    consola.info("\n[GEO/COUNTRY] Building country index from local database...");

    const output = path.resolve(__dirname, `${outputPath}/country.mmdb`);
    const tempGeoJson = path.resolve(__dirname, `${outputPath}/temp_country_data.json`);
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const dbJson = JSON.parse(rawData) as GlobalCountry[];

    const countryIndex = new Map<string, GlobalCountry>();
    for (const country of dbJson) {
        countryIndex.set(country.iso2.toUpperCase(), country);
    }

    consola.info('[GEO/COUNTRY] Fetching global IPv4 Country mapping from Sapics...');
    const url = 'https://raw.githubusercontent.com/sapics/ip-location-db/refs/heads/main/geo-asn-country/geo-asn-country-ipv4.csv';

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`[GEO/COUNTRY] ERROR: Failed to fetch country data: ${res.statusText}`);
        }

        const csvText = await res.text();
        const lines = csvText.split('\n');
        
        consola.success(`[GEO/COUNTRY] SUCCESS: Received ${String(lines.length)} global IP ranges. Enriching data...`);
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

        consola.info(`[GEO/COUNTRY] Writing ${String(results.length)} enriched entries to temporary JSON...`);
        fs.writeFileSync(tempGeoJson, results.join('\n'), 'utf-8');

        consola.start('[GEO/COUNTRY] Compiling MMDB with mmdbctl...');

        const cmd = `${mmdbPath} import --in ${tempGeoJson} --out ${output}`;
        const convert = await run(cmd);
        
        if (convert.stdout) consola.log(`[GEO/COUNTRY] mmdbctl: ${convert.stdout.toString().trim()}`);
        consola.success(`[GEO/COUNTRY] COMPLETED: Successfully compiled Country MMDB to ${output}\n`);

    } catch (error) {
        consola.error('\n[GEO/COUNTRY] ERROR during processing:', error);
        process.exit(1);
    } finally {
         if (fs.existsSync(tempGeoJson)) {
            fs.unlinkSync(tempGeoJson);
        }
    }
}
