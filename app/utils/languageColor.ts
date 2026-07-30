export interface LanguageShare {
	name: string
	share: number
}

export interface LanguageSegment extends LanguageShare {
	color: string
	normalizedShare: number
	normalizedPercentage: number
}

// GitHub Linguist 的 25 种 popular 语言，加上本站项目接口当前还会返回的
// Dockerfile、Markdown 和 Vue。色值来自 Linguist languages.yml。
export const LANGUAGE_COLORS = {
	'C': '#555555',
	'C#': '#7355dd',
	'C++': '#f34b7d',
	'CSS': '#663399',
	'CoffeeScript': '#244776',
	'DM': '#447265',
	'Dart': '#00B4AB',
	'Dockerfile': '#384d54',
	'Elixir': '#6e4a7e',
	'Go': '#00ADD8',
	'Groovy': '#4298b8',
	'HTML': '#e34c26',
	'Java': '#b07219',
	'JavaScript': '#f1e05a',
	'Kotlin': '#A97BFF',
	'Markdown': '#083fa1',
	'Objective-C': '#438eff',
	'PHP': '#4F5D95',
	'Perl': '#0298c3',
	'PowerShell': '#012456',
	'Python': '#3572A5',
	'Ruby': '#701516',
	'Rust': '#dea584',
	'Scala': '#c22d40',
	'Shell': '#89e051',
	'Swift': '#F05138',
	'TypeScript': '#3178c6',
	'Vue': '#41b883',
} as const satisfies Record<string, string>

function fallbackLanguageColor(name: string) {
	let hash = 2166136261
	for (let index = 0; index < name.length; index++) {
		hash ^= name.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}

	return `hsl(${(hash >>> 0) % 360}deg 58% 52%)`
}

export function languageColor(name: string) {
	return LANGUAGE_COLORS[name as keyof typeof LANGUAGE_COLORS] ?? fallbackLanguageColor(name)
}

export function normalizeLanguages(languages: readonly LanguageShare[]): LanguageSegment[] {
	const visibleLanguages = languages.filter(language => (
		language.name.trim().length > 0
		&& Number.isFinite(language.share)
		&& language.share > 0
	))
	const totalShare = visibleLanguages.reduce((total, language) => total + language.share, 0)

	if (totalShare === 0)
		return []

	return visibleLanguages.map((language) => {
		const normalizedShare = language.share / totalShare

		return {
			...language,
			color: languageColor(language.name),
			normalizedShare,
			normalizedPercentage: normalizedShare * 100,
		}
	})
}
