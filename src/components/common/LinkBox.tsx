import { Box, Image, Text, useBoolean, VStack } from "@chakra-ui/react"
import { useSpring, animated } from "react-spring"

type LinkBoxProps = {
  label: string
  icon: any
  to?: string
  href?: string
}

const LinkBox: React.FC<LinkBoxProps> = ({ label, icon }) => {
  const [isHovering, setIsHovering] = useBoolean(false)

  const iconHoveringProps = useSpring({
    transform: isHovering ? "translateY(-5pxpx)" : "translateY(0px)",
  })

  return (
    <Box
      p={2}
      cursor="pointer"
      onMouseEnter={setIsHovering.on}
      onMouseLeave={setIsHovering.off}
    >
      <VStack spacing={1}>
        <animated.div style={iconHoveringProps}>
          <Box boxSize={8}>
            <Image src={icon} w="100%" />
          </Box>
        </animated.div>
        <Text
          fontSize="sm"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          maxW="100%"
        >
          {label}
        </Text>
      </VStack>
    </Box>
  )
}

export default LinkBox
