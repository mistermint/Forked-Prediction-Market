/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				forked: {
					green: '#8BA446',
					'green-light': '#9DB84F',
					'green-dark': '#7A9340',
					black: '#1A1A1A'
				},
				surface: {
					DEFAULT: '#1A1A1A',
					1: '#222222',
					2: '#2A2A2A',
					3: '#333333',
					4: '#3D3D3D'
				},
				accent: {
					green: '#4CAF50',
					red: '#F44336',
					yellow: '#FFD700',
					blue: '#2196F3'
				},
				text: {
					primary: '#F5F5F5',
					secondary: '#AAAAAA',
					muted: '#666666'
				}
			},
			fontFamily: {
				pixel: ['"Press Start 2P"', 'cursive'],
				sans: ['"IBM Plex Sans"', 'sans-serif'],
				mono: ['"IBM Plex Mono"', 'monospace']
			},
			fontSize: {
				'pixel-xs': ['8px', { lineHeight: '16px' }],
				'pixel-sm': ['10px', { lineHeight: '18px' }],
				'pixel-base': ['12px', { lineHeight: '20px' }],
				'pixel-lg': ['16px', { lineHeight: '24px' }],
				'pixel-xl': ['20px', { lineHeight: '28px' }]
			},
			borderRadius: {
				retro: '2px'
			},
			boxShadow: {
				retro: '4px 4px 0px rgba(0,0,0,0.5)',
				'retro-sm': '2px 2px 0px rgba(0,0,0,0.5)',
				'retro-lg': '6px 6px 0px rgba(0,0,0,0.5)',
				'retro-green': '4px 4px 0px rgba(139, 164, 70, 0.4)',
				'glow-sm': '0 0 10px rgba(139, 164, 70, 0.2)',
				'glow': '0 0 20px rgba(139, 164, 70, 0.3)',
				'glow-lg': '0 0 40px rgba(139, 164, 70, 0.4)',
				'glass': 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.35)'
			},
			animation: {
				blink: 'blink 1s step-end infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				blink: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' }
				}
			}
		}
	},
	plugins: []
};
