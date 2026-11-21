export default { content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { primary: { DEFAULT: '#3157D5', dark: '#2443AF' }, ink: '#172033', muted: '#7B8498', line: '#E8EBF2', canvas: '#F7F8FC',
      ok: '#159B69', warn: '#E9A23B', danger: '#D94B58', info: '#3986D9', ordarly: '#159B69', keykonnec: '#0F9D9A', website: '#3157D5' },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    borderRadius: { card: '12px' } } },
  plugins: [] };
