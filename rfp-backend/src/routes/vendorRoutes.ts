// src/routes/vendorRoutes.ts
import { Router, Request, Response } from "express";
import prisma from "../db/prisma";

const router = Router();

// GET /vendors
router.get("/", async (_req: Request, res: Response): Promise<Response> => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(vendors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// POST /vendors
router.post("/", async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name || !email) {
      return res
        .status(400)
        .json({ error: "Both name and email are required" });
    }

    const vendor = await prisma.vendor.create({
      data: { name, email },
    });

    return res.status(201).json(vendor);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create vendor" });
  }
});

// DELETE /vendors/:id
router.delete(
  "/:id",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid vendor id" });
      }

      await prisma.vendor.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete vendor" });
    }
  }
);

export default router;