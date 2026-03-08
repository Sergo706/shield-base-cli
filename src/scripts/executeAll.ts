import { getBGPAndASN } from "./bgp.js";
import { buildCitiesData } from "./city.js";
import { getTorLists } from "./tor.js";
import { getGeoDatas } from "./geo.js";
import { getListOfProxies } from "./proxy.js";
import { getThreatLists } from "./threats.js";
import fs from 'node:fs';
import path from "path";
import consola from "consola";


export async function generateData(outputPath: string, userAgent: string, selectedSources: string[] | boolean, mmdbPath: string) {
    consola.box("\n=========================================\n" +
                " === Starting data generation pipeline === " +
                "\n=========================================\n");

    const threatsPath = path.resolve(outputPath, 'threats-lists');
    
    if (!fs.existsSync(threatsPath)) {
        fs.mkdirSync(threatsPath, { recursive: true });
    }
    
    try {

        const results = await Promise.allSettled([
            getBGPAndASN(userAgent, outputPath, mmdbPath),
            buildCitiesData(outputPath, mmdbPath),
            getTorLists(outputPath, mmdbPath),
            getGeoDatas(outputPath, mmdbPath),
            getListOfProxies(outputPath, mmdbPath),
            getThreatLists(outputPath, mmdbPath, selectedSources)
        ]);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                consola.error(`Script cluster [${String(index)}] failed:`, String(result.reason));
            }
        });
        consola.info("\n====================================\n" +
                     "Pipeline execution finished." +
                     "\n====================================\n");
    } catch (error) {
        consola.error("\n====================================\n" +
                      `Fatal error in pipeline: ${String(error)}` +
                      "\n====================================\n");
    }
}