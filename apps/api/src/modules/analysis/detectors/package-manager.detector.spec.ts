import { detectPackageManager } from './package-manager.detector';

describe('detectPackageManager', () => {
  it('detects npm from package-lock.json', () => {
    const ctx = { fileTree: ['package-lock.json', 'package.json'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('NPM');
  });

  it('detects yarn from yarn.lock', () => {
    const ctx = { fileTree: ['yarn.lock', 'package.json'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('YARN');
  });

  it('detects pnpm from pnpm-lock.yaml', () => {
    const ctx = { fileTree: ['pnpm-lock.yaml', 'package.json'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('PNPM');
  });

  it('detects poetry from poetry.lock', () => {
    const ctx = { fileTree: ['poetry.lock', 'pyproject.toml'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('POETRY');
  });

  it('detects pip from requirements.txt', () => {
    const ctx = { fileTree: ['requirements.txt'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('PIP');
  });

  it('detects go modules from go.sum', () => {
    const ctx = { fileTree: ['go.mod', 'go.sum'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('GO_MOD');
  });

  it('returns UNKNOWN for empty repo', () => {
    const ctx = { fileTree: [], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('UNKNOWN');
  });

  it('prefers bun over npm when bun.lockb exists', () => {
    const ctx = { fileTree: ['bun.lockb', 'package-lock.json', 'package.json'], keyFiles: {} };
    expect(detectPackageManager(ctx)).toBe('BUN');
  });
});