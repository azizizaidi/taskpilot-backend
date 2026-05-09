export const successResponse = (
  res,
  statusCode = 200,
  message = "Request successful",
  data = null,
  meta = null
) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res,
  statusCode = 500,
  message = "Internal server error",
  errors = null
) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
