import { Test, TestingModule } from '@nestjs/testing';
import { CdcTeamService } from './cdc-team.service';

describe('CdcTeamService', () => {
  let service: CdcTeamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CdcTeamService],
    }).compile();

    service = module.get<CdcTeamService>(CdcTeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
