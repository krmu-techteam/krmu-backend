export interface Blog {
  id: number;
  wp_id: number;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  categories: unknown;
  seo_title: string | null;
  seo_description: string | null;
  status: 'published' | 'draft';
  created_at: Date;
  updated_at: Date;
}

export interface BlogResponse {
  data: Blog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export interface CountResult {
  total: number;
}
