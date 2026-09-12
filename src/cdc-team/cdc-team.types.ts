export interface CdcTeamCard {
  id: number;
  name: string;
  designation: string;
  email: string | null;
  image: string | null;
  sort_order: number;
  status: 'published' | 'draft';
}

export interface CdcTeamPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CdcTeamCardResponse {
  data: CdcTeamCard[];
  pagination: CdcTeamPagination;
}

export interface CountResult {
  total: number;
}