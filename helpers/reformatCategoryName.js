/**
 * @function reformatCategoryNameInput
 * @description Converts a category name from a human-readable format to a database-friendly format.
 * - Converts the name to lowercase
 * - Replaces spaces with underscores
 * - Trims whitespace
 * @param {string} name - The category name to reformat
 * @returns {string|null} The reformatted name or null if input is falsy
 * @example
 *  Returns "category_name"
 * reformatCategoryNameInput("Category Name")
 *
 *  Returns "category"
 * reformatCategoryNameInput("Category")
 */
export const reformatCategoryNameInput = (name) => {
  if (!name) return null;

  const lowerCaseName = name.toLowerCase();
  if (
    typeof lowerCaseName === "string" &&
    lowerCaseName.split(" ").length >= 2
  ) {
    return lowerCaseName.split(" ").join("_").trim();
  }
  return lowerCaseName;
};

/**
 * @function reformatCategoryNameResponse
 * @description Converts a category name from a database-friendly format to a human-readable format.
 * - Converts the name to lowercase
 * - Replaces underscores with spaces
 * - Trims whitespace
 * @param {string} name - The category name to reformat
 * @returns {string|null} The reformatted name or null if input is falsy
 * @example
 *  Returns "category name"
 * reformatCategoryNameResponse("category_name")
 *
 *  Returns "category"
 * reformatCategoryNameResponse("category")
 */
export const reformatCategoryNameResponse = (name) => {
  if (!name) return null;

  const lowerCaseName = name.toLowerCase();
  if (
    typeof lowerCaseName === "string" &&
    lowerCaseName.split("_").length >= 2
  ) {
    return lowerCaseName.split("_").join(" ").trim();
  }
  return lowerCaseName;
};
