import type { RenderContext } from "@anywidget/types";
import { Cosmograph, CosmographConfig } from '@cosmograph/cosmograph'
import { tableFromIPC } from 'apache-arrow'

import { toCamelCase } from './helper'
import { configProperties } from './config-props'

import "./widget.css";

/* Specifies attributes defined with traitlets in ../src/cosmograph_widget/__init__.py */
interface WidgetModel {
	value: number;
	/* Add your own */
}

function subscribe (model: RenderContext<WidgetModel>, name: string, callback: any) {
	model.on(name, callback)
	return () => model.off(name, callback)
}

function render({ model, el }: RenderContext<WidgetModel>) {
	el.classList.add("cosmograph_widget");
	const main = document.createElement('div')
  main.classList.add('widget-container')
	el.appendChild(main)

	let cosmograph: Cosmograph
	const cosmographContainer = document.createElement('div')
  cosmographContainer.classList.add('cosmograph-container')
  main.appendChild(cosmographContainer)

	const cosmographConfig: CosmographConfig = {
		onClick: (index, pointPosition, e) => {
			console.log('onClick', index, pointPosition, e)
			model.set('clicked_node_index', index)
			model.save_changes()
		}
	}

	const callbacks: { [key: string]: () => void } = {
		'change:_ipc_points': () => {
			const ipc = model.get('_ipc_points')
			cosmographConfig.points = ipc ? tableFromIPC(ipc.buffer) : []
		},
		'change:_ipc_links': () => {
			const ipc = model.get('_ipc_links')
			cosmographConfig.links = ipc ? tableFromIPC(ipc.buffer) : []
		},
		'change:selected_point_index': () => {
			const index = model.get('selected_point_index')
			cosmograph?.selectPoint(index, true)
			
		},
		'change:selected_point_indices': () => {
			const indices = model.get('selected_point_indices')
			console.log('indices', indices)
			cosmograph?.selectPoints(indices)
		}
	}

	configProperties.forEach(prop => {
		callbacks[`change:${prop}`] = () => {
			const value = model.get(prop)
			console.log(prop, toCamelCase(prop), value)
			if (value !== null) cosmographConfig[toCamelCase(prop) as keyof CosmographConfig] = value
		}
	})

	const unsubscribes = Object
		.entries(callbacks)
		.map(([name, callback]) => subscribe(model, name, () => {
			callback()
			cosmograph.setConfig(cosmographConfig)
		}))

	Object.values(callbacks).forEach(callback => callback())
	cosmograph = new Cosmograph(cosmographContainer, cosmographConfig)
	console.log('cosmograph', cosmograph)

	return () => {
		unsubscribes.forEach(unsubscribe => unsubscribe())
	};
}

export default { render };
