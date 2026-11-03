import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'cloudflare:workers':fileURLToPath(new URL('./tests/durable-object-stub.ts',import.meta.url))}}});
