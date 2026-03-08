import { getBGPAndASN } from "./bgp.js";
import { buildCitiesData } from "./city.js";
import { getTorLists } from "./tor.js";
import { getGeoDatas } from "./geo.js";
import { getListOfProxies } from "./proxy.js";
import { getThreatLists } from "./threats.js";
import * as fs from 'fs';
import { fileURLToPath } from "url";
import path from "path";
import consola from "consola";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateData(outputPath: string, userAgent: string, selectedSources: string[] | boolean) {
    consola.box("\n=========================================\n" +
                " === Starting data generation pipeline === " +
                "\n=========================================\n");

    const dataPath = path.resolve(__dirname, '../mmdb');
    
    const threatsPath = path.resolve(dataPath, 'threats-lists');
    
    if (!fs.existsSync(threatsPath)) {
        fs.mkdirSync(threatsPath, { recursive: true });
    }
    
    try {

        const results = await Promise.allSettled([
            getBGPAndASN(userAgent, outputPath),
            buildCitiesData(outputPath),
            getTorLists(outputPath),
            getGeoDatas(outputPath),
            getListOfProxies(outputPath),
            getThreatLists(outputPath, selectedSources)
            
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