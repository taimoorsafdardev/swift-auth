# Swift Auth 🚀

A lightweight, type-safe authentication library for Next.js 15/16 and Upstash Redis. Swift Auth handles the heavy lifting of session management, password security, and cookie handling so you can focus on building your features.

![npm](https://img.shields.io/npm/v/swift-auth?style=flat-square)
![license](https://img.shields.io/npm/l/swift-auth?style=flat-square)
![typescript](https://img.shields.io/badge/typescript-blue?style=flat-square&logo=typescript)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Core Usage](#core-usage)
- [Password Security](#password-security)
- [API Reference](#api-reference)
- [Why Swift Auth?](#why-swift-auth)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

✨ **Type-Safe**: Full TypeScript support with generic user types
🔐 **Secure**: Built-in password hashing with scrypt and timing-safe comparison
🍪 **Cookie Handling**: Automatic HTTP-only cookie management
⚡ **Next.js 15+**: Fully compatible with the asynchronous `cookies()` API
📦 **Minimal**: Only includes what you need—control exactly what's stored in Redis
🌍 **Production Ready**: Automatic secure flag handling for dev/production environments

## Installation

```bash
npm install swift-auth
```

Or with yarn:

```bash
yarn add swift-auth
```

Or with pnpm:

```bash
pnpm add swift-auth
```

## Prerequisites

- Node.js 18+
- Next.js 15 or 16
- [Upstash Redis](https://upstash.com) account with connection credentials

## Quick Start

1. **Set up environment variables**:

```bash
REDIS_URL=https://<your-redis-url>
REDIS_TOKEN=<your-redis-token>
```

2. **Initialize auth in a shared file** (`lib/auth.ts`):

```typescript
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
  ttl: 60 * 60 * 24 * 7, // 7 Days
  sessionFields: ["id", "name", "email", "created_at"],
});
```

3. **Use in your Server Action** (login example):

```typescript
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function signIn(user: User) {
  const cookieStore = await cookies();
  await auth.createUserSession(user, cookieStore);
}
```

## Configuration

Initialize your auth instance in a shared file (e.g., `lib/auth.ts`). This ensures your Redis client and session settings are consistent across your app.

```typescript
import { createAuth } from "swift-auth";

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  // ... any other fields
};

export const auth = createAuth<User>({
  redis: {
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
  },
  ttl: 60 * 60 * 24 * 7, // 7 Days in seconds
  sessionFields: ["id", "name", "email", "created_at"], // Only these fields are stored in Redis
});
```

**Configuration Options:**

- `redis.url`: Your Upstash Redis connection URL
- `redis.token`: Your Upstash Redis authentication token
- `ttl`: Session time-to-live in seconds (default: 7 days)
- `sessionFields`: Array of user properties to persist in Redis

## Core Usage

### Create a Session (Login)

Use this inside a Next.js Server Action. It automatically generates a secure Session ID, stores the user data in Redis, and sets an HTTP-only cookie.

```typescript
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function signIn(user: User) {
  const cookieStore = await cookies();
  await auth.createUserSession(user, cookieStore);
}
```

### Get Current User

Retrieve the session data in any Server Component or Layout.

```typescript
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function Dashboard() {
  const user = await auth.getCurrentUser(await cookies());

  if (!user) return <div>Please log in</div>;
  return <div>Welcome back, {user.name}</div>;
}
```

### Update User Session

Modify session data without creating a new session ID:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function updateProfile(user: User) {
  const cookieStore = await cookies();
  await auth.updateUserSession(user, cookieStore);
}
```

### End Session (Logout)

```typescript
"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function signOut() {
  await auth.removeUserFromSession(await cookies());
}
```

## Password Security

Swift Auth provides built-in helpers for secure password management using Node's `scrypt` and `timingSafeEqual`.

```typescript
// 1. Registering a user
const salt = auth.generateSalt();
const hashedPassword = await auth.hashPassword("my-password", salt);

// 2. Verifying a user during login
const isValid = await auth.comparePassword({
  password: "my-password",
  salt: salt,
  hashedPassword: hashedPassword,
});

if (isValid) {
  // Password is correct
} else {
  // Password is incorrect
}
```

## API Reference

| Method                                 | Description                                             |
| -------------------------------------- | ------------------------------------------------------- |
| `getCurrentUser(cookieStore)`          | Returns the session data from Redis based on the cookie |
| `createUserSession(user, cookieStore)` | Creates a new session and sets the browser cookie       |
| `updateUserSession(user, cookieStore)` | Updates the Redis data without changing the Session ID  |
| `removeUserFromSession(cookieStore)`   | Deletes the Redis key and clears the browser cookie     |
| `hashPassword(password, salt)`         | Hashes a string using scrypt                            |
| `comparePassword(options)`             | Prevents timing attacks while verifying passwords       |
| `generateSalt()`                       | Generates a cryptographic salt for password hashing     |

## Why Swift Auth?

- **Next.js 15+ Optimized**: Fully compatible with the new asynchronous `cookies()` API
- **BigInt & Date Handling**: Built-in serialization for complex JavaScript objects that standard JSON fails to handle
- **Automatic Secure Cookies**: Intelligently sets `secure: true` in production and `secure: false` for localhost development
- **Minimized Payload**: By defining `sessionFields`, you control exactly what data lives in your Redis RAM, keeping costs low and performance high
- **Type-Safe**: Full TypeScript support with generics for your user type
- **Zero Dependencies**: Uses only Node.js built-ins for cryptography

## Troubleshooting

### "Redis connection failed"

- Verify your `REDIS_URL` and `REDIS_TOKEN` environment variables
- Check that your Upstash Redis instance is active
- Ensure your Node.js version is 18 or higher

### "Session not found"

- Confirm the user has a valid cookie set
- Check that the Redis TTL hasn't expired
- Verify that `sessionFields` includes the fields you're trying to access

### Type errors with custom User type

- Ensure your `User` type is exported from your auth module
- Import the `User` type in components: `import type { User } from "@/lib/auth"`

## License

MIT © Taimoor Safdar
