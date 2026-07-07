import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgres://adam@localhost/fit_test',
    },
    fileParallelism: false,
  },
});
