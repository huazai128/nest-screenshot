import { defineConfig } from '@empjs/cli';
import { join, resolve } from 'path';
import InlineCodePlugin from 'html-inline-code-plugin';
import { TypedCssModulesPlugin } from 'typed-css-modules-webpack-plugin';
import pluginReact from '@empjs/plugin-react';
import { UploadSourceMapPlugin } from './build/sourcemap-upload-plugin';

export default defineConfig(() => {
  const env = process.env.NODE_ENV;

  return {
    plugins: [pluginReact()],
    base: '/',
    resolve: {
      alias: {
        '@src': resolve(__dirname, './src'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
    },
    server: {
      port: 8008,
      open: false,
      devMiddleware: {
        index: true,
        mimeTypes: {
          phtml: 'text/html',
        },
        publicPath: './dist/client',
        serverSideRender: true,
        writeToDisk: true,
      },
    },
    build: {
      staticDir: '.',
      outDir: join(__dirname, './dist/client'),
      output: {
        filename: 'js/[name].[contenthash].js',
        chunkFilename: 'js/[name].[contenthash].chunk.js',
        sourcemapFilename: 'js/[name].[contenthash].map',
      },
      polyfill: {
        entryCdn: `https://unpkg.com/@empjs/polyfill@0.0.1/dist/es.js`,
      },
    },
    html: {
      filename: (pathData) => {
        console.log('当前chunk名称:', pathData.chunk.name);
        if (pathData.chunk.name.startsWith('pages/')) {
          const pagePath = pathData.chunk.name.split('/');
          pagePath.pop();
          const dirPath = pagePath.join('/');
          console.log('生成的目录路径:', dirPath);
          return resolve(__dirname, `./dist/client/${dirPath}/index.html`);
        }
        return resolve(__dirname, './dist/client/[name].html');
      },
      meta: {
        viewport: 'width=device-width, initial-scale=1.0',
      },
      inject: true,
      chunks: 'all',
    },
    chain(chain) {
      const isProd = env !== 'development' && !!env;
      if (isProd) {
        chain.devtool('source-map');
        // 优化 sourcemap 上传配置
        const sourcemapConfig = {
          url:
            process.env.SOURCEMAP_UPLOAD_URL ||
            'http://localhost:5005/api/upload-zip',
          uploadPath: resolve(__dirname, './dist/client/js'),
          patterns: [/\.js\.map$/],
          requestOption: {
            timeout: 30000, // 设置30秒超时
            retries: 3, // 失败重试3次
            data: {
              siteId: process.env.SITE_ID || '63b6568f66704eb3458306d6',
              env: env,
              version: process.env.VERSION || '1.0.0',
            },
          },
          onSuccess: (response) => {
            console.log('Sourcemap uploaded successfully:', response);
          },
          onError: (error) => {
            console.error('Sourcemap upload failed:', error);
          },
        };

        chain
          .plugin('SourcemapUploadPlugin')
          .use(UploadSourceMapPlugin, [sourcemapConfig]);
      }

      chain.plugin('InlineCodePlugin').use(
        new InlineCodePlugin({
          begin: false,
          tag: 'script',
          inject: 'body',
          code: `window.INIT_DATA = <%- JSON.stringify(data) %>`,
        }),
      );

      chain.plugin('TypedCssModulesPlugin').use(
        new TypedCssModulesPlugin({
          globPattern: 'src/**/*.scss',
          camelCase: true,
          content: '',
          encoding: 'utf-8',
          logger: true,
        }),
      );
    },
  };
});
