import consola from "consola";
import { InputCache } from "../types/input.js";



export function checkLicenseAgree(selectedSources: string[], cache: Partial<InputCache>, arg: boolean): boolean {

    const fireholUrl = 'https://github.com/firehol/blocklist-ipsets';

    const intendsToUseFirehol = selectedSources.some(s => s.startsWith('firehol_') || s === 'Proxy');
    
    const hasLicense = arg || cache.license;

    if (arg && !cache.license) return true;
    
    if (intendsToUseFirehol && !hasLicense) {
        consola.warn(`Some data included in "Threats" and "Proxy" may include specific fields that have different types of licensing.\nPlease check for more info: ${fireholUrl}`);
    }

    return true;
}


