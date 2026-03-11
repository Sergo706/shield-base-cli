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
    iso639: string;
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
export interface CityGeoRecord {
    range: string;
    country_code: string;
    region: string
    city: string
    zip_code: string;
    numericCode: string;
    latitude: string,
    longitude: string,
    state: string
    name: string;
    native: string;
    phone: string;
    continent: string;
    capital: string;
    currency: string;
    currency_name: string;
    iso639: string;
    languages: string;
    emoji: string;
    timezone: string;
    utc_offset: string;
    tld: string;
    nationality: string;
    subregion: string;
    timeZoneName: string;
}

export interface GeoRecord {
    range: string;
    country_code: string;
    region: string;
    numericCode: string;
    name: string;
    native: string;
    phone: string;
    capital: string;
    currency: string;
    currency_name: string;
    currency_symbol: string;
    iso639: string;
    languages: string;
    emoji: string;
    tld: string;
    nationality: string;
    subregion: string;
    timezone: string;
    timeZoneName: string;
    utc_offset: string;
}