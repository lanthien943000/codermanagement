const utilsHelper = {};

utilsHelper.sendResponse = (res, status, success, data, errors, message) => {
  const response = {};
  if (success) response.success = success;
  if (data) response.data = data;
  if (errors) response.errors = errors;
  if (message) response.message = message;
  return res.status(status).json(response);
};

class AppError extends Error {
  constructor(statusCode, message, errorType) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    // all errors using this class are operational errors.
    this.isOperational = true;
    // create a stack trace for debugging (Error obj, void obj to avoid stack polution)
    Error.captureStackTrace(this, this.constructor);
  }
}

utilsHelper.AppError = AppError;

// let ObjectId = require("mongoose").Types.ObjectId;
// utilsHelper.validator = (id) => {
//   if (ObjectId.isValid(id)) {
//     return true;
//   } else {
//     throw new AppError(400, "Invalid information: id", "Bad Request");
//   }
// };

module.exports = utilsHelper;
