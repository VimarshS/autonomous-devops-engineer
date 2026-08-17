import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { GitHubService } from './github.service';

@ApiTags('github')
@ApiBearerAuth()
@Controller('github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('repos')
  @ApiOperation({ summary: 'List user GitHub repositories' })
  listRepos(@CurrentUser() user: Record<string, unknown>) {
    return this.githubService.listRepositories(user['id'] as string);
  }

  @Get('repos/:owner/:repo')
  @ApiOperation({ summary: 'Get a specific repository' })
  getRepo(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.githubService.getRepository(user['id'] as string, owner, repo);
  }

  @Get('repos/:owner/:repo/tree')
  @ApiOperation({ summary: 'Get file tree for a repository' })
  getFileTree(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch: string = 'main',
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.githubService.getFileTree(
      user['id'] as string,
      owner,
      repo,
      branch,
    );
  }

  @Get('repos/:owner/:repo/key-files')
  @ApiOperation({ summary: 'Get key files for stack detection' })
  getKeyFiles(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch: string = 'main',
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.githubService.getKeyFiles(
      user['id'] as string,
      owner,
      repo,
      branch,
    );
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'GitHub webhook receiver' })
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
  ) {
    return this.githubService.handleWebhook(event, signature, req.rawBody, body);
  }
}