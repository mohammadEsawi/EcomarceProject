import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../middleware/auth.js";
import { getProducts, saveProducts } from "../services/productStore.js";

const router = Router();

function normalizeSubCategory(value = "") {
  const clean = String(value).trim().toLowerCase();
  if (!clean) return "Topwear";
  if (clean === "winterwear") return "WinterWear";
  if (clean === "bottomwear") return "Bottomwear";
  return "Topwear";
}

router.get("/", async (_req, res, next) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const products = await getProducts();
    const product = products.find((item) => item._id === req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      image,
      popular,
    } = req.body || {};

    if (!name || !description || typeof price !== "number") {
      return res.status(400).json({
        message: "name, description and numeric price are required",
      });
    }

    const products = await getProducts();
    const newProduct = {
      _id: uuidv4(),
      name: String(name).trim(),
      description: String(description).trim(),
      price,
      image: Array.isArray(image) ? image : ["/placeholder.png"],
      category: category || "Men",
      subCategory: normalizeSubCategory(subCategory),
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ["M"],
      date: Date.now(),
      popular: Boolean(popular),
    };

    const updated = [newProduct, ...products];
    await saveProducts(updated);
    return res.status(201).json(newProduct);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const products = await getProducts();
    const index = products.findIndex((item) => item._id === req.params.id);

    if (index < 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = products[index];
    const payload = req.body || {};

    const updatedProduct = {
      ...existing,
      ...payload,
      subCategory: payload.subCategory
        ? normalizeSubCategory(payload.subCategory)
        : existing.subCategory,
      name:
        typeof payload.name === "string" ? payload.name.trim() : existing.name,
      description:
        typeof payload.description === "string"
          ? payload.description.trim()
          : existing.description,
    };

    products[index] = updatedProduct;
    await saveProducts(products);
    return res.json(updatedProduct);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const products = await getProducts();
    const exists = products.some((item) => item._id === req.params.id);

    if (!exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = products.filter((item) => item._id !== req.params.id);
    await saveProducts(updated);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
