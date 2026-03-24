
export type Severity = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type Usage = 'Hunting' | 'Detection rule';

export interface UserAgentRecord {
    useragent_rx: string
    metadata_description: string
    metadata_tool: string
    metadata_category: string
    metadata_link: string
    metadata_priority: Severity
    metadata_fp_risk: Severity
    metadata_severity: Severity
    metadata_usage: Usage
    metadata_flow_from_external: boolean | null;
    metadata_flow_from_internal: boolean | null;
    metadata_flow_to_internal: boolean | null;
    metadata_flow_to_external: boolean | null;
    metadata_for_successful_external_login_events: boolean | null;
    metadata_comment: string;
    date: string,
    comment: string;
}