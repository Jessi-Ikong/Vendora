const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
  getAddresses,
  addAddress,
  editAddress,
  removeAddress,
  makeDefault,
} = require("../controllers/address.controller");

// All address routes require login
router.get("/", verifyToken, getAddresses);
router.post("/", verifyToken, addAddress);
router.put("/:id", verifyToken, editAddress);
router.delete("/:id", verifyToken, removeAddress);
router.put("/:id/set-default", verifyToken, makeDefault);

module.exports = router;
