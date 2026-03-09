import { getBGPAndASN } from "./bgp.js";
import { buildCitiesData } from "./city.js";
import { getTorLists } from "./tor.js";
import { getGeoDatas } from "./geo.js";
import { getListOfProxies } from "./proxy.js";
import { getThreatLists } from "./threats.js";
import consola from "consola";
import { getCrawlersIps } from "./goodBotsScrapper/scrapper.js";

const logger = consola.withTag('Shield Base');

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
            getCrawlersIps(outputPath, mmdbPath)
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