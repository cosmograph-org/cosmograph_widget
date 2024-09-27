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

	model.on('msg:custom', (msg: { [key: string]: any }) => {
		if (msg.type === 'fit_view') {
			cosmograph?.fitView()
		}
		if (msg.type === 'fit_view_by_indices') {
			cosmograph?.fitViewByIndices(msg.indices, msg.duration, msg.padding)
		}
		if (msg.type === 'fit_view_by_coordinates') {
			cosmograph?.fitViewByCoordinates(msg.coordinates, msg.duration, msg.padding)
		}
		if(msg.type === 'focus_point') {
			cosmograph?.focusPoint(msg.index ?? undefined)
		}
		if (msg.type === 'start') {
			cosmograph?.start(msg.alpha ?? undefined)
		}
		if (msg.type === 'pause') {
			cosmograph?.pause()
		}
		if (msg.type === 'restart') {
			cosmograph?.restart()
		}
		if (msg.type === 'step') {
			cosmograph?.step()
		}
	});

	const cosmographConfig: CosmographConfig = {
		onClick: (index) => {
			model.set('clicked_node_index', index)
			model.save_changes()
		},
		onPointsFiltered: () => {
			model.set('selected_point_indices', cosmograph?.getSelectedPointIndices() ?? [])
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
		'change:_selected_point_index': () => {
			const index = model.get('_selected_point_index')
			cosmograph?.selectPoint(index, true)
			
		},
		'change:_selected_point_indices': () => {
			const indices = model.get('_selected_point_indices')
			cosmograph?.selectPoints(indices)
		},
		'change:_is_rect_selection_active': () => {
			const isActive = model.get('_is_rect_selection_active')
			if (isActive) cosmograph?.activateRectSelection()
			else cosmograph?.deactivateRectSelection()
		}
	}

	configProperties.forEach(prop => {
		callbacks[`change:${prop}`] = () => {
			const value = model.get(prop)
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

	return () => {
		unsubscribes.forEach(unsubscribe => unsubscribe())
	};
}

export default { render };
