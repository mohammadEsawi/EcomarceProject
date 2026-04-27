import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getOrders, saveOrders } from "../services/orderStore.js";

const router = Router();

router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const orders = await getOrders();
    const userOrders = orders.filter((item) => item.userId === req.user.sub);
    return res.json(userOrders);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, items, totals } = req.body || {};

    if (
      !shippingAddress ||
      !paymentMethod ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "shippingAddress, paymentMethod and order items are required",
      });
    }

    const newOrder = {
      _id: uuidv4(),
      orderNumber: `ORD${Date.now().toString().slice(-8)}`,
      userId: req.user.sub,
      userEmail: req.user.email,
      shippingAddress,
      paymentMethod,
      items,
      totals,
      status: "processing",
      createdAt: Date.now(),
    };

    const orders = await getOrders();
    orders.unshift(newOrder);
    await saveOrders(orders);

    return res.status(201).json(newOrder);
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const orders = await getOrders();
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowed = ["processing", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const orders = await getOrders();
    const index = orders.findIndex((item) => item._id === req.params.id);

    if (index < 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    orders[index].status = status;
    orders[index].updatedAt = Date.now();
    await saveOrders(orders);

    return res.json(orders[index]);
  } catch (error) {
    return next(error);
  }
});

export default router;
