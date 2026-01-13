import { categories } from "../database/schema/category.js";
import { desc, eq, inArray, ilike } from "drizzle-orm";
import { products } from "../database/schema/product.js";
import { productCategories } from "../database/schema/productCategory.js";
import { reformatCategoryNameResponse } from "../helpers/reformatCategoryName.js";
import { db } from "../database/db.js";
import { setAuthCookies } from "../middlewares/setAuth.js";

/**
 * @function getProducts
 * 1. Fetch all products with their associated categories
 * 2. Filter products by one or more category IDs (AND condition)
 * 
 * The response includes:
 * - Product details (id, name, price)
 * - Array of associated categories for each product
 * - Products are ordered by creation date (newest first)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.categoryIds] - Optional JSON string of category IDs to filter by
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with products data
 * 
 * @example
 * 
 *  Request body:
 * {
 *   "categoryIds": [1, 4]
 * }
 * 
 *  Success response:
 * {
	"message": "Products fetched successfully",
	"status": "success",
	"data": [
		{
		"id": 20,
		"name": "4",
		"price": 3,
		"categories": [
			{
				"id": 1,
				"name": "eletronics"
			},
			{
				"id": 4,
				"name": "female clothing"
			}
		]
	}
}
 * 
 */

export const getProducts = async (req, res) => {
  let { categoryIds, name: productNameSearch } = req.query;
  const { user } = req;

  console.log("user", user);

  // Parse categoryIds if provided
  if (categoryIds) {
    categoryIds = JSON.parse(categoryIds);
  }

  let matchingProductIds = [];

  // If category filter is provided
  if (categoryIds && categoryIds.length > 0) {
    // Step 1: Find product-category pairs for filter
    const rows = await db
      .select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, categoryIds));

    // Group by productId and count how many of the required categories it has
    const countMap = new Map();

    console.log("rows", rows);

    for (const row of rows) {
      if (!countMap.has(row.productId)) {
        countMap.set(row.productId, new Set());
      }
      countMap.get(row.productId).add(row.categoryId);
    }

    console.log("countMap", countMap);

    console.log("map entries", Array.from(countMap.entries()));

    // Keep only products that matched *all* required categories
    matchingProductIds = Array.from(countMap.entries())
      .filter(([_, catSet]) => categoryIds.every((id) => catSet.has(id)))
      .map(([productId]) => productId);

    console.log("matchingProductIds", matchingProductIds);

    // Return empty array if no products match all categories
    if (matchingProductIds.length === 0) {
      return res.json({
        message: "No products found",
        status: "success",
        data: [],
      });
    }
  }

  // Step 2: Fetch all products (matching filter if applied) and ALL of their categories
  let baseQuery = db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .orderBy(desc(products.createdAt));

  // Apply category filter if provided
  if (categoryIds && categoryIds.length > 0) {
    baseQuery = baseQuery.where(inArray(products.id, matchingProductIds));
  }

  if (productNameSearch) {
    baseQuery = baseQuery.where(ilike(products.name, `%${productNameSearch}%`));
  }

  const rows = await baseQuery;

  const newQuery = await db
    .select({
      product: products,
      // category: categories,
      productCategory: productCategories,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    // .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .orderBy(desc(products.createdAt));

  // Step 3: Group products and include all their categories
  let productMap = new Map();

  // console.log("rows", rows);

  for (const row of rows) {
    const product = row.product;
    const category = row.category;

    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        categories: [],
      });
    }

    productMap.get(product.id).categories.push({
      id: category.id,
      name: reformatCategoryNameResponse(category.name),
    });
  }

  // console.log("productMap", productMap.values());

  // Return success response with products data
  res.json({
    message: "Products fetched successfully",
    status: "success",
    data: Array.from(productMap.values()),
  });
};

/**
 * @function addProduct
 * @description Adds a new product to the database with associated categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} req.body.name - Name of the product
 * @param {number} req.body.price - Price of the product
 * @param {number[]} req.body.categoryIds - Array of category IDs to associate with the product
 * @returns {Object} JSON response with success/error message and product data
 * @throws {400} If product already exists
 * @throws {400} If no valid categories are found
 * @example
 * // Request body:
 * {
 *   "name": "New Product",
 *   "price": 19.99,
 *   "categoryIds": [1, 2]
 * }
 *
 * // Success response:
 * {
 *   "message": "Product added successfully",
 *   "status": "success",
 *   "data": {
 *     "id": 123,
 *     "name": "New Product",
 *     "price": 19.99,
 *     "categories": [
 *       { "id": 1, "name": "category one" },
 *       { "id": 2, "name": "category two" }
 *     ]
 *   }
 * }
 */
