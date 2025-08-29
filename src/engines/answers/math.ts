import solve from '../../math'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'

const plotRegex = /^plot (?:y ?= ?)?(.+)$/i

async function plot(query) {
	const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 400, height: 400 });
	const expression = query.replace(/\^/g, '**');
	const data = {
		labels: [],
		datasets: [{
			label: 'y = ' + query,
			data: [],
			borderColor: 'rgb(75, 192, 192)',
			tension: 0.1
		}]
	};

	for (let x = -10; x <= 10; x++) {
		data.labels.push(x);
		const y = eval(expression.replace(/x/g, `(${x.toString()})`));
		data.datasets[0].data.push(y);
	}

	const configuration = {
		type: 'line' as const,
		data: data,
	};

	const image = await chartJSNodeCanvas.renderToDataURL(configuration);
	return image;
}

export async function request(query) {
	const plotMatch = query.match(plotRegex)
	if (plotMatch) {
		const image = await plot(plotMatch[1])
		return {
			answer: {
				template: 'math',
				image: image
			}
		}
	}

	const result = solve(query)
	if (result) {
		return {
			answer: {
				template: 'math',
				query: query,
				result: result
			}
		}
	}
	return {}
}