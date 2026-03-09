import ipaddr from 'ipaddr.js';
import { IpRange, IpAddress } from 'cidr-calc';


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