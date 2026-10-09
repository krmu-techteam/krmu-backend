import { Injectable } from '@nestjs/common';

@Injectable()
export class SlugService {
  async generateUniqueSlug(
    slug: string,
    slugExists: (slug: string) => Promise<boolean>,
  ): Promise<string> {
    let uniqueSlug = slug;
    let count = 1;

    while (await slugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${count}`;
      count++;
    }

    return uniqueSlug;
  }
}
