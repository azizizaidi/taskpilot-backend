import { successResponse } from "../utils/apiResponse.js";
import { getActivityLogs } from "../services/activityLogService.js";

export const getActivityLogsHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { logs, meta } = await getActivityLogs({ page, limit });

    return successResponse(
      res,
      200,
      "Activity logs fetched successfully",
      {
        logs
      },
      meta
    );
  } catch (error) {
    next(error);
  }
};