export const addProduct = async (req, res) => {
  const { name, price, categoryIds } = req.body;

  // Check if product with same name already exists
  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.name, name));

  if (existingProduct.length > 0) {
    return res.status(400).json({
      message: "Product already exists",
      status: "error",
    });
  }

  // Validate that provided category IDs exist in database
  const existingCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, categoryIds));

  if (existingCategories.length === 0) {
    return res.status(400).json({
      message: "Category not found",
      status: "error",
    });
  }

  /*

  utilizing transaction function to ensure atomic updates

  if one fails, the entire transaction is rolled back to ensure data integrity

  */
  const newProduct = await db.transaction(async (tx) => {
    // Insert new product
    const [insertedProduct] = await tx
      .insert(products)
      .values({
        name,
        price,
      })
      .returning();

    // Create product-category associations
    await tx.insert(productCategories).values(
      categoryIds.map((categoryId) => ({
        productId: insertedProduct.id,
        categoryId,
      }))
    );

    return insertedProduct;
  });

  // Fetch the newly created product with its associated categories
  const productWithCategories = await db
    .select({
      product: products,
      category: categories,
    })
    .from(productCategories)
    .innerJoin(products, eq(products.id, productCategories.productId))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(eq(productCategories.productId, newProduct.id));

  setAuthCookies(res, { id: newProduct.id });

  // Return success response with product data
  res.json({
    message: "Product added successfully",
    status: "success",
    data: {
      ...newProduct,
      categories: productWithCategories.map((row) => {
        return {
          id: row.category.id,
          name: reformatCategoryNameResponse(row.category.name),
        };
      }),
    },
  });
};

/**
 * @function editProduct
 * @description Updates an existing product and its category associations
 * @param {Object} req.body - Request body containing product details
 * @param {number} req.body.id - ID of the product to update
 * @param {string} req.body.name - New name for the product (optional)
 * @param {number} req.body.price - New price for the product (optional)
 * @param {number[]} req.body.categoryIds - Array of category IDs to associate with the product
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated product data or error message
 * @throws {404} If product not found
 * @throws {400} If no valid categories are found
 *
 * @example
 *  Request body example
 * {
 *   "id": 1,
 *   "name": "Updated Product",
 *   "price": 19.99,
 *   "categoryIds": [2, 3]
 * }
 *
 * @example
 *  Success response
 * {
 *   "message": "Product updated successfully",
 *   "status": "success",
 *   "data": {
 *     "id": 1,
 *     "name": "Updated Product",
 *     "price": 19.99,
 *     "categories": [
 *       { "id": 2, "name": "Category 2" },
 *       { "id": 3, "name": "Category 3" }
 *     ]
 *   }
 * }
 *
 * @example
 *  Error response
 * {
 *   "message": "Product not found",
 *   "status": "error"
 * }
 */

export const editProduct = async (req, res) => {
  const { id, name, price, categoryIds } = req.body;

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (existingProduct.length === 0) {
    return res.status(404).json({
      message: "Product not found",
      status: "error",
    });
  }

  /*

  utilizing transaction function to ensure atomic updates

  if one fails, the entire transaction is rolled back to ensure data integrity

  */
  const updatedProduct = await db.transaction(async (tx) => {
    // 1. Update the product fields
    const [product] = await tx
      .update(products)
      .set({
        ...(name && { name }),
        ...(price && { price: Number(price) }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, Number(id)))
      .returning();

    // 2. If categoryIds are provided, update categories
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      // Validate categories
      const validCategories = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      const validCategoryIds = validCategories.map((cat) => cat.id);

      // Remove old relations
      await tx
        .delete(productCategories)
        .where(eq(productCategories.productId, Number(id)));

      // Add new relations
      await tx.insert(productCategories).values(
        validCategoryIds.map((categoryId) => ({
          productId: Number(id),
          categoryId,
        }))
      );
    }

    return product;
  });

  // 3. Fetch updated categories
  const productWithCategories = await db
    .select({
      product: products,
      category: categories,
    })
    .from(productCategories)
    .innerJoin(products, eq(products.id, productCategories.productId))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(eq(productCategories.productId, Number(id)));

  res.json({
    message: "Product updated successfully",
    status: "success",
    data: {
      ...updatedProduct,
      categories: productWithCategories.map((row) => {
        return {
          id: row.category.id,
          name: reformatCategoryNameResponse(row.category.name),
        };
      }),
    },
  });
};

/**
 * @function deleteProduct
 * @description Deletes a product from the database by ID
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.id - ID of the product to delete
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success/error message and deleted product data
 * @throws {404} If product with given ID is not found
 * @example
 *  Request:
 *  DELETE /api/product?id=123
 *
 *  Success response:
 * {
 *   "message": "Product deleted successfully",
 *   "status": "success",
 *   "data": [{
 *     "id": 123,
 *     "name": "Deleted Product",
 *     "price": 19.99
 *   }]
 * }
 *
 *  Error response:
 * {
 *   "message": "Product not found",
 *   "status": "error"
 * }
 */
export const deleteProduct = async (req, res) => {
  const { id } = req.query;

  const existing = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)));

  if (existing.length === 0) {
    return res.status(404).json({
      message: "Product not found",
      status: "error",
    });
  }

  const deletedProduct = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  res.json({
    message: "Product deleted successfully",
    status: "success",
    data: deletedProduct,
  });
};
