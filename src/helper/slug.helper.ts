export function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueSlug(
  value: string,
  slugExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(value);

  let slug = baseSlug;
  let counter = 2;

  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
