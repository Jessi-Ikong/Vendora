const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract just the error messages cleanly
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  next(); // no errors — proceed to controller
};

module.exports = validate;
