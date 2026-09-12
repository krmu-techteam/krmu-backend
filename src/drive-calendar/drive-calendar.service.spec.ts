import { Test, TestingModule } from '@nestjs/testing';
import { DriveCalendarService } from './drive-calendar.service';

describe('DriveCalendarService', () => {
  let service: DriveCalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriveCalendarService],
    }).compile();

    service = module.get<DriveCalendarService>(DriveCalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
