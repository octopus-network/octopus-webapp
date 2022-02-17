import React from 'react';

import {
  HStack,
  Link,
  Text,
} from '@chakra-ui/react';

import { Link as RouterLink } from 'react-router-dom';

type BreadcrumbProps = {
  links: {
    label: string | undefined;
    to?: string;
  }[]
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ links = [] }) => {
  return (
    <HStack>
      {
        links.map((link, idx) => {
          const isCurrentPage = idx === links.length - 1;
          return (
            <HStack key={`link-${idx}`}>
              {
                link.to ?
                <Link as={RouterLink} variant="gray-underline-black" to={link.to}>
                  {link.label}
                </Link> :
                <Text>{link.label}</Text>
              }
              {
                !isCurrentPage ? <Text variant="gray">/</Text> : null
              }
            </HStack>
          );
        })
      }
    </HStack>
  )
}