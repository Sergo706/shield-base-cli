import consola from "consola";
import { isValidUserAgent } from "./validateUserAgent.js";


export async function askForUserAgent(): Promise<string> {
    const bgpTools = 'https://bgp.tools/kb/api';
    const message = [
        'bgp.tools requires your contact information as one of the data sources.',
        'It will be sent as a User-Agent header on every request to their API.',
        `More info: ${bgpTools}`,
        '',
        'Format: <name or company> [site url] - <email>',
    ].join('\n');

    let contactInfo = '';
    let isValid = false;

    while (!isValid) {
    const input = await consola.prompt(message, {
            type: 'text',
            placeholder: 'acmeco bgp.tools - contact@acme.co',
            cancel: 'null' 
        });

        if (input === null) {
            consola.fail('Operation cancelled. Exiting Shield-Base...');
            process.exit(1); 
        }

        contactInfo = input;
        const validationResult = isValidUserAgent(contactInfo);
        
        if (validationResult === true) {
            isValid = true;
        } else {
            consola.error(validationResult); 
        }
    }

    return contactInfo;
};