// OpenAI Configuration
export const OPENAI_CONFIG = {
	apiKey: 'null',
	model: 'gpt-4o-mini', // Using GPT-4 mini for cost efficiency
	maxTokens: 2000
}

export const API_BASE_URL = import.meta.env.VITE_RACING_API_URL || 'http://localhost:3000/api'

const cache = new Map()
const CACHE_DURATION = 10 * 60 * 1000

export const fetchFromAPI = async (endpoint, options = {}) => {
	const cacheKey = `${endpoint}${JSON.stringify(options)}`

	if (cache.has(cacheKey)) {
		const { data, timestamp } = cache.get(cacheKey)
		if (Date.now() - timestamp < CACHE_DURATION) {
			return data
		}
	}

	try {
		const url = new URL(`${API_BASE_URL}${endpoint}`)

		if (options.params) {
			Object.keys(options.params).forEach(key => {
				if (options.params[key] !== undefined && options.params[key] !== null) {
					url.searchParams.append(key, options.params[key])
				}
			})
		}

		const response = await fetch(url, {
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...(options.body && { body: JSON.stringify(options.body) })
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const result = await response.json()

		if (!result.success) {
			throw new Error(result.error?.message || 'API request failed')
		}

		cache.set(cacheKey, { data: result, timestamp: Date.now() })

		return result
	} catch (error) {
		console.error('API Error:', error)
		throw error
	}
}

export const clearCache = () => {
	cache.clear()
}