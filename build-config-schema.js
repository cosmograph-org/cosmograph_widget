/**
 * This script generates a JSON schema for the cosmograph configuration
 * file. It uses the Zod schema defined in ./js/config-schema.ts
 */
import * as fs from 'fs'
import { getConfigSchema } from './cosmograph/static/widget.js'

const jsonSchema = getConfigSchema();

fs.writeFileSync('cosmograph/static/config-schema.json', JSON.stringify(jsonSchema, null, 2))
