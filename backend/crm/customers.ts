import { api, APIError, Query } from "encore.dev/api";
import { crmDB } from "./db";
import type { Customer, ContactHistory } from "./types";

interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  customer_type: 'corporate' | 'service' | 'individual';
  business_type?: string;
  products: string[];
  scale?: string;
  province_city?: string;
  customer_source?: string;
  staff_in_charge_id?: number;
  stage: 'care' | 'send_quote' | 'consideration' | 'purchase';
  level: 'cold' | 'warm' | 'hot';
  contact_status: 'not_called' | 'called' | 'following' | 'unreachable';
  customer_feedback?: string;
  notes?: string;
  appointment_date?: Date;
  appointment_reminder?: string;
}

interface UpdateCustomerRequest {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  customer_type?: 'corporate' | 'service' | 'individual';
  business_type?: string;
  products?: string[];
  scale?: string;
  province_city?: string;
  customer_source?: string;
  staff_in_charge_id?: number;
  stage?: 'care' | 'send_quote' | 'consideration' | 'purchase';
  level?: 'cold' | 'warm' | 'hot';
  contact_status?: 'not_called' | 'called' | 'following' | 'unreachable';
  customer_feedback?: string;
  notes?: string;
  appointment_date?: Date;
  appointment_reminder?: string;
  is_tracking?: boolean;
}

interface ListCustomersRequest {
  staff_id?: Query<number>;
  search?: Query<string>;
  customer_type?: Query<string>;
  stage?: Query<string>;
  level?: Query<string>;
  contact_status?: Query<string>;
  sort_by?: Query<string>;
  sort_order?: Query<'asc' | 'desc'>;
  page?: Query<number>;
  limit?: Query<number>;
}

interface ListCustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  total_pages: number;
}

// Creates a new customer
export const createCustomer = api<CreateCustomerRequest, Customer>(
  { expose: true, method: "POST", path: "/customers" },
  async (req) => {
    const customer = await crmDB.queryRow<Omit<Customer, 'staff_in_charge_name' | 'latest_contact'>>`
      INSERT INTO customers (
        name, phone, email, address, company_name, customer_type, business_type, 
        products, scale, province_city, customer_source, staff_in_charge_id, 
        stage, level, contact_status, customer_feedback, notes, 
        appointment_date, appointment_reminder
      )
      VALUES (
        ${req.name}, ${req.phone}, ${req.email}, ${req.address}, ${req.company_name}, 
        ${req.customer_type}, ${req.business_type}, ${req.products}, ${req.scale}, 
        ${req.province_city}, ${req.customer_source}, ${req.staff_in_charge_id}, 
        ${req.stage}, ${req.level}, ${req.contact_status}, ${req.customer_feedback}, 
        ${req.notes}, ${req.appointment_date}, ${req.appointment_reminder}
      )
      RETURNING *
    `;

    if (!customer) {
      throw APIError.internal("Failed to create customer");
    }

    // Get staff name if assigned
    let staff_in_charge_name = undefined;
    if (customer.staff_in_charge_id) {
      const staff = await crmDB.queryRow<{ name: string }>`
        SELECT name FROM users WHERE id = ${customer.staff_in_charge_id}
      `;
      staff_in_charge_name = staff?.name;
    }

    return {
      ...customer,
      staff_in_charge_name
    };
  }
);

