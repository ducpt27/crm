import { api, Query } from "encore.dev/api";
import { crmDB } from "./db";

interface StaffCustomerStats {
  staff_id: number;
  staff_name: string;
  customer_count: number;
}

interface CustomerInteractionStats {
  date: string;
  interaction_count: number;
}

interface CustomerTypeStats {
  customer_type: string;
  count: number;
}

interface ProductTypeStats {
  product: string;
  count: number;
}

interface ReportsResponse {
  staff_customer_stats: StaffCustomerStats[];
  interaction_stats: CustomerInteractionStats[];
  customer_type_stats: CustomerTypeStats[];
  product_type_stats: ProductTypeStats[];
}

interface ReportsRequest {
  start_date?: Query<string>;
  end_date?: Query<string>;
}

// Generates comprehensive reports
export const generateReports = api<ReportsRequest, ReportsResponse>(
  { expose: true, method: "GET", path: "/reports" },
  async (req) => {
    const startDate = req.start_date ? new Date(req.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = req.end_date ? new Date(req.end_date) : new Date();

    // Staff customer stats
    const staffStats = await crmDB.queryAll<StaffCustomerStats>`
      SELECT 
        COALESCE(c.staff_in_charge_id, 0) as staff_id,
        COALESCE(u.name, 'Unassigned') as staff_name,
        COUNT(c.id) as customer_count
      FROM customers c
      LEFT JOIN users u ON c.staff_in_charge_id = u.id
      WHERE c.is_tracking = TRUE
      GROUP BY c.staff_in_charge_id, u.name
      ORDER BY customer_count DESC
    `;

    // Customer interaction stats over time
    const interactionStats = await crmDB.queryAll<CustomerInteractionStats>`
      SELECT 
        DATE(ch.contact_date) as date,
        COUNT(*) as interaction_count
      FROM contact_history ch
      WHERE ch.contact_date >= ${startDate} AND ch.contact_date <= ${endDate}
      GROUP BY DATE(ch.contact_date)
      ORDER BY date
    `;

    // Customer type stats
    const customerTypeStats = await crmDB.queryAll<CustomerTypeStats>`
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM customers
      WHERE is_tracking = TRUE
      GROUP BY customer_type
      ORDER BY count DESC
    `;

    // Product type stats (unnest the products array)
    const productTypeStats = await crmDB.queryAll<ProductTypeStats>`
      SELECT 
        product,
        COUNT(*) as count
      FROM customers c
      CROSS JOIN LATERAL unnest(c.products) as product
      WHERE c.is_tracking = TRUE
      GROUP BY product
      ORDER BY count DESC
    `;

    return {
      staff_customer_stats: staffStats,
      interaction_stats: interactionStats,
      customer_type_stats: customerTypeStats,
      product_type_stats: productTypeStats
    };
  }
);

interface ExportDataResponse {
  csv_data: string;
}

// Exports customer data as CSV
export const exportCustomers = api<void, ExportDataResponse>(
  { expose: true, method: "GET", path: "/export/customers" },
  async () => {
    const customers = await crmDB.queryAll<any>`
      SELECT 
        c.*,
        u.name as staff_in_charge_name
      FROM customers c
      LEFT JOIN users u ON c.staff_in_charge_id = u.id
      WHERE c.is_tracking = TRUE
      ORDER BY c.created_at DESC
    `;

    // Convert to CSV
    const headers = [
      'ID', 'Name', 'Phone', 'Email', 'Address', 'Company Name', 'Customer Type',
      'Business Type', 'Products', 'Scale', 'Province/City', 'Customer Source',
      'Staff in Charge', 'Stage', 'Level', 'Contact Status', 'Customer Feedback',
      'Notes', 'Appointment Date', 'Appointment Reminder', 'Created At', 'Updated At'
    ];

    const csvRows = [headers.join(',')];

    customers.forEach(customer => {
      const row = [
        customer.id,
        `"${customer.name || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.email || ''}"`,
        `"${customer.address || ''}"`,
        `"${customer.company_name || ''}"`,
        customer.customer_type,
        `"${customer.business_type || ''}"`,
        `"${(customer.products || []).join('; ')}"`,
        `"${customer.scale || ''}"`,
        `"${customer.province_city || ''}"`,
        `"${customer.customer_source || ''}"`,
        `"${customer.staff_in_charge_name || ''}"`,
        customer.stage,
        customer.level,
        customer.contact_status,
        `"${customer.customer_feedback || ''}"`,
        `"${customer.notes || ''}"`,
        customer.appointment_date || '',
        `"${customer.appointment_reminder || ''}"`,
        customer.created_at,
        customer.updated_at
      ];
      csvRows.push(row.join(','));
    });

    return {
      csv_data: csvRows.join('\n')
    };
  }
);
