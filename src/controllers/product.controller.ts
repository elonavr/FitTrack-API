import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { lookupProduct, PRODUCT_NOT_FOUND } from "../services/product.service";

const BARCODE_PATTERN = /^\d{8,14}$/;

export async function getProductHandler(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized request, user id must be valid." });
  }
  const barcode = String(req.params.barcode ?? "");
  if (!BARCODE_PATTERN.test(barcode)) {
    return res.status(400).json({ message: "Barcode must be 8 to 14 digits." });
  }
  try {
    const product = await lookupProduct(barcode);
    return res.status(200).json({ product });
  } catch (error) {
    if (error instanceof Error && error.message === PRODUCT_NOT_FOUND) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error looking up product:", error);
    return res
      .status(502)
      .json({ message: "Product lookup service unavailable." });
  }
}
