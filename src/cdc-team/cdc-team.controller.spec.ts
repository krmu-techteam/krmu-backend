import { Test, TestingModule } from '@nestjs/testing';
import { CdcTeamController } from './cdc-team.controller';

describe('CdcTeamController', () => {
  let controller: CdcTeamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CdcTeamController],
    }).compile();

    controller = module.get<CdcTeamController>(CdcTeamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
