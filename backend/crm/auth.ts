import { api, APIError } from "encore.dev/api";
import { crmDB } from "./db";
import type { User } from "./types";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// Login with username and password
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const user = await crmDB.queryRow<User & { password_hash: string }>`
      SELECT * FROM users WHERE username = ${req.username}
    `;
    if (!user) {
      throw APIError.notFound("No user");
    }

    // In a real application, use bcrypt or similar to verify password
    // For demo purposes, we'll use a simple comparison
    const isValidPassword = await verifyPassword(req.password, user.password_hash);
		console.log(isValidPassword);
    if (!isValidPassword) {
      throw APIError.notFound("Invalid username or password user");
    }

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ userId: user.id, username: user.username })).toString('base64');

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
);

interface CreateUserRequest {
  email: string;
  username: string;
  name: string;
  role: 'admin' | 'sales';
  password: string;
}

// Creates a new user
export const createUser = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/auth/users" },
  async (req) => {
    // Validate input
    if (!req.email || !req.username || !req.name || !req.password) {
      throw APIError.invalidArgument("All fields are required");
    }

    if (req.password.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    // Check for existing users
    const existingUser = await crmDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email} OR username = ${req.username}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("User with this email or username already exists");
    }

    // Hash the password (in production, use bcrypt)
    const passwordHash = await hashPassword(req.password);

    try {
      const user = await crmDB.queryRow<User>`
        INSERT INTO users (email, username, name, role, password_hash)
        VALUES (${req.email}, ${req.username}, ${req.name}, ${req.role}, ${passwordHash})
        RETURNING id, email, username, name, role, created_at, updated_at
      `;

      if (!user) {
        throw APIError.internal("Failed to create user");
      }

      return user;
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw APIError.alreadyExists("User with this email or username already exists");
      }
      throw APIError.internal("Failed to create user: " + error.message);
    }
  }
);

interface UpdateUserPasswordRequest {
  id: number;
  password: string;
}

// Updates a user's password (admin only)
export const updateUserPassword = api<UpdateUserPasswordRequest, void>(
  { expose: true, method: "PUT", path: "/auth/users/:id/password" },
  async (req) => {
    if (!req.password || req.password.length < 6) {
      throw APIError.invalidArgument("Password must be at least 6 characters long");
    }

    const user = await crmDB.queryRow`
      SELECT id FROM users WHERE id = ${req.id}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // Hash the new password
    const passwordHash = await hashPassword(req.password);

    try {
      await crmDB.exec`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${req.id}
      `;
    } catch (error: any) {
      console.error("Error updating password:", error);
      throw APIError.internal("Failed to update password: " + error.message);
    }
  }
);

interface UpdateUserRequest {
  id: number;
  email?: string;
  username?: string;
  name?: string;
  role?: 'admin' | 'sales';
}

// Updates a user's information
export const updateUser = api<UpdateUserRequest, User>(
  { expose: true, method: "PUT", path: "/auth/users/:id" },
  async (req) => {
    const { id, ...updates } = req;

    // Check if user exists
    const existingUser = await crmDB.queryRow`
      SELECT id FROM users WHERE id = ${id}
    `;

    if (!existingUser) {
      throw APIError.notFound("User not found");
    }

    // Check for duplicate email or username if being updated
    if (updates.email || updates.username) {
      const duplicateUser = await crmDB.queryRow`
        SELECT id FROM users 
        WHERE (email = ${updates.email || ''} OR username = ${updates.username || ''})
        AND id != ${id}
      `;

      if (duplicateUser) {
        throw APIError.alreadyExists("Email or username already exists");
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
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
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, name, role, created_at, updated_at
    `;

    try {
      const user = await crmDB.rawQueryRow<User>(updateQuery, ...params);

      if (!user) {
        throw APIError.internal("Failed to update user");
      }

      return user;
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw APIError.alreadyExists("Email or username already exists");
      }
      throw APIError.internal("Failed to update user: " + error.message);
    }
  }
);

// Lists all users
export const listUsers = api<void, { users: User[] }>(
  { expose: true, method: "GET", path: "/auth/users" },
  async () => {
    try {
      const users = await crmDB.queryAll<User>`
        SELECT id, email, username, name, role, created_at, updated_at 
        FROM users 
        WHERE username IS NOT NULL AND password_hash IS NOT NULL
        ORDER BY name
      `;

      return { users };
    } catch (error: any) {
      console.error("Error listing users:", error);
      throw APIError.internal("Failed to list users: " + error.message);
    }
  }
);

// Simple password hashing function (use bcrypt in production)
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = crypto.createHash("sha256").update(password).digest("hex");
  return inputHash === hash;
}

