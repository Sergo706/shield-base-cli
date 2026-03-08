# Shield-Base CLI

Shield-Base is a command-line tool designed to aggregate, process, and compile network intelligence data into offline-ready formats. It fetches data from multiple public sources—including BGP routing tables, geographic location databases, and threat intelligence lists—and consolidates them for use in security analysis and traffic filtering.

## Core Features

- **Consolidated Intelligence**: Merges ASN, GeoIP, and Threat data into a single pipeline.
- **MMDB Compilation**: Automatically compiles processed data into MaxMind DB (MMDB) format using `mmdbctl`.
- **Interactive & Automated Flow**: Supports a guided terminal interface for manual selection or strict flag-based execution for CI/CD environments.
- **Parallel Processing**: Optional concurrent data fetching and compilation to reduce execution time.
- **Modular Data Sources**: Each intelligence layer (BGP, City, Geography, Proxy, Tor, FireHOL) can be enabled or disabled independently.

## Data Sources

The tool relies on several high-quality public data providers:

### 1. BGP & ASN Data (BGP.tools)
Provides Autonomous System Numbers and prefix routing data.
> [!IMPORTANT]
> **BGP.tools Integration**: To prevent API blocking, BGP.tools requires a valid contact User-Agent in the format: `<name> [url] - <email>`. You will be prompted for this in interactive mode or can provide it via the `--contact` flag.

### 2. Geographic Data (Sapics & Geofeed)
- **Geography**: Country and continent-level information derived from RIR databases (AFRINIC, APNIC, ARIN, LACNIC, RIPE NCC) and WHOIS records.
- **City**: IP-to-city geolocation mapping using RFC 8805 Geofeeds and enriched geographic datasets.

### 3. Threat Intelligence (FireHOL)
Aggregates multiple security blocklists into categorized levels based on aggressiveness and false-positive risk:
- **Level 1**: Maximum protection, minimum false positives (Updated last 30 days).
- **Level 2**: Recent attacks (Last 48 hours).
- **Level 3**: Active attacks, spyware, and viruses (Last 30 days).
- **Level 4**: Aggressive tracking, higher false-positive risk.
- **Anonymous**: Specifically targets Tor exit nodes, I2P, VPNs, and other anonymity network relays.

### 4. Anonymity Networks
- **Tor Nodes**: Fetches exit node IP lists directly from the Tor Project's Onionoo API.
- **Proxies**: Consolidates open proxy and VPN detection lists for broad anonymity coverage.

## Installation

```bash
# Clone the repository
git clone https://github.com/Sergo706/shield-base-cli
cd shield-base-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI globally (optional)
npm link
```

## Usage

### Interactive Mode
Simply run the command without arguments to start the guided selection process:
```bash
shield-base
```

### Flag-Based Execution
For automated environments, you can specify exactly which sources to compile:

```bash
# Compile everything with parallel execution
shield-base --all --parallel --contact "MyProject example.com - admin@example.com"

# Compile only Tor and BGP data
shield-base --tor --bgp --contact "MyProject - admin@example.com"

# Compile FireHOL Level 1 and Level 2
shield-base --l1 --l2 --acceptFireholRisk
```

### Available Flags

| Flag | Description |
| --- | --- |
| `--all` | Select all available data sources. |
| `--parallel` | Run compilation tasks concurrently. |
| `--refresh` | Force re-download of existing data sources. |
| `--path <dir>` | Specify the output directory for compiled databases. |
| `--contact <str>` | Provide the required BGP.tools contact info. |
| `--acceptFireholRisk` | Acknowledge licensing for FireHOL datasets. |

## Development

```bash
# Start in development mode (auto-reload)
npm run dev

# Run a production build
npm run build

# Lint the codebase
npm run lint
```

## Licensing & Attribution
This tool aggregates data from sources with varying licenses. Each compiled database should be used in accordance with the terms provided by:
- [FireHOL Blocklists](https://github.com/firehol/blocklist-ipsets)
- [BGP.tools](https://bgp.tools/kb/api)
- [MaxMind (compatibility format)](https://www.maxmind.com)
- [Tor Project](https://metrics.torproject.org/onionoo.html)
