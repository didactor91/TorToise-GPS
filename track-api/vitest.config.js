import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./test/setup.js'],
        testTimeout: 30000,
        hookTimeout: 30000,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true
            }
        }
    }
})
