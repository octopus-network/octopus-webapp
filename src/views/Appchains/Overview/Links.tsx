import React, { useEffect } from "react";

import {
  SimpleGrid,
  Box,
  HStack,
  Heading,
  Text,
  Flex,
  VStack,
  Image,
  Icon,
  BoxProps,
  useColorModeValue,
  useBoolean,
  useClipboard,
  Link,
} from "@chakra-ui/react";
import { useSpring, animated } from "react-spring";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import astro from "assets/icons/astro.png";
import { AppchainInfo } from "types";
import { toValidUrl } from "utils";
import { Toast } from "components/common/toast";
import { FaAnchor, FaGithub, FaGlobe } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

type LinkBoxProps = BoxProps & {
  icon: React.ReactElement;
  title: string;
  href?: string;
  copy?: string;
};

const LinkBox: React.FC<LinkBoxProps> = ({
  icon,
  href,
  copy,
  title,
  ...rest
}) => {
  const bg = useColorModeValue("#f6f7fa", "#15172c");

  const [isHovering, setIsHovering] = useBoolean(false);

  const [, iconHoveringApi] = useSpring(() => ({
    transform: "translate3d(0, 0, 0)",
  }));

  const [arrowHoveringProps, arrowHoveringApi] = useSpring(() => ({
    transform: "translateX(-10px)",
    opacity: 0,
  }));

  const [onCopyProps, onCopyApi] = useSpring(() => ({
    opacity: 0,
  }));

  useEffect(() => {
    if (isHovering) {
      iconHoveringApi.start({ transform: "translate3d(3px, 3px, 0)" });
      arrowHoveringApi.start({ transform: "translateX(0px)", opacity: 1 });
      onCopyApi.start({ opacity: 1 });
    } else {
      iconHoveringApi.start({ transform: "translate3d(0px, 0px, 0px)" });
      arrowHoveringApi.start({ transform: "translateX(-10px)", opacity: 0 });
      onCopyApi.start({ opacity: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering]);

  return (
    <Box
      bg={bg}
      borderRadius="md"
      p="12px 24px"
      cursor="pointer"
      onMouseEnter={setIsHovering.on}
      onMouseLeave={setIsHovering.off}
      {...rest}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <HStack spacing={4}>
          <Box boxSize="24px" position="relative">
            {icon}
          </Box>
          <VStack
            alignItems="flex-start"
            spacing={0}
            minH="43px"
            justifyContent="center"
          >
            <Heading fontSize="16px">{title}</Heading>
            {copy ? (
              <Text
                variant="gray"
                fontSize="sm"
                maxW="180px"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {copy}
              </Text>
            ) : null}
          </VStack>
        </HStack>

        {href !== undefined ? (
          <animated.div style={arrowHoveringProps} className="octo-blue">
            <Icon as={HiOutlineArrowNarrowRight} />
          </animated.div>
        ) : (
          <animated.div style={onCopyProps}>
            <Heading fontSize="sm" color="octo-blue.500">
              Copy
            </Heading>
          </animated.div>
        )}
      </Flex>
    </Box>
  );
};

type LinksProps = {
  data: AppchainInfo | undefined;
};

export const Links: React.FC<LinksProps> = ({ data }) => {
  const { onCopy: onEmailCopy } = useClipboard(
    data?.appchain_metadata?.contact_email as any
  );
  const { onCopy: onAnchorCopy } = useClipboard(data?.appchain_anchor as any);

  const onCopyEmail = () => {
    onEmailCopy();
    Toast.success("Email Copied");
  };

  const onCopyAnchor = () => {
    onAnchorCopy();
    Toast.success("Anchor Copied");
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <Link href={toValidUrl(data?.appchain_metadata?.website_url)} isExternal>
        <LinkBox
          icon={<FaGlobe size={24} />}
          title="Website"
          href={data?.appchain_metadata?.website_url}
        />
      </Link>
      <Link
        href={toValidUrl(data?.appchain_metadata?.github_address)}
        isExternal
      >
        <LinkBox
          icon={<FaGithub size={24} />}
          title="Github Repo"
          href={data?.appchain_metadata?.github_address}
        />
      </Link>
      <LinkBox
        icon={<MdEmail size={24} />}
        title="Email"
        onClick={onCopyEmail}
        copy={data?.appchain_metadata?.contact_email}
      />
      {data?.appchain_state === "Voting" && (
        <Link href={data.dao_proposal_url} isExternal>
          <LinkBox
            icon={<Image src={astro} width={24} />}
            title="AstroDAO Proposal"
            href={data.dao_proposal_url}
          />
        </Link>
      )}
      {data?.appchain_anchor ? (
        <LinkBox
          icon={<FaAnchor size={24} />}
          title="Anchor"
          onClick={onCopyAnchor}
          copy={data?.appchain_anchor}
        />
      ) : null}
    </SimpleGrid>
  );
};
