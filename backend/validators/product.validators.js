const { body } = require("express-validator");

const validateCreateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be 3-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description is too long"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),

  body("discount_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be non-negative")
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error("Discount price must be less than regular price");
      }
      return true;
    }),

  body("stock")
    .notEmpty()
    .withMessage("Stock quantity is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category_id")
    .notEmpty()
    .withMessage("Category is required")
    .isInt()
    .withMessage("Invalid category ID"),
];

const validateUpdateProduct = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be 3-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description is too long"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),

  body("discount_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be non-negative")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.price &&
        parseFloat(value) >= parseFloat(req.body.price)
      ) {
        throw new Error("Discount price must be less than regular price");
      }
      return true;
    }),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category_id").optional().isInt().withMessage("Invalid category ID"),
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
