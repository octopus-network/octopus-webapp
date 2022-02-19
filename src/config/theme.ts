import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import type { GlobalStyleProps } from '@chakra-ui/theme-tools';

const themeConfig = {
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  colors: {
    'octo-blue': {
      50: '#e9f0fe',
      100: '#d3e1fc',
      200: '#a7c3fa',
      300: '#7ca4f7',
      400: '#5086f5',
      500: '#2468f2',
      600: '#1d53c2',
      700: '#163e91',
      800: '#0e2a61',
      900: '#071530'
    }
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
    Heading: {
      baseStyle: {
        fontWeight: 700
      }
    },
    Container: {
      baseStyle: {
        maxW: '1200px'
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
        }),
        'octo-white': (props: GlobalStyleProps) => ({
          color: mode('#1B1A1C', 'white')(props),
          bg: mode('whiteAlpha.900', 'whiteAlpha.100')(props),
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            bg: mode('whiteAlpha.700', 'whiteAlpha.200')(props),
            color: '#2468f2',
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        }),
        'octo-blue': {
          color: 'white',
          bg: '#2468f2',
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            bg: '#5086f5',
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        },
        'white': {
          color: 'black',
          bg: 'whiteAlpha.900',
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            bg: 'whiteAlpha.800',
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        },
        'whiteAlpha': {
          color: '#fff',
          bg: 'whiteAlpha.500',
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            bg: 'whiteAlpha.600',
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        },
        'whiteAlphaGhost': {
          color: 'rgba(2255, 255, 255, .8)',
          transition: 'all .3s cubic-bezier(.4, 0, .2, 1)',
          _hover: {
            color: '#fff',
            bg: 'whiteAlpha.300',
            filter: 'brightness(110%)'
          },
          _active: {
            filter: 'brightness(90%)'
          }
        }
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
        },
        _active: {
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
        'blue-underline': {
          color: '#2468f2',
          _hover: {
            textDecoration: 'underline'
          }
        },
        'gray-hover-blue': (props: GlobalStyleProps) => ({
          color: mode('#929AA6', '#A6A0BB')(props)
        }),
        'gray-underline-black': (props: GlobalStyleProps) => ({
          color: mode('#929AA6', '#A6A0BB')(props),
          _hover: {
            color: mode('#1B1A1C', '#1B1A1C')(props),
            textDecoration: 'underline'
          }
        })
      }
    },
  }
}

export const theme = extendTheme(themeConfig);