// Generates pagination metadata
const paginate = (page, limit) => {
  const pageNumber = parseInt(page) || 1;
  const pageLimit = parseInt(limit) || 12;
  const offset = (pageNumber - 1) * pageLimit;

  return { page: pageNumber, limit: pageLimit, offset };
};

// Generates pagination response metadata
const paginateMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = page;
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  return { total, totalPages, currentPage, hasNext, hasPrev };
};

module.exports = { paginate, paginateMeta };
