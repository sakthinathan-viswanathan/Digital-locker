const express = require("express");
const { getSharedFileInfo, downloadSharedFile } = require("../controllers/publicShare.controller");

const router = express.Router();

// Intentionally NOT behind requireAuth — anyone with the token/link can
// view and download the file, same as any other "share via link" feature.
router.get("/:token", getSharedFileInfo);
router.get("/:token/download", downloadSharedFile);

module.exports = router;