import type { DetectionContext } from './detector.interface';

export function detectPackageManager(ctx: DetectionContext): string {
  const { fileTree } = ctx;

  // Node.js package managers
  if (fileTree.includes('bun.lockb')) return 'BUN';
  if (fileTree.includes('pnpm-lock.yaml')) return 'PNPM';
  if (fileTree.includes('yarn.lock')) return 'YARN';
  if (fileTree.includes('package-lock.json')) return 'NPM';

  // Python package managers
  if (fileTree.includes('poetry.lock')) return 'POETRY';
  if (fileTree.includes('uv.lock')) return 'UV';
  if (fileTree.includes('Pipfile.lock')) return 'PIPENV';
  if (fileTree.includes('requirements.txt')) return 'PIP';

  // Go
  if (fileTree.includes('go.sum')) return 'GO_MOD';

  // Rust
  if (fileTree.includes('Cargo.lock')) return 'CARGO';

  // Java
  if (fileTree.includes('pom.xml')) return 'MAVEN';
  if (fileTree.includes('build.gradle')) return 'GRADLE';

  // Ruby
  if (fileTree.includes('Gemfile.lock')) return 'BUNDLER';

  return 'UNKNOWN';
}