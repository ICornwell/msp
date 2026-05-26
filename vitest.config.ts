import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      '../msp_common/vitest.config.ts',
      '../msp_svr_common/vitest.config.ts',
      '../msp_data_common/vitest.config.ts',
      '../msp_ui_common/vitest.config.ts',
      '../msp_fes/vitest.config.ts',
      '../msp_actorwork/vitest.config.ts',
      '../module-federation-vite/vitest.config.ts',
      '../msp_bus_data/tests/vitest.config.ts',
    ],
  },
});
