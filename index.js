import cors from "cors";
import express from "express";
import {
  addCategory,
  getCategories,
} from "./controllers/categoryController.js";
import {
  addProduct,
  deleteProduct,
  editProduct,
  getProducts,
} from "./controllers/productController.js";
import { authenticateAccessToken } from "./middlewares/authentication.js";
import cookieParser from "cookie-parser";

const app = express();
// const port = 5001;

const allowedOrigins = [
  "http://localhost:5173",
  "https://product-catalog-web-app-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("=== CORS Check ===");
      console.log("Origin:", origin);
      // console.log("Request method:", req?.method);
      // console.log("Request headers:", req?.headers);
      console.log("==================");
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS: Origin not allowed"));
      }
    },
    credentials: true,
  })
);

// 🔽 Disable caching for all responses

app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.json());

app.use(cookieParser()); // 👈 adds req.cookies

app.get("/api", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

/*

Product Routes
- GET /api/products: Fetch all products, optionally filtered by category IDs

- POST /api/product/add: Create a new product with name, price, and category associations

- PUT /api/product: Update an existing product's details and category associations

- DELETE /api/product: Delete a product by ID

*/

app.get("/api/products", getProducts);
app.post("/api/product/add", addProduct);
app.put("/api/product", editProduct);
app.delete("/api/product", deleteProduct);

/*

Category Routes

- POST /api/category/add: Create a new category with a name

- GET /api/categories: Fetch all categories

*/

app.post("/api/category/add", addCategory);
app.get("/api/categories", getCategories);

// app.listen(port, () => {
//   console.log(`Backend running on http://localhost:${port}`);
// });

export default app;
