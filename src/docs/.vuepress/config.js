import { defineUserConfig, defaultTheme } from 'vuepress'

export default defineUserConfig({
	lang: 'en-US',
	title: 'Modul-IS',
	theme: defaultTheme({
		logo: '/logo.png',
		navbar: [
			{ text: 'Home', link: '/' },
			{ text: 'Formuláře', link: '/form/form.md' },
		],
		sidebar: 'auto',
		sidebarDepth: 2,
	}),
})
