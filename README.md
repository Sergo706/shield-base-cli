# Shield-Base CLI

Shield-Base is a command line tool designed to aggregate, process, and compile network data into offline binary formats.

It fetches data from multiple public sources, including [BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) routing tables, geographic location databases, threat intelligence lists, and common crawler IPs and consolidates them for use in security analysis and traffic filtering.

The tool can be used as both interactive cli powered by [Consola](https://github.com/unjs/consola/tree/main), and programmatically.

## Features

- Comes with an Installation wizard, choose only the databases you need, or compile them all, supports flag based execution for CI/CD environments.
- Merges ASN, GeoIP, Tor exit nodes, Threat data, and verified crawler datasets into a single pipeline.
- Automatically compiles processed data into .mmdb formats using [mmdbctl](https://github.com/ipinfo/mmdbctl).
- Supports generating fully typed mmdb database from json files.
- Can generate Typescript types from json inputs.
- Written fully in Typescript.

## Data Sources
The tool relies on several public data providers:

### 1. [BGP](https://bgp.tools) & ASN Data
Provides Autonomous System Numbers and prefix routing data.

>**WARNING**
>
> **BGP.tools Integration**: To get data from them, you need to provide a valid contact User-Agent in the format: `<name> [url] - <email>`. You will be prompted for this in the interactive mode or you can provide it via the `--contact` flag.
> More info at  [BGP.tools](https://bgp.tools/kb/api) API docs.


### 2. Geographic Data
- [Country](https://github.com/sapics/ip-location-db/tree/main/geo-asn-country-mmdb) and rich meta information derived from RIR databases (AFRINIC, APNIC, ARIN, LACNIC, RIPE NCC) and WHOIS records, and mapped locally.

- **City**: IP to city geolocation mapping using [RFC 8805](https://datatracker.ietf.org/doc/html/rfc8805) [Geofeeds](https://geolocatemuch.com) and enriched geographic datasets.

### 3. Threat Intelligence
The tool allows you to choose from multiple security blocklists, categorized into levels based on the environment:

- **Level 1**: Maximum protection, minimum false positives.
- **Level 2**: Recent attacks.
- **Level 3**: Active attacks, spyware, and viruses.
- **Level 4**: Aggressive tracking, higher false-positive risk.
- **Anonymous**: Specifically targets Tor exit nodes, I2P, VPNs, and other anonymity network relays.

>**NOTE**
>
> Check [FireHOL](https://github.com/firehol/blocklist-ipsets) documentation, for more information.



### 4. Anonymity Networks

The tool fetches data and ip lists directly from the [Tor Project's Onionoo API](https://metrics.torproject.org/onionoo.html),
And a list of known public proxies from different sources, such as [awesome-lists](https://github.com/mthcht/awesome-lists/tree/main/Lists/PROXY), and [FireHOL](https://github.com/firehol/blocklist-ipsets/blob/master/firehol_proxies.netset) then merges them into a single formatted database.

### 5. Verified Crawlers
Shield-Base also fetches IP ranges for major search engine crawlers and legitimate automated agents (Google, Bing, Apple, Meta, etc.).
You can easily customize it to provide additional URLs when used programmatically, or you can use its functions to feed it raw HTML/text to get clean IPs back.

Data is extracted directly from official provider geofeeds (JSON/CSV) and HTML pages.
This fetcher uses a tiered fetch with a fallback mechanism that will use `curl` to bypass anti scraping measures on social media geofeeds when it detects a regular fetch being blocked.

>**WARNING**
>
> Make sure `curl` is installed when you use this data source.

#### Example Usage
**Command Line**

Simply run `npx shield-base --seo` and the database will be built with around 3400 records.

**Programmatic Usage**

If you want to provide custom URLs to fetch into the database, you need to define an array of objects including the provider `name`, the list of `urls` to process, and the type of data at the URL, for example:

```ts
const myCustomCrawlersUrls = [
  {
  name: 'cloudflare', // REQUIRED

  /** REQUIRED. If the links you are providing include a regular html/markdown/other-raw-text-data page, use HTML. If it is a link to a CSV file, use CSV.
  * If it is a JSON (e.g., https://developers.google.com/static/search/apis/ipranges/googlebot.json), use JSON.
  */
  type: 'CSV' | 'JSON' | 'HTML',
  urls: ['example.com', 'example1.com','example2.com'] // REQUIRED.
}

]
const mmdbPath = 'path to mmdbctl binary'
await getCrawlersIps(outputDirectory, mmdbPath, myCustomCrawlersUrls)
```
This will compile the built in datasets with your data into a single `mmdb` database.
If `mmdbctl` is already installed in your system, simply provide `mmdbctl` for the `mmdbctl` binary argument; if not, you can run the installation wizard to install it for you automatically (see below), or you can [download](https://github.com/ipinfo/mmdbctl) it directly.

### 6. Custom

You can provide your own data and generate fully typed mmdb compatible databases.

>**NOTE**
>
>When processing multiple input files, the first output uses your --name (e.g., myDb.mmdb), while subsequent files are indexed (e.g., myDb-1.mmdb, myDb-2.mmdb).

>**WARNING**
>
>You will need to make sure your JSON is an array of objects and that every object contain a `range` property with the associated ipv4/ipv6 addresses, or a valid cidr range.

Examples:

**Command Line**

```bash
shield-base compile --name myMmdbDb --outputDir src/types --types example.json

# OR

npx @riavzon/shield-base compile --name myMmdbDb --outputDir src/types --types example.json

```
This will output `myMmdbDb.mmdb` database and `mymmdbTypes.ts` type file typed from the json file.

**Programmatic Usage**

You can use the compiler directly in your code, the below code will produce the same output as above:

```ts
import { compiler } from '@riavzon/shield-base'

const mmdbPath = 'path to mmdbctl binary'
await compiler<any>({
    data: 'example.json',
    dataBaseName: mmdbPath,
    mmdbPath: 'mmdbctl',
    outputPath: './',
    generateTypes: true
});

```
If you need to generate a database from many json files you can provide an array of paths:

```ts
import { compiler } from '@riavzon/shield-base'
import type { StringOfSources } from '@riavzon/shield-base';

const sources: StringOfSources[] = [
  {
    pathToJson: 'example.json', // REQUIRED
    dataBaseName: 'myMmdbDb', // REQUIRED
    outputPath: './' // REQUIRED
  },
    {
    pathToJson: 'example2.json', // REQUIRED
    dataBaseName: 'myMmdbDb2', // REQUIRED
    outputPath: './' // REQUIRED
  },
  ]

const mmdbPath = 'path to mmdbctl binary'
await compiler<any>({
    data: sources,
    dataBaseName: 'myMmdbDb',
    mmdbPath: mmdbPath,
    outputPath: './',
    generateTypes: true
});
```
You can also feed it raw json data and it will happily generate a mmdb database and its types:

```ts
import { compiler } from '@riavzon/shield-base'

const data = [
  {
    "range": "1.1.1.0/24",
    "metadata": {
      "version": "1.0.0",
      "author": "Person",
      "tags": ["dns", "secure", "fast"],
      "sub_data": {
        "level_1": { // Can be as much nested as you need
          "level_2": {
            "level_3": {
              "level_4": {
                "deep_value": "Success",
                "array_of_objects": [
                  { "index": 0, "active": true },
                  { "index": 1, "active": false }
                ],
                "mixed_types": [1, "two", { "three": 3 }]
              }
            }
          }
        }
      }
    },
    "organization": {
      "name": "Cloudflare, Inc.",
      "details": {
        "headquarters": "San Francisco",
        "employees": 3000,
        "is_public": true
      }
    }
  },
];

await compiler<any>({
    data,
    dataBaseName: 'myMmdbDb',
    mmdbPath: mmdbPath,
    outputPath: './',
    generateTypes: true
});
```
The above will produce:

- `myMmdbDb.mmdb` database:
```bash
    mmdbctl read -f json-pretty 1.1.1.10 ./myMmdbDb.mmdb
```
```json
{
  "ip": "1.1.1.10",
  "metadata": {
    "author": "Person",
    "sub_data": {
      "level_1": {
        "level_2": {
          "level_3": {
            "level_4": {
              "array_of_objects": [
                {
                  "active": true,
                  "index": 0
                },
                {
                  "active": false,
                  "index": 1
                }
              ],
              "deep_value": "Success",
              "mixed_types": [
                1,
                "two",
                {
                  "three": 3
                }
              ]
            }
          }
        }
      }
    },
    "tags": [
      "dns",
      "secure",
      "fast"
    ],
    "version": "1.0.0"
  },
  "network": "1.1.1.0/24",
  "organization": {
    "details": {
      "employees": 3000,
      "headquarters": "San Francisco",
      "is_public": true
    },
    "name": "Cloudflare, Inc."
  }
}
```
- `mymmdbdbTypes.ts` Typescript types:
```ts
interface MyMmdbDb {
  range: string;
  metadata: Metadata;
  organization: Organization;
}

interface Organization {
  name: string;
  details: Details;
}

interface Details {
  headquarters: string;
  employees: number;
  is_public: boolean;
}

interface Metadata {
  version: string;
  author: string;
  tags: string[];
  sub_data: Subdata;
}

interface Subdata {
  level_1: Level1;
}

interface Level1 {
  level_2: Level2;
}

interface Level2 {
  level_3: Level3;
}

interface Level3 {
  level_4: Level4;
}

interface Level4 {
  deep_value: string;
  array_of_objects: Arrayofobject[];
  mixed_types: (Mixedtype | number | string)[];
}

interface Mixedtype {
  three: number;
}

interface Arrayofobject {
  index: number;
  active: boolean;
}
```

> **TIP**
>
> Each data source is updated regularly, some even every 5 minutes. You can use the `-refresh` flag to restart your current datasets or use the `--refreshAll` flag to refresh your current datasets and add any missing datasets Shield-Base has to offer.

## Installation

```bash
npm install @riavzon/shield-base

npm link

# Or
npx @riavzon/shield-base <command> <args>

# Or to start the wizard
npx @riavzon/shield-base

npx @riavzon/shield-base <args>

```
## Caching

To speed things up, and remember your choices for the next runs, Shield-Base caches the mmdbctl binary path and settings you chose in the interactive wizard, in:
`~/.shield-base/.cache.json`

You can safely delete this file to force the tool to reverify or reinstall dependencies.

## Usage

>**WARNING**
>
>The tool requires [mmdbctl](https://github.com/ipinfo/mmdbctl) to be installed locally, in order to run.
>It tries to install it by itself if it detects it's not installed and prompt you before it does so.

### Interactive Mode
Simply run the command without arguments to start the wizard:
```bash
shield-base

# Or
npx @riavzon/shield-base
```
### Types Generations

You can generate types from any json inputs files or raw data:

```bash
# Raw data
shield-base types --name example --outputDir ./ <raw-json-data>
# OR
npx @riavzon/shield-base types --name example --outputDir ./ <raw-json-data>

# Files
shield-base types --name example --outputDir ./ example.json
npx @riavzon/shield-base types --name example --outputDir ./ example.json

#Or
shield-base types --name example --outputDir ./ example1.json example2.json
npx @riavzon/shield-base types --name example --outputDir ./ example1.json example2.json
```
The above will generate a Typescript file typed from your json inputs in the `outputDir` directory.


The `generateTypeFile` utility accepts three input formats:

- File Path: A string path to a `.json` file './data.json'.
- JSON String: A raw stringified JSON '{"key": "value"}'.
- Object: A standard Javascript object or array already in memory.

The below code will produce the same output as above:
```ts
import { generateTypeFile } from '@riavzon/shield-base'

generateTypeFile('example.json', 'exampleName', "./");


// Or
const json = {
  "id": 1,
  "value": "someValue",
  "anotherValue": "someAnotherValue"
}
generateTypeFile(json, 'exampleName', "./");

```
### Programmatic

```ts
// Core scripts
import {
    getBGPAndASN,
    buildCitiesData,
    generateData as executeAll,
    getGeoDatas,
    getListOfProxies,
    getThreatLists,
    getTorLists,
    restartData,
    getCrawlersIps,
    run
} from '@riavzon/shield-base';
const contactInfo = `<name> [url] - <email>`

const mmdbPath = 'path to mmdbctl binary'
await executeAll(outputDirectory, contactInfo ?? '', true, mmdbPath)

const ids = [
    "firehol_anonymous",
    "firehol_l1",
    "firehol_l2",
    "firehol_l3",
    "firehol_l4"
]

const selectedSources = true; // or use ids array.
const myCustomCrawlersUrls = [];
const results = await Promise.allSettled([
            getBGPAndASN(contactInfo, outputDirectory, mmdbPath),
            buildCitiesData(outputDirectory, mmdbPath),
            getTorLists(outputDirectory, mmdbPath),
            getGeoDatas(outputDirectory, mmdbPath),
            getListOfProxies(outputDirectory, mmdbPath),
            getThreatLists(outputDirectory, mmdbPath, selectedSources),
            getCrawlersIps(outputDirectory, mmdbPath, myCustomCrawlersUrls)
]);
const restartAllData = true;

const restart = await restartData(outputDirectory, restartAllData)

// A utility to run shell commands
await run('ls')
```

### Flag Based
For automated environments, you can specify exactly which sources to compile:

```bash
# Compile everything with parallel execution
shield-base --all --parallel --contact "name example.com - admin@example.com"

# Compile only Tor and BGP data
shield-base --tor --bgp --contact "name - admin@example.com"

# Compile FireHOL Level 1 and Level 2
shield-base --l1 --l2 --acceptFireholRisk
```

### Global Flags

These flags control the interactive installation wizard and automated data fetching.
you can use the --help flag to see the full list of options available, or
`shield-base <command> --help` to see available options for a command.

| Flag | Description |
| --- | --- |
| `--help`, `-h` | Show help for the main command or a subcommand. |
| `--acceptFireholRisk` | Acknowledge licensing for FireHOL datasets. |
| `--all` | Skip interactive selection and fetch all available sources. |
| `--refresh` | Force redownload of existing data sources. |
| `--refreshAll` | Force redownload and recompilation of all data sources using cached config. |
| `--parallel` | Run compilation tasks concurrently. |
| `--contact <str>` | Provide the required BGP.tools contact info. |
| `--path <dir>` | Specify the output directory for compiled databases. |
| `--bgp` | Compile BGP data. |
| `--city` | Compile City data. |
| `--geo` | Compile Geography data. |
| `--proxy` | Compile Proxy data. |
| `--tor` | Compile Tor data. |
| `--seo` | Compile verified search engine and automated agent ranges. |
| `--l1` | Compile FireHOL Level 1. |
| `--l2` | Compile FireHOL Level 2. |
| `--l3` | Compile FireHOL Level 3. |
| `--l4` | Compile FireHOL Level 4. |
| `--anonymous` | Compile FireHOL Anonymous network list. |

### Subcommands

#### `compile`
Generates MMDB databases and TypeScript types from custom JSON files.

| Argument / Flag | Type | Description |
| --- | --- | --- |
| `<INPUT>` | Positional | One or more paths to JSON data files separated by spaces. |
| `--name` | String | **Required**. Base name for the output files. |
| `--outputDir` | String | Directory to save the files. Defaults to `./`. |
| `--types` | Boolean | Whether to generate TypeScript types. Defaults to `true`. |
| `--no-types` | Flag | Disable TypeScript type generation. |
| `--help`, `-h` | Flag | Show help for the compile command. |

#### `types`
Generates standalone TypeScript type definitions from JSON files.

| Argument / Flag | Type | Description |
| --- | --- | --- |
| `<INPUT>` | Positional | One or more paths to JSON data files or raw JSON strings separated by spaces. |
| `--name` | String | **Required**. Base name for the generated type file. |
| `--outputDir` | String | Directory to save the types. Defaults to `./`. |
| `--help`, `-h` | Flag | Show help for the types command. |


## Reading data
You can read from a compiled database via the command line with [`mmdbctl`](https://github.com/ipinfo/mmdbctl):

```bash
mmdbctl read -f json-pretty 8.8.8.8 outputDirectory/asn.mmdb
```
Or with a specialized library such as [`mmdb-lib`](https://www.npmjs.com/package/mmdb-lib), [`@maxmind/geoip2-node`](https://www.npmjs.com/package/@maxmind/geoip2-node), or [`maxmind`](https://www.npmjs.com/package/maxmind).

Example:

```js
import fs from 'fs';
import * as mmdb from 'mmdb-lib';
const db = fs.readFileSync('/path/to/data.mmdb');
const reader = new mmdb.Reader<CityGeoRecord>(db);
console.log(reader.get('66.6.44.4'));

// OR
import { Reader } from "@maxmind/geoip2-node";
const read = await Reader.open(path.join(__dirname, '/path/to/data.mmdb'));
```

## Data Examples


### SEO Bots
```bash
mmdbctl read -f json-pretty 66.249.66.1 outputDirectory/goodBots.mmdb
```
```json
{
  "provider": "google",
  "range": "66.249.66.0/24",
  "syncToken": "1710000000",
  "creationTime": "2024-03-09T22:00:00.000Z"
}
```

### BGP
```bash
mmdbctl read -f json-pretty 8.8.8.8 outputDirectory/asn.mmdb
```

Output:

```json
{
"asn_id": "15169",
"asn_name": "Google LLC",
"classification": "Content",
"hits": "2679",
"ip": "8.8.8.8",
"network": "8.8.8.0/24"
}
```

### City
```bash
mmdbctl read -f json-pretty 137.174.48.5 outputDirectory/city.mmdb
```

Output:

```json
{
"capital": "Paris",
"city": "Paris",
"continent": "Europe",
"country_code": "FR",
"currency": "EUR",
"currency_name": "Euro",
"emoji": "🇫🇷",
"ip": "137.174.48.5",
"languages": "Frañs",
"latitude": "48.85661400",
"longitude": "2.35222190",
"name": "France",
"nationality": "French",
"native": "France",
"network": "137.174.48.0/21",
"numericCode": "250",
"phone": "33",
"region": "FR-75C",
"state": "Paris",
"subregion": "Western Europe",
"timeZoneName": "Central European Time",
"timezone": "Europe/Paris",
"tld": ".fr",
"utc_offset": "UTC+01:00",
"zip_code": "123456"
}
```
### Country

```bash
mmdbctl read -f json-pretty 161.185.160.93 outputDirectory/country.mmdb
```
Output

```json
{
"capital": "Washington",
"country_code": "US",
"currency": "USD",
"currency_name": "United States dollar",
"currency_symbol": "$",
"emoji": "🇺🇸",
"ip": "161.185.160.93",
"languages": "Stadoù-Unanet",
"name": "United States",
"nationality": "American",
"native": "United States",
"network": "161.185.0.0-161.186.255.255",
"numericCode": "840",
"phone": "1",
"region": "Americas",
"subregion": "Northern America",
"timeZoneName": "Hawaii–Aleutian Standard Time",
"timezone": "America/Adak",
"tld": ".us",
"utc_offset": "UTC-10:00"
}
```
### Tor

```bash
mmdbctl read -f json-pretty 192.42.116.52 outputDirectory/tor.mmdb
```

```json
{
"as": "AS215125",
"as_name": "Church of Cyberology",
"contact": "email:mail[]nothingtohide.nl url:nothingtohide.nl proof:uri-rsa abuse:abuse[]nothingtohide.nl ciissversion:2",
"country": "nl",
"country_name": "Netherlands",
"exit_addresses": "192.42.116.49",
"exit_policy": "reject 0.0.0.0/8:*,reject 169.254.0.0/16:*,reject 127.0.0.0/8:*,reject 192.168.0.0/16:*,reject 10.0.0.0/8:*,reject 172.16.0.0/12:*,reject 192.42.116.49:*,accept *:80,accept *:443,accept *:8080,accept *:8443,accept *:110,accept *:143,accept *:220,accept *:465,accept *:587,accept *:993,accept *:995,accept *:43,accept *:53,accept *:853,accept *:4321,accept *:11371,accept *:873,accept *:3690,accept *:9418,accept *:194,accept *:6660-6669,accept *:6679,accept *:6697,accept *:7000-7001,accept *:5222-5223,accept *:5228,accept *:64738,accept *:1194,accept *:1293,accept *:51820,accept *:8233,accept *:8333,accept *:9333,accept *:18080-18081,accept *:30303,accept *:51235,reject *:*",
"exit_policy_summary": "{\"accept\":[\"43\",\"53\",\"80\",\"110\",\"143\",\"194\",\"220\",\"443\",\"465\",\"587\",\"853\",\"873\",\"993\",\"995\",\"1194\",\"1293\",\"3690\",\"4321\",\"5222-5223\",\"5228\",\"6660-6669\",\"6679\",\"6697\",\"7000-7001\",\"8080\",\"8233\",\"8333\",\"8443\",\"9333\",\"9418\",\"11371\",\"18080-18081\",\"30303\",\"51235\",\"51820\",\"64738\"]}",
"exit_probability": 0.0005507535,
"first_seen": "2023-07-07 00:00:00",
"flags": "Exit,Fast,Running,Valid",
"guard_probability": 0,
"ip": "192.42.116.52",
"last_changed_address_or_port": "2026-03-07 19:00:00",
"last_restarted": "2026-03-07 17:44:13",
"last_seen": "2026-03-08 10:00:00",
"measured": true,
"middle_probability": 0,
"network": "192.42.116.0/24",
"or_addresses": "192.42.116.49:9004",
"recommended_version": true,
"running": true,
"version_status": "recommended"
}
{
"as": "AS29802",
"as_name": "HIVELOCITY, Inc.",
"contact": "Unknown",
"country": "us",
"country_name": "United States of America",
"exit_addresses": "",
"exit_policy": "reject *:*",
"exit_policy_summary": "{\"reject\":[\"1-65535\"]}",
"exit_probability": 0,
"first_seen": "2019-02-18 00:00:00",
"flags": "Fast,Guard,HSDir,Running,Stable,V2Dir,Valid",
"guard_probability": 0.000067750596,
"ip": "66.206.0.138",
"last_changed_address_or_port": "2024-01-29 19:00:00",
"last_restarted": "2025-05-29 16:27:56",
"last_seen": "2026-03-08 10:00:00",
"measured": true,
"middle_probability": 0.000039495306,
"network": "66.206.0.0/24",
"or_addresses": "66.206.0.82:9001",
"recommended_version": false,
"running": true,
"version_status": "obsolete"
}
```
### Proxy
```bash
mmdbctl read -f json-pretty 1.0.136.198 outputDirectory/proxy.mmdb

mmdbctl read -f json-pretty 102.217.190.157 outputDirectory/proxy.mmdb

```
Output:
```json
{
"comment": "Ip from Firehol",
"ip": "1.0.136.198",
"network": "1.0.136.198/32",
"port": "unknown"
}

{
"comment": "TheSpeedX, openproxy",
"ip": "102.217.190.157",
"network": "102.217.190.157/32",
"port": "7080"
}
```
### Threat levels

```bash
mmdbctl read -f json-pretty 45.143.203.111 outputDirectory/firehol_l1.mmdb
mmdbctl read -f json-pretty 1.31.80.222 outputDirectory/firehol_l2.mmdb
mmdbctl read -f json-pretty 1.24.16.177 outputDirectory/firehol_l3.mmdb
mmdbctl read -f json-pretty 1.10.141.115 outputDirectory/firehol_l4.mmdb
mmdbctl read -f json-pretty 1.0.136.76 outputDirectory/firehol_anonymous.mmdb

```

Output:

```json
{
"comment": "firehol_l1  Maintainer: http://iplists.firehol.org/",
"ip": "45.143.203.111",
"network": "45.143.203.0/24"
}

{
"comment": "firehol_l2  Maintainer: http://iplists.firehol.org/",
"ip": "1.31.80.222",
"network": "1.31.80.222/32"
}
{
"comment": "firehol_l3  Maintainer: http://iplists.firehol.org/",
"ip": "1.24.16.177",
"network": "1.24.16.177/32"
}

{
"comment": "firehol_l4  Maintainer: http://iplists.firehol.org/",
"ip": "1.10.141.115",
"network": "1.10.141.115/32"
}

{
"comment": "firehol_anonymous  Maintainer: http://iplists.firehol.org/",
"ip": "1.0.136.76",
"network": "1.0.136.76/32"
}
```



---

  MIT License
