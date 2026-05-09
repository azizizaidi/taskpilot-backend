import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  getCurrentUser,
  loginUser,
  registerUser
} from "../services/authService.js";

const validateRegisterInput = ({ name, email, password }) => {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  }

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

const validateLoginInput = ({ email, password }) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
};

const hasErrors = (errors) => Object.keys(errors).length > 0;

export const register = async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRegisterInput(body);

    if (hasErrors(errors)) {
      return errorResponse(res, 400, "Validation failed", errors);
    }

    const result = await registerUser({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password
    });

    return successResponse(res, 201, "User registered successfully", result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateLoginInput(body);

    if (hasErrors(errors)) {
      return errorResponse(res, 400, "Validation failed", errors);
    }

    const result = await loginUser({
      email: body.email.trim().toLowerCase(),
      password: body.password
    });

    return successResponse(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);

    return successResponse(res, 200, "Current user fetched successfully", {
      user
    });
  } catch (error) {
    next(error);
  }
};
