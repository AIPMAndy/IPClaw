/**
 * Setup CLI entry point.
 * Usage: npx tsx setup/index.ts --step <name> [args...]
 */
import { logger } from '../src/logger.js';
import { commandExists } from './platform.js';
import { emitStatus } from './status.js';

const STEPS: Record<
  string,
  () => Promise<{ run: (args: string[]) => Promise<void> }>
> = {
  environment: () => import('./environment.js'),
  container: () => import('./container.js'),
  'whatsapp-auth': () => import('./whatsapp-auth.js'),
  groups: () => import('./groups.js'),
  register: () => import('./register.js'),
  mounts: () => import('./mounts.js'),
  service: () => import('./service.js'),
  verify: () => import('./verify.js'),
};

function detectPreferredRuntime(): 'apple-container' | 'docker' | null {
  if (commandExists('container')) {
    return 'apple-container';
  }
  if (commandExists('docker')) {
    return 'docker';
  }
  return null;
}

async function runGuidedSetup(): Promise<void> {
  console.log(
    'No --step provided. Running quick environment check and showing next actions.\n',
  );

  try {
    const environment = await STEPS.environment();
    await environment.run([]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, 'Quick environment check failed');
    console.warn(`[WARN] Environment check skipped: ${message}`);
  }

  const runtime = detectPreferredRuntime();

  console.log('\nQuick setup guide:');
  if (runtime) {
    console.log(
      `1) Prepare container runtime: npm run setup -- --step container --runtime ${runtime}`,
    );
  } else {
    console.log('1) Install and start a container runtime (Docker or Apple Container).');
    console.log(
      '   Then run: npm run setup -- --step container --runtime <docker|apple-container>',
    );
  }
  console.log('2) Authenticate channel: npm run setup -- --step whatsapp-auth');
  console.log('3) Configure groups: npm run setup -- --step groups');
  console.log('4) Register groups: npm run setup -- --step register');
  console.log('5) Verify readiness: npm run setup -- --step verify\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const stepIdx = args.indexOf('--step');

  if (stepIdx === -1 || !args[stepIdx + 1]) {
    await runGuidedSetup();
    return;
  }

  const stepName = args[stepIdx + 1];
  const stepArgs = args.filter(
    (a, i) => i !== stepIdx && i !== stepIdx + 1 && a !== '--',
  );

  const loader = STEPS[stepName];
  if (!loader) {
    console.error(`Unknown step: ${stepName}`);
    console.error(`Available steps: ${Object.keys(STEPS).join(', ')}`);
    process.exit(1);
  }

  try {
    const mod = await loader();
    await mod.run(stepArgs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, step: stepName }, 'Setup step failed');
    emitStatus(stepName.toUpperCase(), {
      STATUS: 'failed',
      ERROR: message,
    });
    process.exit(1);
  }
}

main();
