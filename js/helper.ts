import { fromArrow } from 'arquero'
import { tableFromIPC } from 'apache-arrow'
import { CosmosInputNode, CosmosInputLink } from '@cosmograph/cosmos'

export function getBasicNodesFromLinks<N extends CosmosInputNode, L extends CosmosInputLink> (links: L[]): N[] {
  return [
    ...new Set([
      ...links.map(d => d.source),
      ...links.map(d => d.target),
    ]),

  ].map(d => ({ id: d } as N))
}

export function getTableFromBuffer <Datum> (buffer?: string): Datum[] | undefined {
  if (!buffer) return undefined
  const dataArrowTable = tableFromIPC(buffer)

  return (fromArrow(dataArrowTable).objects()).map(d => {
    Object.keys(d).forEach(key => {
      const value = d[key as keyof typeof d]
      d[key as keyof typeof d] = typeof value === 'bigint' ? Number(value) as never : value
    })
    return d as Datum
  })
}
