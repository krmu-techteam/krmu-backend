export interface DriveCalendar {
  id: number;
  drive_id: string;
  company: string;
  float_date: string | null;
  drive_date: string | null;
  drive_type: 'on_campus' | 'virtual';
  schools_eligible: string | null;
  engagement_type: 'internship' | 'placement' | 'ppo' | 'internship_ppo';
  job_roles: string | null;
  jd_link: string | null;
  detailed_ctc_offered: string | null;
  ctc_offered_lpa: string | null;
  students_registered: number;
  students_appeared: number;
  selected: number;
  status: 'published' | 'draft';
}

export interface DriveCalendarPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DriveCalendarResponse {
  data: DriveCalendar[];
  pagination: DriveCalendarPagination;
}

export interface CountResult {
  total: number;
}
