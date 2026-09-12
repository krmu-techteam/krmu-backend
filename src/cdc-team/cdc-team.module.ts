import { Module } from '@nestjs/common';

import { CdcTeamController } from './cdc-team.controller';
import { CdcTeamService } from './cdc-team.service';
import { CdcTeamRepository } from './cdc-team.repository';

import { CloudflareModule } from '../cloudfare/cloudflare.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    CloudflareModule,
    DatabaseModule,
  ],

  controllers: [
    CdcTeamController,
  ],

  providers: [
    CdcTeamService,
    CdcTeamRepository,
  ],

  exports: [
    CdcTeamService,
  ],
})
export class CdcTeamModule {}