import { successResponse } from "../utils/apiResponse.js";
import { getUsers } from "../services/userService.js";

export const getUsersHandler = async (req, res, next) => {
  try {
    const result = await getUsers(req.query);

    return successResponse(res, 200, "Users retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};
