const { body } = require("express-validator");

const validateCheckout = [
  body("address_id").optional().isInt().withMessage("Invalid address ID"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes too long"),
];

module.exports = {
  validateCheckout,
};
