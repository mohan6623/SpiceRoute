/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kraft: {
          DEFAULT: '#8B5A2B',
          light: '#A67C52',
          dark: '#6B4423',
        },
        postal: {
          DEFAULT: '#1E40AF',
          dark: '#1E3A8A',
          light: '#2563EB',
        },
        paper: {
          DEFAULT: '#FDF8F3',
          border: '#E8DCC8',
          surface: '#FFFFFF',
          input: '#FEFEFE',
        },
        coffee: {
          DEFAULT: '#3D2914',
          light: '#5C4033',
        },
        status: {
          booked: '#1E40AF',
          'picked-up': '#D97706',
          'in-transit': '#DC2626',
          'out-for-delivery': '#7C3AED',
          delivered: '#166534',
        },
        success: '#166534',
        error: '#991B1B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      boxShadow: {
        'kraft': '0 2px 8px rgba(139, 90, 43, 0.08)',
        'kraft-md': '0 4px 12px rgba(139, 90, 43, 0.12)',
        'kraft-lg': '0 8px 24px rgba(139, 90, 43, 0.16)',
        'button': '0 2px 4px rgba(139, 90, 43, 0.15)',
      },
      borderRadius: {
        'input': '4px',
        'card': '8px',
      },
      animation: {
        'check': 'checkmark 0.6s ease-in-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        checkmark: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
