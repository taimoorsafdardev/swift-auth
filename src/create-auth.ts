import crypto from "crypto";
import { Cookies } from "./internal/cookie.js";
import { createRedisClient } from "./internal/redis-client.js";
import {
    getUserFromSession,
    createUserSession as internalCreateUserSession,
    removeUserFromSession as internalRemoveUserFromSession,
    updateUserSession as internalUpdateUserSession,
} from "./internal/session.js";
import { AuthInstance, AuthPublic } from "./internal/types.js";

type RedisConfig = {
    url: string;
    token: string;
}

type CreateAuthOptions<UserType extends Record<string, unknown>> = {
    redis: RedisConfig;
    ttl: number;
    payload: (keyof UserType)[];
}

/**
 * Create an authentication instance
 */
export function createAuth<UserType extends Record<string, unknown>>(
    options: CreateAuthOptions<UserType>
): AuthPublic<UserType> {
    if (!options.payload.includes("id" as keyof UserType)) {
        throw new Error("payload must include `id`");
    }

    const _redis = createRedisClient(options.redis);
    const _payload = options.payload;
    const _ttl = options.ttl;

    const auth: AuthInstance<UserType> = {
        _redis,
        _payload,
        _ttl,
        // -------------------
        // Session operations
        // -------------------
        getCurrentUser(cookies) {
            return getUserFromSession({ _redis, _payload, _ttl: _ttl }, cookies);
        },

        createUserSession(user, cookies) {
            const sessionData: Partial<UserType> = {} as any;
            for (const key of _payload) {
                if (key in user) sessionData[key] = user[key];
            }
            return internalCreateUserSession({ _redis, _payload, _ttl: _ttl }, sessionData, cookies);
        },

        updateUserSession(user, cookies: Pick<Cookies, "get" | "set">) {
            const sessionData: Partial<UserType> = {};
            for (const key of _payload) {
                if (key in user) sessionData[key] = user[key];
            }
            return internalUpdateUserSession({ _redis, _payload, _ttl }, sessionData, cookies);
        },

        async removeUserFromSession(cookies) {
            await internalRemoveUserFromSession({ _redis, _payload, _ttl: _ttl }, cookies);
        },

        // -------------------
        // Password helpers
        // -------------------
        hashPassword(password: string, salt: string): Promise<string> {
            return new Promise((resolve, reject) => {
                crypto.scrypt(
                    password.normalize(),
                    salt,
                    64,
                    (err: Error | null, derivedKey: Buffer) => {
                        if (err) return reject(err);
                        resolve(derivedKey.toString("hex").normalize());
                    }
                );
            });
        },

        generateSalt(): string {
            return crypto.randomBytes(16).toString("hex").normalize();
        },

        async comparePassword({
            password,
            salt,
            hashedPassword,
        }: {
            password: string;
            salt: string;
            hashedPassword: string;
        }): Promise<boolean> {
            const inputHashed = await auth.hashPassword(password, salt);
            return crypto.timingSafeEqual(
                Buffer.from(inputHashed, "hex"),
                Buffer.from(hashedPassword, "hex")
            );
        },
    };

    return auth;
}
