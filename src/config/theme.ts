import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import type { GlobalStyleProps } from '@chakra-ui/theme-tools';

const themeConfig = {
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  colors: {
    octoBlue: '#2468f2'
  },
  styles: {
    global: (props: GlobalStyleProps) => ({
      body: {
        bg: mode('#f6f7fa', '#0b0c21')(props),
        color: mode('#1B1A1C', 'white')(props),
      },
      '.octo-gray': {
        color: mode('#929AA6!important', '#A6A0BB!important')(props)
      }
    })
  },
  components: {
    Text: {
      variants: {
        'gray': (props: GlobalStyleProps) => ({
          color: mode('#929AA6', '#A6A0BB')(props)
        })
      }
    },
    Container: {
      baseStyle: {
        maxW: 'container.lg'
      }
    },
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none'
        },
        borderRadius: 'lg'
      },
      variants: {
        'octo-linear': {
          color: 'white',
          backgroundImage: 'linear-gradient(137deg, #1486ff 4%, #2468f2)',
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            backgroundImage: 'linear-gradient(137deg, #2468f2 4%, #1486ff)',
            filter: 'brightness(110%)'
          },
          _active: {
            backgroundImage: 'linear-gradient(137deg, #1486ff 4%, #2468f2)',
            filter: 'brightness(90%)'
          }
        },
        'octo-linear-outline': (props: GlobalStyleProps) => ({
          color: '#2468f2',
          border: '1px solid #2468f2',
          
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            bg: mode('blackAlpha.100', 'whiteAlpha.100')(props),
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        })
      }
    },
    CloseButton: {
      baseStyle: {
        _focus: {
          boxShadow: 'none'
        }
      }
    },
    Link: {
      baseStyle: {
        _selected: {
          color: '#2468f2'
        },
        _hover: {
          color: '#2468f2',
          textDecoration: 'none'
        },
        _focus: {
          boxShadow: 'none'
        }
      },
      variants: {
        'gray-underline': (props: GlobalStyleProps) => ({
          color: mode('#929AA6', '#A6A0BB')(props),
          _hover: {
            color: mode('#929AA6', '#A6A0BB')(props),
            textDecoration: 'underline'
          }
        }),
        'gray-hover-blue': (props: GlobalStyleProps) => ({
          color: mode('#929AA6', '#A6A0BB')(props)
        })
      }
    },
  }
}

export const theme = extendTheme(themeConfig);