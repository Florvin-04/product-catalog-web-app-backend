import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { products } from "./product.js";
import { categories } from "./category.js";

export const productCategories = pgTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.productId, table.categoryId),
  })
);
