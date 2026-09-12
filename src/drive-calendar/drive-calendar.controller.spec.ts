import { Test, TestingModule } from '@nestjs/testing';
import { DriveCalendarController } from './drive-calendar.controller';

describe('DriveCalendarController', () => {
  let controller: DriveCalendarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriveCalendarController],
    }).compile();

    controller = module.get<DriveCalendarController>(DriveCalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
