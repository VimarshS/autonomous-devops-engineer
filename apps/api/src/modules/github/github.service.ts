import { Injectable, UnauthorizedException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  language: string | null;
  default_branch: string;
  updated_at: string;
  stargazers_count: number;
}

@Injectable()
export class GitHubService {
  constructor(private readonly db: DatabaseService) {}

  private async getGitHubToken(userId: string): Promise<string> {
    const account = await this.db.account.findFirst({
      where: {
        userId,
        providerId: 'github',
      },
      select: { accessToken: true },
    });

    if (!account?.accessToken) {
      throw new UnauthorizedException(
        'No GitHub account connected. Please sign in with GitHub.',
      );
    }

    return account.accessToken;
  }

  private async githubRequest<T>(
    token: string,
    path: string,
  ): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async listRepositories(userId: string) {
    const token = await this.getGitHubToken(userId);

    const repos = await this.githubRequest<GitHubRepo[]>(
      token,
      '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
    );

    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      language: repo.language,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count,
    }));
  }

  async getRepository(userId: string, owner: string, repo: string) {
    const token = await this.getGitHubToken(userId);

    const repoData = await this.githubRequest<GitHubRepo>(
      token,
      `/repos/${owner}/${repo}`,
    );

    return {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      private: repoData.private,
      url: repoData.html_url,
      cloneUrl: repoData.clone_url,
      language: repoData.language,
      defaultBranch: repoData.default_branch,
      updatedAt: repoData.updated_at,
      stars: repoData.stargazers_count,
    };
  }

  async getFileTree(userId: string, owner: string, repo: string, branch: string) {
    const token = await this.getGitHubToken(userId);

    const tree = await this.githubRequest<{
      tree: Array<{ path: string; type: string; size?: number }>;
    }>(
      token,
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    );

    return tree.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path);
  }

  async getFileContent(
    userId: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<string> {
    const token = await this.getGitHubToken(userId);

    const file = await this.githubRequest<{
      content: string;
      encoding: string;
    }>(token, `/repos/${owner}/${repo}/contents/${path}`);

    if (file.encoding === 'base64') {
      return Buffer.from(file.content, 'base64').toString('utf-8');
    }

    return file.content;
    
  }
  async getKeyFiles(userId: string, owner: string, repo: string, branch: string) {
  const token = await this.getGitHubToken(userId);

  const tree = await this.githubRequest<{
    tree: Array<{ path: string; type: string; size?: number }>;
  }>(
    token,
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );

  const allFiles = tree.tree
    .filter(item => item.type === 'blob')
    .map(item => item.path);

  // Key files that tell us about the tech stack
  const keyFilePatterns = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'requirements.txt',
    'pyproject.toml',
    'Pipfile',
    'go.mod',
    'go.sum',
    'Cargo.toml',
    'pom.xml',
    'build.gradle',
    'Gemfile',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.dockerignore',
    '.github/workflows',
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
    'vite.config.ts',
    'vite.config.js',
    'tsconfig.json',
    'nest-cli.json',
    'angular.json',
    '.env.example',
    '.env.sample',
  ];

  const keyFiles = allFiles.filter(file =>
    keyFilePatterns.some(pattern =>
      file === pattern || file.endsWith('/' + pattern)
    )
  );

  return {
    totalFiles: allFiles.length,
    allFiles,
    keyFiles,
  };
}
}