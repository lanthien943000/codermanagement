const { sendResponse, AppError } = require("../helpers/utils.js");
const Task = require("../models/Task");
const ObjectId = require("mongoose").Types.ObjectId;

const taskController = {};

taskController.createTask = async (req, res, next) => {
  const info = req.body;
  const allowedFields = ["name", "description", "status", "isDeleted"];
  try {
    if (!info || !info.name || !info.description)
      throw new AppError(400, "Missing information", "Bad request");

    const taskFields = Object.keys(info);
    taskFields.forEach((field) => {
      if (!allowedFields.includes(field)) {
        throw new AppError(400, "Invalid task field", "Bad request");
      }
    });
    //--Query

    const newTask = await Task.create(info);

    sendResponse(
      res,
      200,
      true,
      { data: newTask },
      null,
      "Create task success"
    );
  } catch (error) {
    next(error);
  }
};

taskController.getTasks = async (req, res, next) => {
  const allowedFilter = ["status", "search", "assignee"];
  const { ...filterQuery } = req.query;

  try {
    let filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key))
        throw new AppError(400, `query ${key} is not allowed`, "Bad request");
      //remove malicious query
      if (!filterQuery[key]) {
        delete filterQuery[key];
      }
    });

    //--Query
    let listOfTasks;
    if (!filterKeys.length) {
      listOfTasks = await Task.find({ isDeleted: false }).populate("assignee");
    }
    const { search, status, assignee } = filterQuery;

    //single-case
    if (search) {
      listOfTasks = await Task.find(
        {
          $or: [
            { description: { $regex: `.*${search}.*` } },
            { name: { $regex: `.*${search}.*` } },
          ],
        },
        { isDeleted: false }
      );
    }
    if (status) {
      listOfTasks = await Task.find({ status }, { isDeleted: false });
    }
    if (assignee) {
      listOfTasks = await Task.find({ assignee }, { isDeleted: false });
    }

    // //paring-case
    if (search && status) {
      listOfTasks = await Task.find({
        $and: [
          {
            $or: [
              { description: { $regex: `.*${search}.*` } },
              { name: { $regex: `.*${search}.*` } },
            ],
          },
          { status },
          { isDeleted: false },
        ],
      });
    }
    if (status && assignee) {
      listOfTasks = await Task.find({
        $and: [{ assignee }, { status }, { isDeleted: false }],
      }).populate("assignee");
    }
    if (search && assignee) {
      listOfTasks = await Task.find({
        $and: [
          { assignee },
          {
            $or: [
              { description: { $regex: `.*${search}.*` } },
              { name: { $regex: `.*${search}.*` } },
            ],
          },
          { isDeleted: false },
        ],
      }).populate("assignee");
    }
    //all-case
    if (status && assignee && search) {
      listOfTasks = await Task.find({
        $and: [
          {
            $or: [
              { description: { $regex: `.*${search}.*` } },
              { name: { $regex: `.*${search}.*` } },
            ],
          },
          { assignee },
          { status },
          { isDeleted: false },
        ],
      }).populate("assignee");
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let offset = limit * (page - 1);
    let tasks = listOfTasks.slice(offset, offset + limit);
    const totalTasks = await Task.find({ isDeleted: false }).count();

    //--Send Response
    const data = { totalTasks, tasks };
    sendResponse(res, 200, true, { data }, null, "found list of tasks success");
  } catch (error) {
    next(error);
  }
};

taskController.getTaskById = async (req, res, next) => {
  const { taskId } = req.params;
  try {
    //--Query
    const taskById = await Task.findById(taskId).populate("assignee");

    sendResponse(res, 200, true, { taskById }, null, "Get task by id success");
  } catch (error) {
    next(error);
  }
};

taskController.updateTask = async (req, res, next) => {
  const { taskId } = req.params;
  const updateInfo = req.body;
  const allowedUpdate = ["name", "status", "description", "assignee"];

  try {
    //check param
    ObjectId.isValid(taskId);
    //check body inputs
    if (!updateInfo || !taskId)
      throw new AppError(400, "Missing update info", "Bad request");

    const updateFields = Object.keys(updateInfo);
    updateFields.forEach((field) => {
      if (!allowedUpdate.includes(field)) {
        throw new AppError(400, "Invalid update field!", "Bad request");
      }

      if (!updateInfo[field]) delete updateInfo[field];

      //check if assignee is an array
      if (field === "assignee") {
        if (typeof updateInfo[field] !== "object")
          throw new AppError(400, "assignee must be an array", "Bad request");
      }
    });

    //--Query
    const targetTask = await Task.findById(taskId);
    if (!targetTask) throw new AppError(404, "Task not found", "Bad Request");
    //status
    const { status } = targetTask;
    switch (status) {
      case "done":
        if (updateInfo.status !== "archive") {
          throw new AppError(
            400,
            "Done task can only be stored as archive",
            "Bad request"
          );
        }
        break;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateInfo, {
      new: true,
    }).populate("assignee");

    sendResponse(res, 200, true, { updatedTask }, null, "update task success");
  } catch (error) {
    next(error);
  }
};

taskController.deleteTaskById = async (req, res, next) => {
  const { taskId } = req.params;

  try {
    if (!taskId) throw new AppError(400, "No task id", "Bad Request");

    //--Query
    let targetTask = await Task.findById(taskId);
    if (!targetTask) throw new AppError(404, "Task not found", "Not found");

    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { isDeleted: true },
      { new: true }
    );
    sendResponse(res, 200, true, { deletedTask }, null, "Delete task success");
  } catch (err) {
    next(err);
  }
};
//export
module.exports = taskController;
