import type { RenderProps } from '@anywidget/types'
import { Cosmograph, CosmographInputConfig } from '@cosmograph/cosmograph'
import { CosmosInputNode, CosmosInputLink } from '@cosmograph/cosmos'

import { getBasicNodesFromLinks, getTableFromBuffer } from './helper'
import { configSchema, Config } from './config-schema'

import './widget.css'

/* Specifies attributes defined with traitlets in ../src/cosmograph/__init__.py */
interface WidgetModel {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links_arrow_table_buffer: {
    buffer: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _nodes_arrow_table_buffer: {
    buffer: string;
  };

  config: Config;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_message: string;
}


export function render<N extends CosmosInputNode, L extends CosmosInputLink> ({ model, el }: RenderProps<WidgetModel>): void {
  const div = document.createElement('div')
  div.style.width = '100%'
  div.style.height = '400px'
  div.style.color = 'white'
  const container = document.createElement('div')
  div.appendChild(container)

  const parsedInputConfig = configSchema.safeParse(model.get('config'))
  const modelConfig = parsedInputConfig.success ? parsedInputConfig.data : configSchema.parse({})
  if (!parsedInputConfig.success) {
    model.set('error_message', parsedInputConfig.error.toString())
    model.save_changes()
  }

  const config: CosmographInputConfig<N, L> = {
    ...modelConfig,
    nodeLabelAccessor: modelConfig.nodeLabelAccessor ? node => (node[modelConfig.nodeLabelAccessor as keyof N] as string) : undefined,

    // onClick: (clickedNode) => {
    // // Demonstration how to set a value from JS to Python (1)
    // model.set('clicked_node_id', `${clickedNode?.id ?? ''}`)
    // model.save_changes()

    // // Demonstration how to send a message to a Python side (2)
    // const adjacentNodes = clickedNode ? cosmograph.getAdjacentNodes(clickedNode.id) : []
    // model.send({ msg_type: 'adjacent_node_ids', adjacentNodeIds: adjacentNodes?.map(d => d.id) ?? [] })
    // }
  }

  // Initiate Cosmograph
  const cosmograph = new Cosmograph(container, config)

  function setDataFromBuffer (): void {
    const linksTable = getTableFromBuffer<L>(model.get('_links_arrow_table_buffer')?.buffer)
    const nodesTable = getTableFromBuffer<N>(model.get('_nodes_arrow_table_buffer')?.buffer)
    const links = linksTable ?? []
    const nodes = (nodesTable?.length === 0 && links?.length > 0 ? getBasicNodesFromLinks<N, L>(links) : nodesTable) ?? []
    cosmograph.setData(nodes, links)
  }

  setDataFromBuffer()

  // Listen changes from Python
  model.on('change:_links_arrow_table_buffer', () => {
    setDataFromBuffer()
  })
  model.on('change:_nodes_arrow_table_buffer', () => {
    setDataFromBuffer()
  })

  el.appendChild(div)
}

export { getConfigSchema } from './config-schema'
