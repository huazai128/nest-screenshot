import {defineConfig} from '@empjs/cli'
import ReactPlugin from '@empjs/plugin-react'
import {pluginRspackEmpShare} from '@empjs/share'


export default defineConfig(store => {
  return {
    plugins: [
      ReactPlugin(),
      pluginRspackEmpShare({
        empRuntime: {
          runtimeLib: `https://unpkg.com/@empjs/share@3.1.5/output/sdk.js`,
          frameworkLib: `https://unpkg.com/@empjs/libs-18@0.0.1/dist`,
          frameworkGlobal: 'EMP_ADAPTER_REACT',
          framework: 'react',
        },
      }),
    ],
    build: {
      polyfill: {
        entryCdn: `https://unpkg.com/@empjs/polyfill@0.0.1/dist/es.js`,
      },
    },
  }
})
