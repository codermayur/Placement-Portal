const express = require("express");
const { getDepartments } = require("../controllers/metadataController");

const router = express.Router();

router.get("/departments", getDepartments);

module.exports = router;
