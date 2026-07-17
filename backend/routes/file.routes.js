const express = require("express");
const {
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  moveFile,
  renameFile,
  createShareLink,
  getShareStatus,
  revokeShareLink,
} = require("../controllers/file.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", listFiles);
router.post("/", uploadFile);
router.get("/:id/download", downloadFile);
router.patch("/:id/move", moveFile);
router.patch("/:id/rename", renameFile);
router.delete("/:id", deleteFile);
router.get("/:id/share", getShareStatus);
router.post("/:id/share", createShareLink);
router.delete("/:id/share", revokeShareLink);

module.exports = router;