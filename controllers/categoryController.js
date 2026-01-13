import { eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { categories } from "../database/schema/category.js";
import {
  reformatCategoryNameInput,
  reformatCategoryNameResponse,
} from "../helpers/reformatCategoryName.js";

/**
 * @function getCategories
 * @description Fetches all categories from the database and returns them in a human-readable format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message and array of categories
 * @example
 * // Success response:
 * {
 *   "message": "Categories fetched successfully",
 *   "status": "success",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "category one"
 *     },
 *     {
 *       "id": 2,
 *       "name": "category two"
 *     }
 *   ]
 * }
 */
export const getCategories = async (req, res) => {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories);

  res.json({
    message: "Categories fetched successfully",
    status: "success",
    data: allCategories.map((category) => ({
      id: category.id,
      name: reformatCategoryNameResponse(category.name),
    })),
  });
};

/**
 * @function addCategory
 * @description Adds a new category to the database
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Name of the category to add
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success/error message and category data
 * @throws {400} If name is not provided
 * @throws {400} If category with same name already exists
 * @example
 *  Request body:
 * {
 *   "name": "New Category"
 * }
 *
 *  Success response:
 * {
 *   "message": "Category added successfully",
 *   "status": "success",
 *   "data": [{
 *     "id": 123,
 *     "name": "new category"
 *   }]
 * }
 *
 *  Error response (missing name):
 * {
 *   "message": "Name is required",
 *   "status": "error"
 * }
 *
 *  Error response (duplicate category):
 * {
 *   "message": "Category already exists",
 *   "status": "error"
 * }
 */
export const addCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      message: "Name is required",
      status: "error",
    });
  }

  const formattedCategoryName = reformatCategoryNameInput(name);

  const existingCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.name, formattedCategoryName));

  if (existingCategory.length > 0) {
    return res.status(400).json({
      message: "Category already exists",
      status: "error",
    });
  }

  const category = await db
    .insert(categories)
    .values({ name: formattedCategoryName })
    .returning({
      id: categories.id,
      name: categories.name,
    });

  const response = category.map((c) => ({
    id: c.id,
    name: reformatCategoryNameResponse(c.name),
  }));

  res.json({
    message: "Category added successfully",
    status: "success",
    data: response,
  });
};
