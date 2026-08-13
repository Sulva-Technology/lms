export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
