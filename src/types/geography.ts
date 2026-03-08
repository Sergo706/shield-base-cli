export interface GlobalCity {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

export interface GlobalState {
    id: number;
    name: string;
    state_code: string;
    latitude: string;
    longitude: string;
    type: string | null;
    cities: GlobalCity[];
}

export interface GlobalCountry {
    id: number;
    name: string;
    iso2: string;
    iso3: string;
    numeric_code: string;
    phonecode: string;
    capital: string;
    currency: string;
    currency_name: string;
    currency_symbol: string;
    tld: string;
    native: string | null;
    region: string;
    region_id: number;
    subregion: string;
    subregion_id: number;
    nationality: string;
    timezones: {
        zoneName: string;
        gmtOffset: number;
        gmtOffsetName: string;
        abbreviation: string;
        tzName: string;
    }[];
    translations: Record<string, string>;
    latitude: string;
    longitude: string;
    emoji: string;
    emojiU: string;
    states: GlobalState[];
}
