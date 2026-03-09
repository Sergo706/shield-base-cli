// This file contains a list of URLs for various web crawlers and bots.
// The URLs are used to fetch the IP ranges of the respective crawlers and bots.
// Please note that the list is not exhaustive and may not include all available crawlers and bots.
// feel free to add more URLs as needed.

import { ProvidersLists } from "../../types/botsIps.js";

export const urls: ProvidersLists[] = [
    {
     name: 'google',
     type: 'JSON',
     urls: [
            //DOCS : https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot
            'https://developers.google.com/static/search/apis/ipranges/googlebot.json', 
            'https://developers.google.com/static/search/apis/ipranges/special-crawlers.json', 
            'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json', 
            'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json',
            'https://www.gstatic.com/ipranges/goog.json',
     ]
    },
    { 
        name: 'bing',
        type: 'JSON',
        urls: [
            // DOCS : https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26
            'https://www.bing.com/toolbox/bingbot.json',
        ]
    },
    {
        name: 'openai',
        type: 'JSON',
        urls: [
            // DOCS : https://platform.openai.com/docs/bots/
            'https://openai.com/gptbot.json',
            'https://openai.com/chatgpt-user.json',
            'https://openai.com/searchbot.json',
        ]
    },
    {
        name: 'apple',
        type: 'JSON',
        urls: [
            // DOCS : https://support.apple.com/en-us/119829
            'https://search.developer.apple.com/applebot.json',
        ]
    },
    {
        name: 'ahrefs',
        type: 'JSON',
        urls: [
            // DOCS : https://help.ahrefs.com/en/articles/78658-what-is-the-list-of-your-ip-ranges
            'https://api.ahrefs.com/v3/public/crawler-ip-ranges'
        ]
    },
    {
        name: 'duckDuckGo',
        type: 'HTML',
        urls: [
            // DOCS : https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot
            // DOCS : https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot
            'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot',
            'https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot'
        ]
    },
    {
        name: 'commonCrawler',
        type: 'HTML',
        urls: [
            // DOCS : https://commoncrawl.org/faq
            'https://commoncrawl.org/faq',
        ]
    },
    {
        name: 'xAndTwitter',
        type: 'HTML',
        urls: [
            // DOCS : https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards
            'https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards'
        ]
    },
    {
        name: 'facebook',
        type: 'CSV',
        urls: [
            // DOCS : https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
            'https://www.facebook.com/peering/geofeed'
        ]
    },
    {
        name: 'pinterest',
        type: 'HTML',
        urls: [
            // DOCS : https://help.pinterest.com/en/business/article/pinterestbot
            'https://help.pinterest.com/en/business/article/pinterestbot'
        ]
    },
    {
        name: 'telegram',
        type: 'HTML',
        urls: [
            // DOCS : https://core.telegram.org/bots/webhooks
            'https://core.telegram.org/bots/webhooks'
        ]
    },
    {
        name: 'semrush',
        type: 'HTML',
        urls: [
            // DOCS : https://www.semrush.com/kb/1149-issues-with-crawling-a-domain
            'https://www.semrush.com/kb/1149-issues-with-crawling-a-domain'
        ]
    }
];


