export interface ExitPolicySummary {
  accept?: string[];
  reject?: string[];
}

export interface OnionooPayload {
    version: string;
    relays: Partial<RelayNode>[];
    bridges: Partial<RelayNode>[];
}

export interface RelayNode {
  or_addresses: string[];
  exit_addresses?: string[] | string;
  last_seen: string;
  last_changed_address_or_port: string;
  first_seen: string;
  running: boolean;
  flags: string[];
  country: string;
  country_name: string;
  as: string;
  as_name: string;
  last_restarted: string;
  exit_policy: string[];
  exit_policy_summary: ExitPolicySummary;
  exit_policy_v6_summary?: ExitPolicySummary;
  contact: string;
  version_status: string;
  guard_probability: number;
  middle_probability: number;
  exit_probability: number;
  recommended_version: boolean;
  measured: boolean;
}