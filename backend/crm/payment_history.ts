import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
import type { PaymentHistory } from "./types";

interface CreatePaymentRequest {
  customer_id: number;
  amount: number;
  payment_date: Date;
  payment_method?: string;
  notes?: string;
}

interface ListPaymentHistoryRequest {
  customer_id: number;
}

interface ListPaymentHistoryResponse {
  payments: PaymentHistory[];
}

// Creates a new payment history entry
export const createPayment = api<CreatePaymentRequest, PaymentHistory>(
  { expose: true, method: "POST", path: "/payment-history" },
  async (req) => {
    // Verify customer exists
    const customer = await crmDB.queryRow`
      SELECT id FROM customers WHERE id = ${req.customer_id} AND is_tracking = TRUE
    `;

    if (!customer) {
      throw APIError.notFound("Customer not found");
    }

    const payment = await crmDB.queryRow<PaymentHistory>`
      INSERT INTO payment_history (customer_id, amount, payment_date, payment_method, notes)
      VALUES (${req.customer_id}, ${req.amount}, ${req.payment_date}, ${req.payment_method}, ${req.notes})
      RETURNING *
    `;

    if (!payment) {
      throw APIError.internal("Failed to create payment history");
    }

    return payment;
  }
);

// Lists payment history for a customer
export const listPaymentHistory = api<ListPaymentHistoryRequest, ListPaymentHistoryResponse>(
  { expose: true, method: "GET", path: "/customers/:customer_id/payment-history" },
  async (req) => {
    const payments = await crmDB.queryAll<PaymentHistory>`
      SELECT * FROM payment_history
      WHERE customer_id = ${req.customer_id}
      ORDER BY payment_date DESC
    `;

    return { payments };
  }
);