// Lists customers with filtering and pagination
export const listCustomers = api<ListCustomersRequest, ListCustomersResponse>(
  { expose: true, method: "GET", path: "/customers" },
  async (req) => {
    const page = req.page || 1;
    const limit = req.limit || 50;
    const offset = (page - 1) * limit;
    const sortBy = req.sort_by || 'updated_at';
    const sortOrder = req.sort_order || 'desc';

    let whereConditions: string[] = ['c.is_tracking = TRUE'];
    let params: any[] = [];
    let paramIndex = 1;

    if (req.staff_id) {
      whereConditions.push(`c.staff_in_charge_id = $${paramIndex}`);
      params.push(req.staff_id);
      paramIndex++;
    }

    if (req.search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`);
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    if (req.customer_type) {
      whereConditions.push(`c.customer_type = $${paramIndex}`);
      params.push(req.customer_type);
      paramIndex++;
    }

    if (req.stage) {
      whereConditions.push(`c.stage = $${paramIndex}`);
      params.push(req.stage);
      paramIndex++;
    }

    if (req.level) {
      whereConditions.push(`c.level = $${paramIndex}`);
      params.push(req.level);
      paramIndex++;
    }

    if (req.contact_status) {
      whereConditions.push(`c.contact_status = $${paramIndex}`);
      params.push(req.contact_status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `;
    const countResult = await crmDB.rawQueryRow<{ total: number }>(countQuery, ...params);
    const total = countResult?.total || 0;

    // Get customers with staff names and latest contact
    const dataQuery = `
      SELECT 
        c.*,
        u.name as staff_in_charge_name,
        ch.id as latest_contact_id,
        ch.contact_date as latest_contact_date,
        ch.contact_type as latest_contact_type,
        ch.notes as latest_contact_notes,
        chu.name as latest_contact_staff_name
      FROM customers c
      LEFT JOIN users u ON c.staff_in_charge_id = u.id
      LEFT JOIN LATERAL (
        SELECT ch1.*, u1.name as staff_name
        FROM contact_history ch1
        LEFT JOIN users u1 ON ch1.staff_id = u1.id
        WHERE ch1.customer_id = c.id
        ORDER BY ch1.contact_date DESC
        LIMIT 1
      ) ch ON true
      LEFT JOIN users chu ON ch.staff_id = chu.id
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const customers = await crmDB.rawQueryAll<any>(dataQuery, ...params);

    const formattedCustomers: Customer[] = customers.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      company_name: row.company_name,
      customer_type: row.customer_type,
      business_type: row.business_type,
      products: row.products || [],
      scale: row.scale,
      province_city: row.province_city,
      customer_source: row.customer_source,
      staff_in_charge_id: row.staff_in_charge_id,
      staff_in_charge_name: row.staff_in_charge_name,
      stage: row.stage,
      level: row.level,
      contact_status: row.contact_status,
      customer_feedback: row.customer_feedback,
      notes: row.notes,
      appointment_date: row.appointment_date,
      appointment_reminder: row.appointment_reminder,
      is_tracking: row.is_tracking,
      created_at: row.created_at,
      updated_at: row.updated_at,
      latest_contact: row.latest_contact_id ? {
        id: row.latest_contact_id,
        customer_id: row.id,
        contact_date: row.latest_contact_date,
        contact_type: row.latest_contact_type,
        notes: row.latest_contact_notes,
        staff_name: row.latest_contact_staff_name,
        created_at: row.latest_contact_date
      } : undefined
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      customers: formattedCustomers,
      total,
      page,
      total_pages: totalPages
    };
  }
);

// Gets a single customer by ID
export const getCustomer = api<{ id: number }, Customer>(
  { expose: true, method: "GET", path: "/customers/:id" },
  async (req) => {
    const customer = await crmDB.queryRow<Omit<Customer, 'staff_in_charge_name' | 'latest_contact'>>`
      SELECT * FROM customers WHERE id = ${req.id} AND is_tracking = TRUE
    `;

    if (!customer) {
      throw APIError.notFound("Customer not found");
    }

    // Get staff name if assigned
    let staff_in_charge_name = undefined;
    if (customer.staff_in_charge_id) {
      const staff = await crmDB.queryRow<{ name: string }>`
        SELECT name FROM users WHERE id = ${customer.staff_in_charge_id}
      `;
      staff_in_charge_name = staff?.name;
    }

    // Get latest contact
    const latestContact = await crmDB.queryRow<ContactHistory & { staff_name: string }>`
      SELECT ch.*, u.name as staff_name
      FROM contact_history ch
      LEFT JOIN users u ON ch.staff_id = u.id
      WHERE ch.customer_id = ${customer.id}
      ORDER BY ch.contact_date DESC
      LIMIT 1
    `;

    return {
      ...customer,
      staff_in_charge_name,
      latest_contact: latestContact
    };
  }
);

// Updates a customer
export const updateCustomer = api<UpdateCustomerRequest, Customer>(
  { expose: true, method: "PUT", path: "/customers/:id" },
  async (req) => {
    const { id, ...updates } = req;

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id);

    const updateQuery = `
      UPDATE customers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_tracking = TRUE
      RETURNING *
    `;

    const customer = await crmDB.rawQueryRow<Omit<Customer, 'staff_in_charge_name' | 'latest_contact'>>(updateQuery, ...params);

    if (!customer) {
      throw APIError.notFound("Customer not found");
    }

    // Get staff name if assigned
    let staff_in_charge_name = undefined;
    if (customer.staff_in_charge_id) {
      const staff = await crmDB.queryRow<{ name: string }>`
        SELECT name FROM users WHERE id = ${customer.staff_in_charge_id}
      `;
      staff_in_charge_name = staff?.name;
    }

    return {
      ...customer,
      staff_in_charge_name
    };
  }
);

// Stops tracking a customer (soft delete)
export const stopTracking = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/customers/:id" },
  async (req) => {
    const result = await crmDB.exec`
      UPDATE customers 
      SET is_tracking = FALSE, updated_at = NOW()
      WHERE id = ${req.id}
    `;
  }
);
