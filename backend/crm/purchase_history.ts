import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
import type { PurchaseHistory } from "./types";

interface CreatePurchaseRequest {
  customer_id: number;
  product: string;
  amount: number;
  purchase_date: Date;
  notes?: string;
}

interface ListPurchaseHistoryRequest {
  customer_id: number;
}

interface ListPurchaseHistoryResponse {
  purchases: PurchaseHistory[];
}

// Creates a new purchase history entry
export const createPurchase = api<CreatePurchaseRequest, PurchaseHistory>(
  { expose: true, method: "POST", path: "/purchase-history" },
  async (req) => {
    // Verify customer exists
    const customer = await crmDB.queryRow`
      SELECT id FROM customers WHERE id = ${req.customer_id} AND is_tracking = TRUE
    `;

    if (!customer) {
      throw APIError.notFound("Customer not found");
    }

    const purchase = await crmDB.queryRow<PurchaseHistory>`
      INSERT INTO purchase_history (customer_id, product, amount, purchase_date, notes)
      VALUES (${req.customer_id}, ${req.product}, ${req.amount}, ${req.purchase_date}, ${req.notes})
      RETURNING *
    `;

    if (!purchase) {
      throw APIError.internal("Failed to create purchase history");
    }

    return purchase;
  }
);

// Lists purchase history for a customer
export const listPurchaseHistory = api<ListPurchaseHistoryRequest, ListPurchaseHistoryResponse>(
  { expose: true, method: "GET", path: "/customers/:customer_id/purchase-history" },
  async (req) => {
    const purchases = await crmDB.queryAll<PurchaseHistory>`
      SELECT * FROM purchase_history
      WHERE customer_id = ${req.customer_id}
      ORDER BY purchase_date DESC
    `;

    return { purchases };
  }
);
