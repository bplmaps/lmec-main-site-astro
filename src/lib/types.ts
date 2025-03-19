export interface Tag {
  name: string;
  taggings_count: number;
  slug?: string;
}

export interface PageData {
  currentPage?: number;
  params?: any[];
  data?: any[];
}
