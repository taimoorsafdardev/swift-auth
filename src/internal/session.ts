import { Redis } from "@upstash/redis";
import {
    Cookies,
    deleteSessionCookie,
    getSessionId,
} from "./cookie.js";
import { generateSessionId, stringifyBigInt } from "./utils.js";
import { COOKIE_SESSION_KEY } from "./keys.js";

export async function getUserFromSession<UserType extends Record<string, unknown>>(
    auth: { _redis: Redis; _payload: (keyof UserType)[]; _ttl: number },
    cookies: Pick<Cookies, "get">
): Promise<Partial<UserType> | null> {
    const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
    if (!sessionId) return null;

    const data = await auth._redis.get<string | object>(`session:${sessionId}`);
    if (!data) return null;

    // Only parse if it's still a string
    const sessionData: Partial<UserType> = typeof data === "string"
        ? JSON.parse(data)
        : (data as any);

    // Optional: pick only _payload to ensure type safety
    const result: Partial<UserType> = {};
    for (const key of auth._payload) {
        if (key in sessionData) result[key] = sessionData[key];
    }

    return result;
}

export async function createUserSession<UserType extends Record<string, unknown>>(
    auth: { _redis: Redis; _payload: (keyof UserType)[]; _ttl: number },
    user: Partial<UserType>,
    cookies: Pick<Cookies, "set">
) {
    const sessionId = generateSessionId();

    // Pick only session fields
    const sessionData: Partial<UserType> = {};
    for (const key of auth._payload) {
        if (key in user) sessionData[key] = user[key];
    }

    await auth._redis.set(
        `session:${sessionId}`,
        stringifyBigInt(sessionData),
        { ex: auth._ttl }
    );

    cookies.set(COOKIE_SESSION_KEY, sessionId, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: auth._ttl,
    });
}


export async function updateUserSession<UserType extends Record<string, unknown>>(
    auth: { _redis: Redis; _payload: (keyof UserType)[]; _ttl: number },
    user: Partial<UserType>,   // ✅ allow partial here
    cookies: Pick<Cookies, "get" | "set">
): Promise<void> {
    const sessionId = getSessionId(cookies);
    if (!sessionId) return; // ✅ just return void

    // Pick only session fields
    const sessionData: Partial<UserType> = {} as any;
    for (const key of auth._payload) {
        if (key in user) sessionData[key] = user[key];
    }

    await auth._redis.set(
        `session:${sessionId}`,
        stringifyBigInt(sessionData),
        { ex: auth._ttl }
    );
}

export async function removeUserFromSession<UserType extends Record<string, unknown>>(
    auth: { _redis: Redis; _payload: (keyof UserType)[]; _ttl: number },
    cookies: Pick<Cookies, "get" | "delete">
) {
    const sessionId = getSessionId(cookies);
    if (!sessionId) return null;

    await auth._redis.del(`session:${sessionId}`);
    deleteSessionCookie(cookies);
}
