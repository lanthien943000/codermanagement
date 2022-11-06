const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getTasksByUserId,
} = require("../controllers/user.controller");

router.post("/", createUser);

router.get("/", getUsers);

router.get("/:targetId", getUserById);

router.put("/:targetId", updateUserById);

router.delete("/:targetId", deleteUserById);

router.get("/:targetId/tasks", getTasksByUserId);

module.exports = router;
