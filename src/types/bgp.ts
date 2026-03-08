export interface AsnDictionaryEntry {
    name: string;
    type: string;
}

export interface BGPRouteRaw {
    CIDR: string;
    ASN: number;
    Hits: number;
}

export interface BgpRecord {
    range: string;
    asn_id: string;
    asn_name: string;
    classification: string;
    hits: string;
}
