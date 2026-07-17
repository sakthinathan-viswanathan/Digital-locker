const express = require("express");
const { uploadFile, listFiles, downloadFile, deleteFile, moveFile, renameFile } = require("../controllers/file.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", listFiles);
router.post("/", uploadFile);
router.get("/:id/download", downloadFile);
router.patch("/:id/move", moveFile);
router.patch("/:id/rename", renameFile);
router.delete("/:id", deleteFile);

module.exports = router;
