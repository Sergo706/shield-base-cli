import ipaddr from 'ipaddr.js';
import { IpRange, IpAddress } from 'cidr-calc';


/**
 * Parses and normalizes an IP address or CIDR string into canonical form.
 *
 * @param ip - A raw IPv4/IPv6 address or CIDR string (for example, `"1.1.1.0/24"`).
 * @returns The normalized IP or CIDR string.
 * @throws If the input is empty, not a valid IP, or not a valid CIDR.
 */
export const normalizeIp = (ip: string): string => {
    if (!ip) throw new Error('Empty IP string');

    
    if (ip.includes('/')) {
        const [baseIp, mask] = ip.split('/');
        if (!ipaddr.isValidCIDR(ip)) throw new Error('Invalid CIDR');
        return `${ipaddr.parse(baseIp).toString()}/${mask}`;
    }

    if (!ipaddr.isValid(ip)) throw new Error('Invalid Ip address');
    return ipaddr.parse(ip).toString();
};

/**
 * Converts a regex match from {@link botIpExtractor} into one or more
 * canonical CIDR strings. Handles plain IPs, CIDR notation, and IP ranges
 * (expanded to CIDRs via `cidr-calc`).
 *
 * @param ip1 - The first IP address from the match.
 * @param ip2 - Optional second IP for range notation.
 * @param mask - Optional CIDR prefix length.
 * @returns A single CIDR string, or an array of CIDR strings for IP ranges.
 * @throws If any IP or CIDR is invalid.
 */
export const normalizeExtractedMatch = (ip1: string, ip2?: string, mask?: string): string | string[] => {
  const cleanIp1 = normalizeIp(ip1);

  if (ip2 && !mask) {
      const cleanIp2 = normalizeIp(ip2);
      
      const ipRange = new IpRange(IpAddress.of(cleanIp1), IpAddress.of(cleanIp2));
      return ipRange.toCidrs().map(c => c.toString());
  }
 
 if (mask) {
      const cidr = `${cleanIp1}/${mask}`;
      if (!ipaddr.isValidCIDR(cidr)) throw new Error('Invalid Extracted CIDR');
      return cidr;
  }

  return cleanIp1;
};