import { Test, TestingModule } from '@nestjs/testing';
import { PostCategoriesService } from './post-categories.service';

describe('PostCategoriesService', () => {
  let service: PostCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostCategoriesService],
    }).compile();

    service = module.get<PostCategoriesService>(PostCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
