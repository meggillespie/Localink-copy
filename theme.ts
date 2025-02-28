// customTheme.ts
import { extendTheme } from 'native-base';

const customTheme = extendTheme({
    config: {
        initialColorMode: 'light',
    },
    colors: {
        // Use a neutral palette for a minimalist style.
        primary: {
            50: '#f7f7f7',
            100: '#ededed',
            200: '#d6d6d6',
            300: '#bebebe',
            400: '#a7a7a7',
            500: '#919191', // Main accent color (if needed)
            600: '#7a7a7a',
            700: '#646464',
            800: '#4e4e4e',
            900: '#393939',
        },
        // Background and text colors for a clean, Instagram-like look.
        background: '#ffffff',
        text: {
            100: '#000000',
            200: '#333333',
            300: '#4d4d4d',
        },
    },
    fonts: {
        heading: 'HelveticaNeue, Helvetica, Arial, sans-serif',
        body: 'HelveticaNeue, Helvetica, Arial, sans-serif',
        mono: 'Menlo, monospace',
    },
    // Optional: Override default component styles for a more refined look.
    components: {
        Button: {
            baseStyle: {
                rounded: 'full',
                _text: { fontWeight: 'bold' },
            },
            defaultProps: {
                colorScheme: 'primary',
            },
        },
        Input: {
            baseStyle: {
                rounded: 'md',
                bg: '#fff',
                borderColor: '#ccc',
                _focus: { borderColor: 'primary.500' },
            },
        },
    },
});

export default customTheme;
