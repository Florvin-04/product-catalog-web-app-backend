import { relations } from "drizzle-orm";
import { products } from "./product.js";
import { categories } from "./category.js";
import { productCategories } from "./productCategory.js";

export const productRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(productCategories),
}));

export const productCategoryRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  })
);
