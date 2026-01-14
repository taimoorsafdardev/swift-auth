<div align="left">

# ⚡ Swift Auth

**Type-safe, zero-hassle authentication for Next.js**

[![npm version](https://img.shields.io/npm/v/swift-auth?style=flat-square&color=0ea5e9)](https://www.npmjs.com/package/swift-auth)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=flat-square)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=flat-square)](https://nextjs.org)

_Lightweight • Secure • Type-Safe • Production-Ready_

[Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Examples](#-full-login-example) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🌟 Why Swift Auth?

Stop wrestling with authentication boilerplate. Swift Auth handles **session management**, **password security**, and **cookie handling**—so you can focus on building amazing features.

Built for **Next.js 15/16** with **Upstash Redis**, optimized for type safety and security.

---

## ✨ Key Features

| Feature                  | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| 🔐 **Type-Safe**         | Full TypeScript support with generic user types      |
| 🛡️ **Secure by Default** | Password hashing via scrypt + timing-safe comparison |
| 🍪 **Smart Cookies**     | Automatic HTTP-only cookies (dev & production)       |
| ⚡ **Next.js 15+**       | Works seamlessly with async `cookies()` API          |
| 📦 **Minimal Footprint** | You control what's stored in Redis                   |
| 🚀 **Zero Crypto Deps**  | No external dependencies for hashing                 |
| ✅ **Production-Ready**  | Battle-tested session management                     |
| 🔄 **Flexible Hashing**  | Use built-in scrypt or bring your own encryption     |

---

## 📦 Installation

Install Swift Auth using your favorite package manager:

```bash
npm install swift-auth
```

**Or with yarn/pnpm:**

```bash
yarn add swift-auth
# or
pnpm add swift-auth
```

---

## 🎯 Quick Start (5 minutes)

### Step 1️⃣ Prerequisites

Make sure you have:

- **Node.js** 18+
- **Next.js** 15 or 16
- **PostgreSQL** (via Prisma)
- **Upstash Redis** account

### Step 2️⃣ Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=https://your-instance.upstash.io
REDIS_TOKEN=your_auth_token
```

### Step 3️⃣ Database Setup & Password Hashing

Choose your password hashing approach:

#### Option A: Use Swift Auth's Built-in Hashing (Recommended)

Configure your Prisma schema with the `user` model including salt:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model user {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  password   String
  salt       String   // Required for built-in hashing
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

> ⚠️ **Critical**: Salt must be stored as a `String`, not Buffer or Bytes.

#### Option B: Use Your Own Encryption Method

If you prefer your own password hashing logic, omit the `salt` field:

```prisma
model user {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  password   String   // Your pre-encrypted password
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

---

## 🔒 Password Management

### Option A: Swift Auth Built-in Hashing

#### Generate Salt & Hash Password

```typescript
const salt = auth.generateSalt();
const hashedPassword = await auth.hashPassword("user-password", salt);

// Store both hashedPassword and salt as STRINGS in your database
await prisma.user.create({
  data: {
    email: "user@example.com",
    password: hashedPassword,
    salt: salt,
    name: "John Doe",
  },
});
```

#### Verify Password During Login

```typescript
const isValid = await auth.comparePassword({
  password: "user-password",
  salt,
  hashedPassword,
});

if (!isValid) {
  return { success: false, message: "Invalid password" };
}
```

### Option B: Custom Encryption

Use your own encryption method before storing in the database:

```typescript
import bcrypt from "bcrypt"; // or any other method

// During registration
const hashedPassword = await bcrypt.hash("user-password", 10);

await prisma.user.create({
  data: {
    email: "user@example.com",
    password: hashedPassword,
    name: "John Doe",
  },
});

// During login verification
const isValid = await bcrypt.compare("user-password", user.password);
```

---

### Step 4️⃣ Create Auth Instance

```typescript
// lib/auth.ts

import { createAuth } from "swift-auth";

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
};

export const auth = createAuth<User>({
  redis: {
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
  },
  ttl: 60 * 60 * 24 * 7, // 7 days
  payload: ["id", "name", "email", "created_at"],
});
```

**Configuration Options:**

| Option        | Type       | Description               |
| ------------- | ---------- | ------------------------- |
| `redis.url`   | `string`   | Upstash Redis URL         |
| `redis.token` | `string`   | Upstash Redis token       |
| `ttl`         | `number`   | Session TTL in seconds    |
| `payload`     | `string[]` | Fields persisted in Redis |

---

## 🔐 Core Usage

### Create Session (Login)

```typescript
// app/actions/auth.ts
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function signIn(user: User) {
  const cookieStore = await cookies();
  await auth.createUserSession(user, cookieStore);
}
```

### Get Current User

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function Dashboard() {
  const user = await auth.getCurrentUser(await cookies());

  if (!user) return <div>Please log in</div>;
  return <div>Welcome back, {user.name}! 👋</div>;
}
```

### Update Session

```typescript
// app/actions/auth.ts
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function updateProfile(user: User) {
  await auth.updateUserSession(user, await cookies());
}
```

### Logout

```typescript
// app/actions/auth.ts
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function signOut() {
  await auth.removeUserFromSession(await cookies());
}
```

---

## 📚 Full Login Example

Complete login flow with Prisma + Zod validation:

### Validation Schema

```typescript
// lib/validation.ts
import { z } from "zod";

export const signInSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password too short"),
  })
  .strict();

export type SignInInput = z.infer<typeof signInSchema>;
```

### Server Action

```typescript
// app/actions/auth.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validation";
import { cookies } from "next/headers";

export async function signIn(formData: unknown) {
  try {
    // 1. Validate input
    const parsed = signInSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten(),
      };
    }

    const { email, password } = parsed.data;

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "Account not found" };
    }

    // 3. Verify password (choose your method)
    // Option A: Using Swift Auth's built-in method
    const isCorrectPassword = await auth.comparePassword({
      hashedPassword: user.password,
      password,
      salt: user.salt, // if using built-in hashing
    });

    // Option B: Using custom encryption (e.g., bcrypt)
    // const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return { success: false, message: "Invalid password" };
    }

    // 4. Create session
    await auth.createUserSession(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      await cookies()
    );

    return {
      success: true,
      message: "Logged in successfully",
      userId: user.id,
    };
  } catch (error) {
    console.error("Auth Error:", error);
    return { success: false, message: "Internal server error" };
  }
}
```

---

## 🎯 API Reference

### Session Management

| Method                    | Parameters            | Returns         | Description                          |
| ------------------------- | --------------------- | --------------- | ------------------------------------ |
| `getCurrentUser()`        | `cookieStore`         | `User \| null`  | Get the currently authenticated user |
| `createUserSession()`     | `user`, `cookieStore` | `Promise<void>` | Create a new session                 |
| `updateUserSession()`     | `user`, `cookieStore` | `Promise<void>` | Update existing session              |
| `removeUserFromSession()` | `cookieStore`         | `Promise<void>` | Logout user                          |

### Password Management (Optional - Built-in only)

| Method              | Parameters                           | Returns            | Description                            |
| ------------------- | ------------------------------------ | ------------------ | -------------------------------------- |
| `generateSalt()`    | -                                    | `string`           | Generate cryptographically secure salt |
| `hashPassword()`    | `password`, `salt`                   | `Promise<string>`  | Hash password with scrypt              |
| `comparePassword()` | `{ password, salt, hashedPassword }` | `Promise<boolean>` | Timing-safe password comparison        |

---

## 🚀 Best Practices

✅ **Do:**

- Choose a hashing method before building your database schema
- Store salt as a **STRING** if using Swift Auth's hashing
- Use environment variables for Redis credentials
- Call `signOut()` before navigating to login page
- Update session after profile changes
- Use TypeScript for type safety

❌ **Don't:**

- Mix hashing methods (pick one and stick with it)
- Store salt as Buffer or Bytes (if using built-in hashing)
- Hardcode Redis credentials
- Compare passwords manually with `===`
- Expose session data to client components
- Use TTL shorter than 1 hour for user experience

---

## 🐛 Troubleshooting

### Redis Connection Failed

**Problem**: `Error: Connection refused`

**Solution:**

```bash
# Verify your Upstash instance is active
# Check REDIS_URL and REDIS_TOKEN in .env.local
echo $REDIS_URL
```

### Session Not Found / Cookie Missing

**Problem**: User is logged out unexpectedly

**Solution:**

- Check if TTL has expired
- Verify `payload` includes all required user data
- Ensure cookie store is being awaited properly

```typescript
// ✅ Correct
const cookieStore = await cookies();

// ❌ Wrong
const cookieStore = cookies();
```

### Type Errors with User Type

**Problem**: TypeScript complains about User type mismatch

**Solution**: Always export and reuse your User type:

```typescript
// lib/auth.ts
export type User = {
  /* ... */
};

// app/actions/auth.ts
import type { User } from "@/lib/auth";
```

### Password Comparison Always Fails (Built-in Hashing)

**Problem**: `comparePassword()` returns false for valid password

**Solution**: Ensure salt is retrieved as a STRING:

```typescript
// ✅ Correct
const user = await prisma.user.findUnique({ where: { id } });
const isValid = await auth.comparePassword({
  password,
  salt: user.salt, // string ✓
  hashedPassword: user.password,
});

// ❌ Wrong
salt: user.salt as any; // don't cast!
```

---

## 📖 More Resources

- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Upstash Redis Docs](https://upstash.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 📄 License

MIT © Taimoor Safdar

---

<div align="center">

**Built with ❤️ for the Next.js community**

[⬆ back to top](#-swift-auth)

</div>

