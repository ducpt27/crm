import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
import type { ContactHistory } from "./types";

interface CreateContactRequest {
  customer_id: number;
  contact_type: string;
  notes?: string;
  staff_id?: number;
  contact_date?: Date;
}

interface ListContactHistoryRequest {
  customer_id: number;
}

interface ListContactHistoryResponse {
  contacts: ContactHistory[];
}

// Creates a new contact history entry
export const createContact = api<CreateContactRequest, ContactHistory>(
  { expose: true, method: "POST", path: "/contact-history" },
  async (req) => {
    // Verify customer exists
    const customer = await crmDB.queryRow`
      SELECT id FROM customers WHERE id = ${req.customer_id} AND is_tracking = TRUE
    `;

    if (!customer) {
      throw APIError.notFound("Customer not found");
    }

    const contact = await crmDB.queryRow<ContactHistory>`
      INSERT INTO contact_history (customer_id, contact_type, notes, staff_id, contact_date)
      VALUES (${req.customer_id}, ${req.contact_type}, ${req.notes}, ${req.staff_id}, ${req.contact_date || new Date()})
      RETURNING *
    `;

    if (!contact) {
      throw APIError.internal("Failed to create contact history");
    }

    // Get staff name if available
    let staff_name = undefined;
    if (contact.staff_id) {
      const staff = await crmDB.queryRow<{ name: string }>`
        SELECT name FROM users WHERE id = ${contact.staff_id}
      `;
      staff_name = staff?.name;
    }

    return {
      ...contact,
      staff_name
    };
  }
);

// Lists contact history for a customer
export const listContactHistory = api<ListContactHistoryRequest, ListContactHistoryResponse>(
  { expose: true, method: "GET", path: "/customers/:customer_id/contact-history" },
  async (req) => {
    const contacts = await crmDB.queryAll<ContactHistory & { staff_name: string }>`
      SELECT ch.*, u.name as staff_name
      FROM contact_history ch
      LEFT JOIN users u ON ch.staff_id = u.id
      WHERE ch.customer_id = ${req.customer_id}
      ORDER BY ch.contact_date DESC
    `;

    return { contacts };
  }
);
