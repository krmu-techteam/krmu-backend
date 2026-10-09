import { Test, TestingModule } from '@nestjs/testing';
import { PostCategoriesController } from './post-categories.controller';

describe('PostCategoriesController', () => {
  let controller: PostCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostCategoriesController],
    }).compile();

    controller = module.get<PostCategoriesController>(PostCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
