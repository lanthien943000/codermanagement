const { sendResponse, AppError } = require("../helpers/utils.js");
const ObjectId = require("mongoose").Types.ObjectId;
const User = require("../models/User.js");

const userController = {};

//Create User
userController.createUser = async (req, res, next) => {
  let info = req.body;

  try {
    if (!info) throw new AppError(400, "Missing information", "Bad Request");
    const created = await User.create(info);

    //Send response
    sendResponse(res, 200, true, { created }, null, "Create User Success");
  } catch (err) {
    next(err);
  }
};

//Get Users
userController.getUsers = async (req, res, next) => {
  //in real project you will getting condition from from req then construct the filter object for query
  // empty filter mean get all
  const allowedFilters = ["name", "role"];
  const { name, role, ...filterQuery } = req.query;
  try {
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilters.includes(key))
        throw new AppError(400, `query ${key} is not allowed`, "Bad request");
      //delete query without value
      if (!filterQuery[key]) delete filterQuery[key];
    });

    //Get users
    filterQuery.isDeleted = false; //only show non-deleted
    const listOfUsers = await User.find(filterQuery).populate("tasks");

    // pagination
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let offset = limit * (page - 1);
    let users = listOfUsers.slice(offset, offset + limit);

    let totalUsers = await User.find({ isDeleted: false }).count();
    const userData = { totalUsers, users };

    sendResponse(
      res,
      200,
      true,
      { userData },
      null,
      "Found list of users success"
    );
  } catch (err) {
    next(err);
  }
};

userController.getUserById = async (req, res, next) => {
  //in real project you will getting id from req. For updating and deleting, it is recommended for you to use unique identifier such as _id to avoid duplication
  //you will also get updateInfo from req
  // empty target and info mean update nothing
  const { targetId } = req.params;

  try {
    if (!targetId) throw new AppError(400, "Missing user id", "Bad Request");

    //--Query
    const singleUser = await User.findById(targetId).populate("tasks");

    if (!singleUser)
      sendResponse(
        res,
        404,
        false,
        null,
        "Not found",
        "Can't find user with this id"
      );

    sendResponse(res, 200, true, { singleUser }, null, "Get one user success");
  } catch (err) {
    next(err);
  }
};

userController.updateUserById = async (req, res, next) => {
  //in real project you will getting id from req. For updating and deleting, it is recommended for you to use unique identifier such as _id to avoid duplication
  //you will also get updateInfo from req
  // empty target and info mean update nothing
  const { targetId } = req.params;

  const { ...updateInfo } = req.body;
  const options = { new: true };

  const allowedUpdate = ["name", "role", "idDeleted"];
  try {
    //check valid field
    if (!updateInfo || !targetId)
      throw new AppError(400, "No request body or no User id", "Bad Request");

    const foundUser = await User.findById(targetId);
    if (!foundUser) throw new AppError(404, "User does not exist", "Not Found");

    const updateFields = Object.keys(updateInfo);
    updateFields.forEach((field) => {
      if (!allowedUpdate.includes(field))
        throw new AppError(400, "Update with invalid field", "Bad request");
      if (!updateInfo[field]) delete updateInfo[field];
    });

    //--Query
    const updated = await User.findByIdAndUpdate(targetId, updateInfo, options);

    sendResponse(res, 200, true, { updated }, null, "Update user success");
  } catch (err) {
    next(err);
  }
};

userController.deleteUserById = async (req, res, next) => {
  //in real project you will getting id from req. For updating and deleting, it is recommended for you to use unique identifier such as _id to avoid duplication
  // empty target mean delete nothing
  const { targetId } = req.params;

  const options = { new: true };
  try {
    if (!targetId) throw new AppError(400, "No User id", "Bad Request");
    console.log("hello", targetId);
    //--Query
    const updated = await User.findByIdAndDelete(targetId, options);

    sendResponse(res, 200, true, { updated }, null, "Delete user success");
  } catch (err) {
    next(err);
  }
};

userController.getTasksByUserId = async (req, res, next) => {
  const { targetId } = req.params;

  try {
    if (!targetId) throw new AppError(400, "Missing user id", "Bad request");
    const userFound = await User.findById(targetId).populate("tasks");
    if (!userFound) sendResponse(res, 404, false, null, null, "No user found");
    sendResponse(
      res,
      200,
      true,
      { tasks: userFound.tasks },
      null,
      "Found user's tasks"
    );
  } catch (error) {
    next(error);
  }
};

//export
module.exports = userController;
