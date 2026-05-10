export const getPagination = (query = {}) => {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const requestedLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

export const getPaginationMeta = ({ page, limit, totalItems }) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

export const parseOptionalPositiveInt = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    const error = new Error(`${fieldName} must be a valid positive number`);
    error.statusCode = 400;
    throw error;
  }

  return parsedValue;
};
