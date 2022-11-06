const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTaskById,
} = require("../controllers/task.controller");

router.post("/", createTask);

router.get("/", getTasks);

router.get("/:taskId", getTaskById);

router.put("/:taskId", updateTask);

router.delete("/:taskId", deleteTaskById);

module.exports = router;
