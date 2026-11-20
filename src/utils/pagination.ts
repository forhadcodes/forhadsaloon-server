export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export const getPagination = (page: number, limit: number): Pagination => ({
  page,
  limit,
  skip: (page - 1) * limit,
});

export const getTotalPages = (total: number, limit: number): number =>
  Math.max(1, Math.ceil(total / limit));
