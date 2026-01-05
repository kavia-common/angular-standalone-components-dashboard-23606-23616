const ocean = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  success: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ocean,
      },
      boxShadow: {
        soft: '0 10px 25px -15px rgba(17,24,39,0.25)',
      },
    },
  },
  plugins: [],
};
