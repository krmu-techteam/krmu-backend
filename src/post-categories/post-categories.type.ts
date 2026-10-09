export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category_url: string | null;
  taxonomy: string;
  parent_id: number;
}

export interface CountResult {
  total: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostCategoryResponse {
  data: PostCategory[];
  pagination: Pagination;
}
