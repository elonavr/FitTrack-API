import { OpenFoodFacts } from "@openfoodfacts/openfoodfacts-nodejs";

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  per100g: {
    calories: number | null;
    protein: number | null;
    carb: number | null;
    fat: number | null;
  };
}

export const PRODUCT_NOT_FOUND = "Product not found.";
export const LOOKUP_UNAVAILABLE = "Product lookup service unavailable.";

const TIMEOUT_MS = 8000;
const FIELDS = ["product_name", "brands", "image_front_url", "nutriments"];

let client: OpenFoodFacts | undefined;

// Built lazily so a missing OFF_USER_AGENT only breaks lookups, not the whole server.
function getClient(): OpenFoodFacts {
  if (client) return client;
  const userAgent = process.env.OFF_USER_AGENT;
  if (!userAgent) throw new Error("OFF_USER_AGENT is not set.");

  // The SDK sets its own User-Agent; this inner fetch runs last and sets ours.
  const offFetch: typeof fetch = (input, init) => {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    );
    headers.set("User-Agent", userAgent);
    return fetch(input, {
      ...init,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  };
  client = new OpenFoodFacts(offFetch);
  return client;
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

export async function lookupProduct(barcode: string): Promise<ScannedProduct> {
  let result;
  try {
    result = await getClient().getProductV3(barcode, { fields: FIELDS as any });
  } catch (error) {
    console.error("Open Food Facts request failed:", error);
    throw new Error(LOOKUP_UNAVAILABLE);
  }

  const product = (result.data as any)?.product as Record<string, any> | undefined;
  if (!product) {
    const notFound = (result.error as any)?.errors?.some(
      (e: any) => e?.message?.id === "product_not_found"
    );
    if (notFound || result.data) throw new Error(PRODUCT_NOT_FOUND);
    console.error("Open Food Facts error:", result.error);
    throw new Error(LOOKUP_UNAVAILABLE);
  }

  const n = product.nutriments ?? {};
  return {
    barcode,
    name: String(product.product_name ?? "").trim() || `Product ${barcode}`,
    brand: product.brands ? String(product.brands).split(",")[0]?.trim() || null : null,
    imageUrl: product.image_front_url ?? null,
    per100g: {
      calories: toNumber(n["energy-kcal_100g"]),
      protein: toNumber(n["proteins_100g"]),
      carb: toNumber(n["carbohydrates_100g"]),
      fat: toNumber(n["fat_100g"]),
    },
  };
}
