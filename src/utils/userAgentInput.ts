import consola from "consola";
import { isValidUserAgent } from "./validateUserAgent.js";


export async function askForUserAgent(): Promise<string> {
    const bgpTools = 'https://bgp.tools/kb/api';
    const message = `To avoid getting blocked, bgp.tools requires contact information to reach you in case something went wrong.
                    This data will be included in the user agent header each time you get data from them.
                    More information is available at: ${bgpTools}.\n
                    Required format: '<your-name or company> <optional site url> - <Your email address>'\n`;

    let contactInfo = '';
    let isValid = false;

    while (!isValid) {
    const input = await consola.prompt(message, {
            type: 'text',
            placeholder: 'acmeco bgp.tools - contact@acme.co',
            cancel: 'null' 
        });

        if (input === null) {
            consola.fail('Operation cancelled by user. Exiting Shield-Base...');
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