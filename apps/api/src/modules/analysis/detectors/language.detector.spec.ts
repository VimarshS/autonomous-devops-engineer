import { detectLanguage } from './language.detector';

describe('detectLanguage', () => {
  it('detects TypeScript from package.json with typescript dependency', () => {
    const ctx = {
      fileTree: ['package.json', 'tsconfig.json'],
      keyFiles: {
        'package.json': JSON.stringify({
          devDependencies: { typescript: '^5.0.0' },
        }),
      },
    };
    const result = detectLanguage(ctx);
    expect(result.primaryLanguage).toBe('TYPESCRIPT');
    expect(result.languages).toContain('TYPESCRIPT');
  });

  it('detects JavaScript when no typescript dependency', () => {
    const ctx = {
      fileTree: ['package.json'],
      keyFiles: {
        'package.json': JSON.stringify({
          dependencies: { express: '^4.0.0' },
        }),
      },
    };
    const result = detectLanguage(ctx);
    expect(result.primaryLanguage).toBe('JAVASCRIPT');
  });

  it('detects Python from requirements.txt', () => {
    const ctx = {
      fileTree: ['requirements.txt', 'main.py'],
      keyFiles: { 'requirements.txt': 'fastapi\nuvicorn\n' },
    };
    const result = detectLanguage(ctx);
    expect(result.languages).toContain('PYTHON');
  });

  it('detects Go from go.mod', () => {
    const ctx = {
      fileTree: ['go.mod', 'main.go'],
      keyFiles: { 'go.mod': 'module myapp\ngo 1.21\n' },
    };
    const result = detectLanguage(ctx);
    expect(result.languages).toContain('GO');
  });

  it('returns UNKNOWN for empty repo', () => {
    const ctx = { fileTree: [], keyFiles: {} };
    const result = detectLanguage(ctx);
    expect(result.primaryLanguage).toBe('UNKNOWN');
  });
});