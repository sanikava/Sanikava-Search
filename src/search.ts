import normalizeUrl from './normalize-url'
import * as requireDir from 'require-dir'
import { performance } from 'perf_hooks'
const commonWords = require('./common-words.json')
console.log("Common words loaded: " + commonWords.length + " words");

function levenshteinDistance(a, b) {
    const an = a.length;
    const bn = b.length;
    const costs = [];

    if (an === 0) return bn;
    if (bn === 0) return an;

    for (let i = 0; i <= an; i++) {
        let lastval = i;
        for (let j = 0; j <= bn; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newval = costs[j - 1];
                if (a[i - 1] !== b[j - 1]) {
                    newval = Math.min(newval, lastval, costs[j]) + 1;
                }
                costs[j - 1] = lastval;
                lastval = newval;
            }
        }
        costs[bn] = lastval;
    }
    return costs[bn];
}

function getDidYouMean(query: string): string | null {
    console.log("getDidYouMean called with query: " + query);
    const words = query.toLowerCase().split(' ');
    if (words.length !== 1) {
        console.log("Query is not a single word.");
        return null; // Only suggest for single words for now
    }

    const inputWord = words[0];
    console.log("Input word: " + inputWord);

    if (commonWords.includes(inputWord)) {
        console.log("Word is in commonWords.");
        return null; // Word is already common, no suggestion needed
    }

    let bestMatch: string | null = null;
    let minDistance = Infinity;

    for (const commonWord of commonWords) {
        const distance = levenshteinDistance(inputWord, commonWord);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = commonWord;
        }
    }

    console.log("Min distance: " + minDistance + ", Best match: " + bestMatch);

    // Set a threshold for suggestion (e.g., distance of 1 or 2)
    if (minDistance <= 2) {
        return bestMatch;
    }

    return null;
}

export interface EngineResult {
	url: string,
	title: string,
	content: number,
	position: number
}

export interface EngineRequest {
	results?: Array<EngineResult>,
	answer?: any,
	sidebar?: any,
	suggestion?: string
}

interface Engine {
	request?: Function,
	autoComplete?: Function,
	weight?: number,
}

const recursedEngines = requireDir('./engines', { recurse: true })
const engines: { [engineName: string]: Engine } = {}

const debugPerf: boolean = false

const plugins = recursedEngines.plugins

Object.assign(
	engines,
	recursedEngines.answers,
	recursedEngines.search
)


async function requestEngine(engineName: string, query: string): Promise<EngineRequest> {
	const engine: Engine = engines[engineName]
	let perfBefore: number, perfAfter: number
	if (debugPerf)
		perfBefore = performance.now()
	const response = await engine.request(query)
	if (debugPerf) {
		perfAfter = performance.now()
		console.log(`${engineName} took ${Math.floor(perfAfter - perfBefore)}ms.`)
	}
	return response
}

async function requestAllEngines(query: string): Promise<{[engineName: string]: EngineRequest}> {
	const promises: Array<Promise<EngineRequest>> = []
	for (const engineName in engines) {
		const engine: Engine = engines[engineName]
		if (engine.request) promises.push(requestEngine(engineName, query))
	}
	const resolvedRequests: Array<EngineRequest> = await Promise.all(promises)
	const results: {[engineName: string]: EngineRequest} = {}
	for (const engineIndex in resolvedRequests) {
		const engineName = Object.keys(engines)[engineIndex]
		results[engineName] = resolvedRequests[engineIndex]
	}
	return results
}

async function requestAllAutoCompleteEngines(query) {
	if (!query) return []
	const promises = []
	for (const engineName in engines) {
		const engine = engines[engineName]
		if (engine.autoComplete) { promises.push(engine.autoComplete(query)) }
	}
	const resolvedRequests = await Promise.all(promises)
	const results = {}
	for (const engineIndex in resolvedRequests) {
		const engineName = Object.keys(engines)[engineIndex]
		results[engineName] = resolvedRequests[engineIndex]
	}
	return results
}

async function request(query) {
	const results = {}
	let didYouMean: string | null = getDidYouMean(query)
	const enginesResults = await requestAllEngines(query)
	let answer: any = {}
	let sidebar: any = {}
	for (const engineName in enginesResults) {
		const engine = engines[engineName]
		const engineWeight = engine.weight || 1
		const engineResults = enginesResults[engineName]

		const engineAnswer = engineResults.answer
		const engineSidebarAnswer = engineResults.sidebar
		const engineSuggestion = engineResults.suggestion

		const answerEngineWeight = answer.engine ? answer.engine.weight || 1 : 0
		if (engineAnswer && ((engineWeight > answerEngineWeight) || Object.keys(answer).length === 0)) {
			answer = engineAnswer
			answer.engine = engine
		}
		if (engineSidebarAnswer != null && ((sidebar.engine && sidebar.engine.weight) || engineWeight > 1)) {
			sidebar = engineSidebarAnswer
			sidebar.engine = engine
		}
		if (engineSuggestion && !didYouMean) {
			didYouMean = engineSuggestion
		}

		for (const result of engineResults.results || []) {
			let normalUrl
			try {
				normalUrl = normalizeUrl(result.url)
			} catch {
				console.log('Invalid URL!', result, engineName)
				continue
			}

			// Default values
			if (!results[normalUrl]) {
 results[normalUrl] = {
					url: normalUrl,
					title: result.title,
					content: result.content,
					score: 0,
					weight: engineWeight,
					engines: []
				}
}

			// position 1 is score 1, position 2 is score .5, position 3 is score .333, etc

			if (results[normalUrl].weight < engineWeight) {
				// if the weight of this engine is higher than the previous one, replace the title and content
				results[normalUrl].title = result.title
				results[normalUrl].content = result.content
			}
			results[normalUrl].score += engineWeight / result.position
			results[normalUrl].engines.push(engineName)
		}
	}

	const calculatedResults = Object.values(results).sort((a: any, b: any) => b.score - a.score).filter((result: any) => result.url !== answer.url)

	// do some last second modifications, if necessary, and return the results!
	return await requestAllPlugins({
		results: calculatedResults,
		answer,
		sidebar,
		didYouMean,

		plugins: {} // these will be modified by plugins()
	})
}

async function autocomplete(query) {
	if (!query.trim()) return []
	const results = {}
	const enginesResults = await requestAllAutoCompleteEngines(query)
	for (const engineName in enginesResults) {
		const engine = engines[engineName]
		const engineResults = enginesResults[engineName]
		let resultPosition = 0
		for (const result of engineResults) {
			const engineWeight = engine.weight || 1
			resultPosition++

			// Default values
			if (!results[result]) {
 results[result] = {
					result,
					score: 0,
					weight: engineWeight,
					engines: []
				}
}

			results[result].score += engineWeight / resultPosition
			results[result].engines.push(engineName)
		}
	}
	return Object.keys(results)
}

// do some last second non-http modifications to the results
async function requestAllPlugins(options) {
	for (const pluginName in plugins) {
		const plugin = plugins[pluginName]
		if (plugin.changeOptions) { options = await plugin.changeOptions(options) }
	}
	return options
}

async function runPlugin({ pluginName, options }) {
	return await plugins[pluginName].runPlugin(options)
}

export { request, autocomplete, runPlugin }
