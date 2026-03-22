import { getBGPAndASN } from "./bgp.js";
import { buildCitiesData } from "./city.js";
import { getTorLists } from "./tor.js";
import { getGeoDatas } from "./geo.js";
import { getListOfProxies } from "./proxy.js";
import { getThreatLists } from "./threats.js";
import consola from "consola";
import { getCrawlersIps } from "./goodBotsScrapper/scrapper.js";
import { getUserAgentList } from "./useragents.js";
import { getDisposableEmailList } from "./disposableEmailList.js";

const logger = consola.withTag('Shield Base');

/**
 * Runs the full Shield-Base data pipeline in parallel, compiling all available
 * sources: BGP/ASN, city, Tor, country, proxies, threat lists, verified
 * crawlers, suspicious user agents, and disposable email domains.
 *
 * @param outputPath - Directory where all compiled databases will be written.
 * @param userAgent - BGP.tools contact string (format: `<name> [url] - <email>`).
 * @param selectedSources - FireHOL source IDs to include, or `true` for all FireHOL lists.
 * @param mmdbPath - Path to the `mmdbctl` binary, or `"mmdbctl"` if it is on PATH.
 */
export async function generateData(outputPath: string, userAgent: string, selectedSources: string[] | boolean, mmdbPath: string) {
    logger.box("\n=========================================\n" +
                " === Starting data generation pipeline === " +
                "\n=========================================\n");
    
    try {

        const results = await Promise.allSettled([
            getBGPAndASN(userAgent, outputPath, mmdbPath),
            buildCitiesData(outputPath, mmdbPath),
            getTorLists(outputPath, mmdbPath),
            getGeoDatas(outputPath, mmdbPath),
            getListOfProxies(outputPath, mmdbPath),
            getThreatLists(outputPath, mmdbPath, selectedSources),
            getCrawlersIps(outputPath, mmdbPath),
            getUserAgentList(outputPath),
            getDisposableEmailList(outputPath)
        ]);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                logger.error(`Script cluster [${String(index)}] failed:`, String(result.reason));
            }
        });
        logger.info("\n====================================\n" +
                     "Pipeline execution finished." +
                     "\n====================================\n");
    } catch (error) {
        logger.error("\n====================================\n" +
                      `Fatal error in pipeline: ${String(error)}` +
                      "\n====================================\n");
    }
}