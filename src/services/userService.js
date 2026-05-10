import prisma from "../utils/prisma.js";
import {
  getPagination,
  getPaginationMeta
} from "../utils/pagination.js";

const roles = ["ADMIN", "MEMBER"];

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  createdAt: true
};

export const getUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const search = typeof query.search === "string" ? query.search.trim() : "";

  if (query.role && !roles.includes(query.role)) {
    const error = new Error("Invalid user role");
    error.statusCode = 400;
    throw error;
  }

  const filters = [];

  if (search) {
    filters.push({
      OR: [
        {
          name: {
            contains: search
          }
        },
        {
          email: {
            contains: search
          }
        }
      ]
    });
  }

  if (query.role) {
    filters.push({
      role: query.role
    });
  }

  const where =
    filters.length > 0
      ? {
          AND: filters
        }
      : {};

  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: {
        name: "asc"
      },
      skip,
      take: limit
    }),
    prisma.user.count({
      where
    })
  ]);

  return {
    items,
    pagination: getPaginationMeta({
      page,
      limit,
      totalItems
    })
  };
};
