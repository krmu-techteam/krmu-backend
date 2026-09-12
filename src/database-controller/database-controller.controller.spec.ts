import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseControllerController } from './database-controller.controller';

describe('DatabaseControllerController', () => {
  let controller: DatabaseControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseControllerController],
    }).compile();

    controller = module.get<DatabaseControllerController>(DatabaseControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
