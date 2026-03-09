import { run } from "../utils/run.js";
import * as fs from 'fs';
import type { GlobalCountry, GlobalState, GlobalCity, CityGeoRecord } from "../types/geography.js";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRegExp, exactly } from "magic-regexp";
import { consola } from "consola";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = [
    path.resolve(currentDir, './countries+states+cities.json'),
    path.resolve(currentDir, '../../public/countries+states+cities.json')
].find(p => fs.existsSync(p)) ?? path.resolve(currentDir, './countries+states+cities.json');

const logger = consola.withTag('[CITY/GEO]');

export async function buildCitiesData(outputPath: string, mmdbPath: string) {
    logger.info('\nBuilding global geographic index from hierarchical database...');
    const output = path.resolve(outputPath, 'city.mmdb');
    const tempGeoJson = path.resolve(outputPath, 'temp_city_data.json');
    

    const rawData = fs.readFileSync(dbPath, 'utf8');
    const dbJson = JSON.parse(rawData) as GlobalCountry[];

    const countryIndex = new Map<string, { meta: GlobalCountry, states: Map<string, { meta: GlobalState, cities: Map<string, GlobalCity> }> }>();
    
    for (const country of dbJson) {
        const stateMap = new Map<string, { meta: GlobalState, cities: Map<string, GlobalCity> }>();
        
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (country.states) {
            for (const state of country.states) {
                const cityMap = new Map<string, GlobalCity>();
                
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (state.cities) {
                    for (const city of state.cities) {
                        cityMap.set(city.name.toLowerCase(), city);
                    }
                }
                
                stateMap.set(state.state_code, { meta: state, cities: cityMap });
            }
        }
        
        countryIndex.set(country.iso2.toUpperCase(), { meta: country, states: stateMap });
    }

    try {
        logger.info('Fetching validated geofeed CSV...');

        const res = await fetch('https://geolocatemuch.com/geofeeds/validated-all.csv');
        const csvText = await res.text();
        const lines = csvText.split('\n');
        const commentRegex = createRegExp(exactly('#').at.lineStart());
        
        logger.success(`SUCCESS: Received ${String(lines.length)} IP ranges. Mapping to geographic index...`);
        const results: string[] = [];

        for (const line of lines) {
            if (!line.trim() || commentRegex.test(line)) continue;

            const parts = line.split(',');
            const prefix = parts[0]?.trim() || "";
            const country = parts[1]?.trim() || "";
            const region = parts[2]?.trim() || "";
            const city = parts[3]?.trim() || "";
            const zip = parts[4]?.trim() || "";

            if (!country && !city && !zip) continue;

            const cc = country.toUpperCase() || "";

            let emoji = "";
            let lat = '';
            let lon = '';
            let stateName = '';
            let countryMeta: Partial<GlobalCountry> = {};
            
            const countryData = countryIndex.get(cc);
            if (countryData) {
                countryMeta = countryData.meta;
                emoji = countryData.meta.emoji || "";
                
          
                if (region) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const regionCode = region.includes('-') ? region.split('-').pop()! : region;
                    const stateData = countryData.states.get(regionCode);
                    
                    if (stateData) {
                        stateName = stateData.meta.name || stateData.meta.state_code || "";
                        
                        if (city) {
                            const cityData = stateData.cities.get(city.toLowerCase());
                            if (cityData) {
                                lat = cityData.latitude || "";
                                lon = cityData.longitude || "";
                            }
                        }

                        if (!lat && stateData.meta.latitude && stateData.meta.longitude) {
                            lat = stateData.meta.latitude || "";
                            lon = stateData.meta.longitude || "";
                        }
                    }
                }
                

                if (!lat && city) {
                    for (const [, stateData] of countryData.states) {
                        const cityData = stateData.cities.get(city.toLowerCase());
                        if (cityData) {
                            lat = cityData.latitude || "";
                            lon = cityData.longitude || "";
                            if (!stateName) stateName = stateData.meta.name || stateData.meta.state_code || "";
                            break;
                        }
                    }
                }

                if (!lat && countryMeta.latitude && countryMeta.longitude) {
                    lat = countryMeta.latitude || "";
                    lon = countryMeta.longitude || "";
                }
            }

            const geoRecord: CityGeoRecord = {
                range: prefix,
                country_code: country,
                region: region || (countryMeta.region ?? ""),
                subregion: countryMeta.subregion ?? "",
                city: city,
                zip_code: zip,
                latitude: lat,
                longitude: lon,
                state: stateName,
                name: countryMeta.name ?? "Unknown",
                native: countryMeta.native ?? "",
                phone: countryMeta.phonecode ?? '',
                numericCode: countryMeta.numeric_code ?? "",
                continent: countryMeta.region ?? "",
                capital: countryMeta.capital ?? "",
                currency: countryMeta.currency ?? '',
                currency_name: countryMeta.currency_name ?? "",
                languages: countryMeta.translations ? Object.values(countryMeta.translations)[0] ?? "" : "",
                emoji: emoji,
                timezone: countryMeta.timezones?.[0]?.zoneName ?? "",
                utc_offset: countryMeta.timezones?.[0]?.gmtOffsetName ?? "",
                timeZoneName: countryMeta.timezones?.[0]?.tzName ?? "",
                tld: countryMeta.tld ?? "",
                nationality: countryMeta.nationality ?? "",
            };
            
            results.push(JSON.stringify(geoRecord));
        }
        
        logger.info(`Writing ${String(results.length)} enriched entries to temporary JSON...`);
        fs.writeFileSync(tempGeoJson, results.join('\n'), 'utf-8');

        logger.start('Compiling MMDB with mmdbctl...');
        
        const cmd = `${mmdbPath} import --in ${tempGeoJson} --out ${output}`;
        const convert = await run(cmd);
        if (convert.stdout) logger.log(`mmdbctl: ${convert.stdout.toString().trim()}`);
        logger.success(`COMPLETED: Successfully compiled City MMDB to ${output}\n`);

    } catch (error) {
        logger.error('\nERROR during processing:', error);
        process.exit(1);
    } finally {
        if (fs.existsSync(tempGeoJson)) {
            fs.unlinkSync(tempGeoJson);
        }
    }
}
