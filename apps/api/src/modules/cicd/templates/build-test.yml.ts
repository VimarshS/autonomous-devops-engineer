export function generateBuildTestWorkflow(config: {
  nodeVersion?: string;
  packageManager?: string;
  testCommand?: string;
  buildCommand?: string;
}): string {
  const nodeVersion = config.nodeVersion ?? '20';
  const installCmd = config.packageManager === 'YARN' ? 'yarn install --frozen-lockfile' :
    config.packageManager === 'PNPM' ? 'pnpm install --frozen-lockfile' : 'npm ci';
  const testCmd = config.testCommand ?? 'npm test';
  const buildCmd = config.buildCommand ?? 'npm run build';

  return `name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'

      - name: Install dependencies
        run: ${installCmd}

      - name: Build
        run: ${buildCmd}

      - name: Test
        run: ${testCmd}
`;
}