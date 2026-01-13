ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;