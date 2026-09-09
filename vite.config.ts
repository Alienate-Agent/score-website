import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';
import journeyStorage from './wrangler.journeys.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  // Keep the explicit instrument file canonical. Otherwise the asset server
  // redirects index.html to /lens/, while the app redirects /lens/ back.
  assets: { html_handling: 'none' as const },
  compatibility_flags: ['nodejs_compat'],
  analytics_engine_datasets: [{ binding: 'ENGAGEMENT', dataset: 'score_engagement_v1' }],
  // The real private resources are declared once for both the build and CLI.
  // Local preview uses local bindings and the browser hostname guard keeps it
  // inert. Production also requires secrets, edition and fresh backup checks.
  vars: journeyStorage.vars,
  ratelimits: journeyStorage.ratelimits.map(limit => ({...limit, simple:{...limit.simple, period:60 as const}})),
  d1_databases: [...journeyStorage.d1_databases, ...(d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [])],
  r2_buckets: [...journeyStorage.r2_buckets, ...(r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [])],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});
