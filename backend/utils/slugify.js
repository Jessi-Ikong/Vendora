// Converts "Electronics & Gadgets" → "electronics-gadgets"
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ""); // remove leading/trailing dashes
};

module.exports = slugify;
