import { createRegExp, exactly, anyOf, charIn, digit, letter } from 'magic-regexp';

const octet = anyOf(
  exactly('25', charIn('012345')),
  exactly('2', charIn('01234'), digit),
  exactly(charIn('01'), digit, digit),
  exactly(digit, digit),
  digit
);

const ipv4Base = anyOf(exactly(octet, '.', octet, '.', octet, '.', octet));
const hexWord = anyOf(digit, charIn('abcdefABCDEF')).times.between(1, 4);


const ipv6Base = anyOf( 
  exactly(hexWord, ':').times(7).and(hexWord),
  exactly( exactly(hexWord, ':').times.between(3, 7), ':' ),
  exactly(hexWord, ':').times.between(1, 5).and('::').and(exactly(hexWord, ':').times.any()).and(hexWord),
  exactly('::').and(anyOf(hexWord, ipv4Base, exactly(hexWord, ':').times.any().and(hexWord))),
  exactly(hexWord, ':').times.between(1, 7).and(':')
);


export const ipBase = anyOf(ipv4Base, ipv6Base).notAfter(anyOf(letter, digit, ':'));

export const botIpExtractor = createRegExp(
  ipBase.groupedAs('ip1'),
  anyOf(
    // CIDR
    exactly(
      '/', 
      digit.times.between(1, 3).groupedAs('mask')
    ),
    
    // ranges
    exactly(
      anyOf(' to ', ' - ', '-', ' and '),
      ipBase.groupedAs('ip2')
    )
  ).optionally(),
  
  ['g', 'i'] 
);