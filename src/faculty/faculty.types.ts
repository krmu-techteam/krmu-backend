export interface FacultyCard {
  id: number;
  name: string;
  slug: string;
  designation: string;
  qualification: string;
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

export interface FacultyCardResponse {
  data: FacultyCard[];
  pagination: Pagination;
}

export interface facultyPostType {
  name: string;
  // designation: string;
}
