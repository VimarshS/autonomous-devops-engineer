import { IsString } from 'class-validator';

export class TriggerAnalysisDto {
  @IsString()
  projectId: string;
}