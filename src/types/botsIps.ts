export interface BotIpPrefix {
    ipv4Prefix?: string;
    ipv6Prefix?: string;
}

export interface BotIpData {
    creationTime?: string;
    syncToken?: string;
    prefixes: BotIpPrefix[];
}

export type BotIpsLists = Record<string, (BotIpData | string)[]>;

export interface ProvidersLists {
    name: string,
    type: 'HTML' | 'JSON' | 'CSV',
    urls: string[]
}
