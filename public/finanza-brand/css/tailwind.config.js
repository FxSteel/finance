/**
 * FINANZA · Tailwind Config
 * Extiende el theme de Tailwind con los tokens del sistema de diseño.
 * 
 * Uso: copia esto a tu tailwind.config.js
 */

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutros
        ink:      '#0A0A0B',
        charcoal: '#1F1F23',
        graphite: '#3D3D42',
        steel:    '#888780',
        mist:     '#D3D1C7',
        paper:    '#FAFAFA',

        // Acentos
        brass: {
          DEFAULT: '#C4A876',
          soft:    '#E8DCC0',
        },
        indigo: {
          DEFAULT: '#5B5DEF',
          soft:    '#E5E5FD',
        },

        // Semánticos
        income: {
          DEFAULT: '#2D8659',
          soft:    '#E1F0E8',
        },
        expense: {
          DEFAULT: '#B83A3A',
          soft:    '#F5E1E1',
        },
        warning: {
          DEFAULT: '#C8841A',
          soft:    '#FBEFD5',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        xs:   ['11px', { lineHeight: '1.5' }],
        sm:   ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
        md:   ['16px', { lineHeight: '1.7' }],
        lg:   ['18px', { lineHeight: '1.4' }],
        xl:   ['22px', { lineHeight: '1.3' }],
        '2xl':['28px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '3xl':['36px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },

      fontWeight: {
        regular: '400',
        medium:  '500',
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'24px',
      },

      boxShadow: {
        xs: '0 1px 2px rgba(10, 10, 11, 0.04)',
        sm: '0 1px 3px rgba(10, 10, 11, 0.06), 0 1px 2px rgba(10, 10, 11, 0.04)',
        md: '0 4px 8px rgba(10, 10, 11, 0.06), 0 2px 4px rgba(10, 10, 11, 0.04)',
        lg: '0 12px 24px rgba(10, 10, 11, 0.08), 0 4px 8px rgba(10, 10, 11, 0.04)',
      },

      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
    },
  },
  darkMode: 'class',
};
