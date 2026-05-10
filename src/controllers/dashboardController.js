import { successResponse } from "../utils/apiResponse.js";
import { getDashboardStats } from "../services/dashboardService.js";

export const getDashboardStatsHandler = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user);

    return successResponse(
      res,
      200,
      "Dashboard stats retrieved successfully",
      stats
    );
  } catch (error) {
    next(error);
  }
};
