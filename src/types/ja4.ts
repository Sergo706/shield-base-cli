export interface JA4 {
    application: string | null,
    library: string | null,
    device: string | null,
    os: string | null,
    user_agent_string: string | null,
    certificate_authority: string | null,
    observation_count: number | null,
    verified:  boolean | null,
    notes: string | null,
    ja4_fingerprint: string | null,
    ja4_fingerprint_string: string | null,
    ja4s_fingerprint: string | null,
    ja4h_fingerprint: string | null,
    ja4x_fingerprint: string | null,
    ja4t_fingerprint: string | null,
    ja4ts_fingerprint: string | null,
    ja4tscan_fingerprint: string | null
    date: string;
    comment: string;
}