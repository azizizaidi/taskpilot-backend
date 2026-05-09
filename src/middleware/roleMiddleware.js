import { errorResponse } from "../utils/apiResponse.js";

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, "You do not have permission to access this resource");
    }

    next();
  };
};

export const adminOnly = allowRoles("ADMIN");
export const memberOnly = allowRoles("MEMBER");
