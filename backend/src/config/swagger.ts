import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Loads and returns the OpenAPI specification from the static openapi.yaml file.
 * This replaces the fragile manual Zod registry approach that only covered 2 endpoints.
 */
export const generateSwaggerDocs = (): object => {
    const specPath = path.join(__dirname, 'openapi.yaml');
    if (!fs.existsSync(specPath)) {
        throw new Error(`openapi.yaml not found at: ${specPath}`);
    }
    const raw = fs.readFileSync(specPath, 'utf8');
    return yaml.load(raw) as object;
};
