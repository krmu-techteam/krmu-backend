export class NewsEvent {
  id: number;

  title: string;

  slug: string;

  content?: string;

  excerpt?: string;

  link?: string;

  image_url: string;

  featured_images: string;

  published_at: Date;

  modified_at?: Date;

  event_date?: Date;

  event_location?: string;

  created_at?: Date;

  updated_at?: Date;
}
