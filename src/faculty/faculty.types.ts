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

export interface Faculty {
  id: number;

  school_category_id: number | null;

  name: string;

  slug: string;

  designation: string;

  qualification: string;

  image_url: string | null;

  emails: string[] | null;

  linkedin_profiles: string[] | null;

  interest_areas: string[] | null;

  profile: string | null;

  education: string | null;

  experience: string | null;

  research: string | null;

  projects_achievements: string | null;

  conferences: string | null;

  publications: string | null;

  status: 'published' | 'draft';

  sort_order: number;

  created_at: Date;

  updated_at: Date;
}
