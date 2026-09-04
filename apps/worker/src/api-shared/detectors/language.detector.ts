import type { DetectionContext } from './detector.interface';

export function detectLanguage(ctx: DetectionContext): {
  primaryLanguage: string;
  languages: string[];
} {
  const languages: string[] = [];
  const { fileTree, keyFiles } = ctx;

  // TypeScript/JavaScript
  if (keyFiles['package.json']) {
    const pkg = safeParseJson(keyFiles['package.json']);
    if (pkg) {
      const devDeps = (pkg.devDependencies as Record<string, string>) ?? {};
const deps = (pkg.dependencies as Record<string, string>) ?? {};
const hasTypeScript =
  !!devDeps['typescript'] ||
  !!deps['typescript'] ||
        fileTree.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));

      if (hasTypeScript) {
        languages.push('TYPESCRIPT');
      } else {
        languages.push('JAVASCRIPT');
      }
    }
  }

  // Python
  if (
    keyFiles['requirements.txt'] ||
    keyFiles['pyproject.toml'] ||
    keyFiles['Pipfile'] ||
    fileTree.some(f => f.endsWith('.py'))
  ) {
    languages.push('PYTHON');
  }

  // Go
  if (keyFiles['go.mod'] || fileTree.some(f => f.endsWith('.go'))) {
    languages.push('GO');
  }

  // Rust
  if (keyFiles['Cargo.toml'] || fileTree.some(f => f.endsWith('.rs'))) {
    languages.push('RUST');
  }

  // Java
  if (
    keyFiles['pom.xml'] ||
    keyFiles['build.gradle'] ||
    fileTree.some(f => f.endsWith('.java'))
  ) {
    languages.push('JAVA');
  }

  // Ruby
  if (keyFiles['Gemfile'] || fileTree.some(f => f.endsWith('.rb'))) {
    languages.push('RUBY');
  }

  const primaryLanguage = languages[0] ?? 'UNKNOWN';
  return { primaryLanguage, languages };
}

export function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}