const express = require("express");
const { listFolders, createFolder, renameFolder, deleteFolder } = require("../controllers/folder.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", listFolders);
router.post("/", createFolder);
router.put("/:id", renameFolder);
router.delete("/:id", deleteFolder);

module.exports = router;
