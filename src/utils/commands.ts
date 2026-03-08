export const commands = {
  acceptFireholRisk: {
      type: 'boolean',
      description: 'Acknowledge of FireHOL',
      required: false,
    },

    all: {
        type: 'boolean',
        description: 'Skip interactive selection and fetch all available sources.',
        required: false,
    },
    refresh: {
        type: 'boolean',
        description: 'Force re-download and re-compilation of data sources.',
        required: false,
    },

    bgp: { type: 'boolean', description: 'Compile BGP data', required: false },
    city: { type: 'boolean', description: 'Compile City data', required: false },
    geo: { type: 'boolean', description: 'Compile Geography data', required: false },
    proxy: { type: 'boolean', description: 'Compile Proxy data', required: false },
    tor: { type: 'boolean', description: 'Compile Tor data', required: false },
    contact: { type: 'string', description: 'Provide User-Agent contact info to bypass the interactive BGP prompt', required: false },
    path: { type: 'string', description: 'Path for for the databases to be compiled into.', required: false },
    l1: { type: 'boolean', description: 'Compile FireHOL Level 1', required: false },
    l2: { type: 'boolean', description: 'Compile FireHOL Level 2', required: false },
    l3: { type: 'boolean', description: 'Compile FireHOL Level 3', required: false },
    l4: { type: 'boolean', description: 'Compile FireHOL Level 4', required: false },
  } as const
;
export const sources = [
      { label: 'BGP', value: 'BGP', hint: '🌐 Autonomous System numbers and prefix data' },
      { label: 'City', value: 'City', hint: '🏙️ IP to City geolocation data' },
      { label: 'Geography', value: 'Geography', hint: '🌍 Country and continent information' },
      { label: 'Proxy', value: 'Proxy', hint: 'Anonymous Proxy and VPN detection lists' },
      { label: 'Tor', value: 'Tor', hint: 'The Onion Router exit node IP lists, and more' },
      { label: 'FireHOL Level 1', value: 'firehol_l1', hint: 'Maximum protection, minimum false positives' },
      { label: 'FireHOL Level 2', value: 'firehol_l2', hint: 'Tracking attacks last 48h, includes dynamic IPs' },
      { label: 'FireHOL Level 3', value: 'firehol_l3', hint: 'Attacks, spyware, and viruses tracked last 30 days' },
      { label: 'FireHOL Level 4', value: 'firehol_l4', hint: 'Aggressive tracking, higher false positive risk' },
    ] as const;
