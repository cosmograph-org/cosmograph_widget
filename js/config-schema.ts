/* eslint-disable @typescript-eslint/naming-convention */
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { mapKeys, camel } from 'radash'


/**
 * Zod schema for the Cosmograph config.
 */
// TODO: add `showLabelsFor` from Cosmograph
export const configSchema = z.object({
  // From Cosmograph
  disable_simulation: z
    .union([z.boolean(), z.literal(null)])
    .default(null),
  show_dynamic_labels: z.boolean().default(true),
  show_top_labels: z.boolean().default(false),
  show_top_labels_limit: z.number().default(100),
  show_top_labels_value_key: z.string().optional(),
  show_hovered_node_label: z.boolean().default(false),
  node_label_accessor: z.string().optional(),
  node_label_class_name: z.string().optional(),
  node_label_color: z.string().optional(),
  hovered_node_label_class_name: z.string().optional(),
  hovered_node_label_color: z.string().optional(),

  simulation_decay: z.number().default(1000),
  simulation_gravity: z.number().default(0),
  simulation_center: z.number().default(0),
  simulation_repulsion: z.number().default(0.1),
  simulation_repulsion_theta: z.number().default(1.7),
  simulation_repulsion_quadtree_levels: z.number().default(12),
  simulation_link_spring: z.number().default(1),
  simulation_link_distance: z.number().default(2),
  simulation_link_dist_random_variation_range: z.tuple([z.number(), z.number()]).default([1, 1.2]),
  simulation_repulsion_from_mouse: z.number().default(2),
  simulation_friction: z.number().default(0.85),

  // From Cosmos
  background_color: z.string().default('#222222'),
  space_size: z.number().default(4096),
  // TODO: How to set the color for each node separately?
  node_color: z.string().default('#b3b3b3'),
  node_greyout_opacity: z.number().default(0.1),
  // TODO: How to set the size for each node separately?
  node_size: z.number().default(4),
  node_size_scale: z.number().default(1),
  render_highlighted_node_ring: z.boolean().default(true),
  render_hovered_node_ring: z.boolean().default(true),
  hovered_node_ring_color: z.string().default('white'),
  focused_node_ring_color: z.string().default('white'),
  render_links: z.boolean().default(true),
  // TODO: How to set the color for each link separately?
  link_color: z.string().default('#666666'),
  link_greyout_opacity: z.number().default(0.1),
  // TODO: How to set the width for each link separately?
  link_width: z.number().default(1),
  link_width_scale: z.number().default(1),
  curved_links: z.boolean().default(false),
  curved_link_segments: z.number().default(19),
  curved_link_weight: z.number().default(0.8),
  curved_link_control_point_distance: z.number().default(0.5),
  // TODO: How to set the arrow for each link separately?
  link_arrows: z.boolean().default(true),
  link_arrows_size_scale: z.number().default(1),
  link_visibility_distance_range: z.tuple([z.number(), z.number()]).default([50, 150]),
  link_visibility_min_transparency: z.number().default(0.25),
  use_quadtree: z.boolean().default(false),
  pixel_ratio: z.number().default(2),
  scale_nodes_on_zoom: z.boolean().default(true),
  initial_zoom_level: z.number().default(1),
  disable_zoom: z.boolean().default(false),
  fit_view_on_init: z.boolean().default(true),
  fit_view_delay: z.number().default(250),
  fit_view_by_nodes_in_rect: z.tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])]).optional(),
  random_seed: z.union([z.number(), z.string()]).optional(),
  node_sampling_distance: z.number().default(150),
})
  .transform(x => mapKeys(x, camel))

export type Config = z.infer<typeof configSchema>

export function getConfigSchema (): unknown {
  return zodToJsonSchema(configSchema, 'configSchema')
}
