/*
import { requestJSON } from '../../parser'

const wynncraftRegex = /^(?:wynn(?:craft)?)?\s*?([^<>]+?)\s*(?:wynn(?:craft)?)?$/i


export async function request(query) {
	const regexMatch = query.match(wynncraftRegex)
	if (!regexMatch) return {}
	let wynncraftQuery = regexMatch[1] + ' (Quest)'
	wynncraftQuery = wynncraftQuery.replace(/(^\w{1})|(\s+\w{1})(?=\w{2})/g, letter => letter.toUpperCase())
	const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + encodeURIComponent(wynncraftQuery))
	const pages = summaryJson.query.pages
	const pageId = Object.keys(pages)[0]
	if (pageId == '-1') return {}
	const article = pages[pageId]
	return {
		sidebar: {
			title: article.title,
			content: article.extract,
			image: '/wynncraft.webp',
			url: 'https://wynncraft.fandom.com/' + article.title.replace(' ', '_')
		}
	}
}
*/

/*
const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + wynncraftQuery)

import { requestJSON } from '../../parser'

const wynncraftRegex = /^(?:wynn(?:craft)?)?\s*?([^<>]+?)\s*(?:wynn(?:craft)?)?$/i


export async function request(query) {
    const regexMatch = query.match(wynncraftRegex)
    if (!regexMatch) return {}
    let wynncraftQuery = regexMatch[1] + ' (Quest)'
    wynncraftQuery = wynncraftQuery.replace(/(^\w{1})|(\s+\w{1})(?=\w{2})/g, letter => letter.toUpperCase())
//    const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + wynncraftQuery)
  const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + wynncraftQuery)  
    // Check if summaryJson or its properties are null/undefined before continuing
    if (!summaryJson || !summaryJson.query || !summaryJson.query.pages) {
        console.error('Invalid or blank response received from Wynncraft API.');
        return {}; // Return an empty object to handle the failure gracefully
    }

    const pages = summaryJson.query.pages
    const pageId = Object.keys(pages)[0]
    if (pageId == '-1') return {}
    const article = pages[pageId]
    return {
        sidebar: {
            title: article.title,
            content: article.extract,
            image: '/wynncraft.webp',
            url: 'https://wynncraft.fandom.com/' + article.title.replace(/ /g, '_')
        }
    }
}
*/


//Working but bug
/*import { requestJSON } from '../../parser'

const wynncraftRegex = /^(?:wynn(?:craft)?)?\s*?([^<>]+?)\s*(?:wynn(?:craft)?)?$/i


export async function request(query) {
    const regexMatch = query.match(wynncraftRegex)
    if (!regexMatch) return {}
    let wynncraftQuery = regexMatch[1] + ' (Quest)'
    wynncraftQuery = wynncraftQuery.replace(/(^\w{1})|(\s+\w{1})(?=\w{2})/g, letter => letter.toUpperCase())
    
    // Encode the query before sending it in the URL
    const encodedQuery = encodeURIComponent(wynncraftQuery);
    console.log(encodedQuery)
    const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + encodedQuery)
    
    // Check if summaryJson or its properties are null/undefined before continuing
    if (!summaryJson || !summaryJson.query || !summaryJson.query.pages) {
        console.error('Invalid or blank response received from Wynncraft API.');
        return {}; // Return an empty object to handle the failure gracefully
    }

    const pages = summaryJson.query.pages
    const pageId = Object.keys(pages)[0]
    if (pageId == '-1') return {}
    const article = pages[pageId]
    return {
        sidebar: {
            title: article.title,
            content: article.extract,
            image: '/wynncraft.webp',
            url: 'https://wynncraft.fandom.com/' + article.title.replace(/ /g, '_')
        }
    }
}
*/

//new

import { requestJSON } from '../../parser'

const wynncraftRegex = /^(?:wynn(?:craft)?)?\s*?([^<>]+?)\s*(?:wynn(?:craft)?)?$/i


export async function request(query) {
    const regexMatch = query.match(wynncraftRegex)
    if (!regexMatch) return {}
    
    // Get the base query without adding "(Quest)"
    let wynncraftQuery = regexMatch[1];
    
    // Capitalize the first letter of each word
    wynncraftQuery = wynncraftQuery.replace(/(^\w{1})|(\s+\w{1})(?=\w{2})/g, letter => letter.toUpperCase())
    
    // Encode the query before sending it in the URL
    const encodedQuery = encodeURIComponent(wynncraftQuery);
    
    const summaryJson = await requestJSON('https://wynncraft.fandom.com/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=' + encodedQuery)
    
    // Check if a valid page was found
    if (!summaryJson || !summaryJson.query || !summaryJson.query.pages) {
        console.error('Invalid or blank response received from Wynncraft API.');
        return {};
    }

    const pages = summaryJson.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId == '-1') {
        console.error('Page not found on Wynncraft Wiki.');
        return {};
    }

    const article = pages[pageId];
    return {
        sidebar: {
            title: article.title,
            content: article.extract,
            image: '/wynncraft.webp',
            url: 'https://wynncraft.fandom.com/' + article.title.replace(/ /g, '_')
        }
    }
}
