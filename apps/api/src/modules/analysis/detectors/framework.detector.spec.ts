import { detectFramework } from './framework.detector';

describe('detectFramework', () => {
  it('detects Next.js from package.json', () => {
    const ctx = {
      fileTree: ['package.json'],
      keyFiles: {
        'package.json': JSON.stringify({
          dependencies: { next: '^14.0.0', react: '^18.0.0' },
        }),
      },
    };
    expect(detectFramework(ctx)).toBe('NEXTJS');
  });

  it('detects NestJS from package.json', () => {
    const ctx = {
      fileTree: ['package.json'],
      keyFiles: {
        'package.json': JSON.stringify({
          dependencies: { '@nestjs/core': '^10.0.0' },
        }),
      },
    };
    expect(detectFramework(ctx)).toBe('NESTJS');
  });

  it('detects FastAPI from requirements.txt', () => {
    const ctx = {
      fileTree: ['requirements.txt'],
      keyFiles: { 'requirements.txt': 'fastapi==0.100.0\nuvicorn\n' },
    };
    expect(detectFramework(ctx)).toBe('FASTAPI');
  });

  it('detects Django from requirements.txt', () => {
    const ctx = {
      fileTree: ['requirements.txt'],
      keyFiles: { 'requirements.txt': 'django==4.2\n' },
    };
    expect(detectFramework(ctx)).toBe('DJANGO');
  });

  it('detects Express from package.json', () => {
    const ctx = {
      fileTree: ['package.json'],
      keyFiles: {
        'package.json': JSON.stringify({
          dependencies: { express: '^4.18.0' },
        }),
      },
    };
    expect(detectFramework(ctx)).toBe('EXPRESS');
  });

  it('returns UNKNOWN for unrecognized stack', () => {
    const ctx = { fileTree: [], keyFiles: {} };
    expect(detectFramework(ctx)).toBe('UNKNOWN');
  });
});