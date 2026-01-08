import crypto from "crypto";
import { createRedisClient } from "./internal/redis-client";
import {
    getUserFromSession,
    createUserSession as internalCreateUserSession,
    updateUserSession as internalUpdateUserSession,
    removeUserFromSession as internalRemoveUserFromSession,
} from "./internal/session";
import { AuthInstance, AuthPublic } from "./internal/types";
import { Cookies } from "./internal/cookie";

/**
 * Options for creating an auth instance
 */
export type CreateAuthOptions<UserType extends Record<string, unknown>> = {
    ttl: number;
    redis: {
        url: string;
        token: string;
    };
    /**
     * List of user fields to store in session.
     * Must include 'id'.
     */
    sessionFields: (keyof UserType)[];
};

/**
 * Create an authentication instance
 * Only exposes public methods, internal fields (_redis, _sessionFields, ttl) are private
 */
export function createAuth<UserType extends Record<string, unknown>>(
    options: CreateAuthOptions<UserType>
): AuthPublic<UserType> {
    // Ensure 'id' is included in sessionFields
    if (!options.sessionFields.includes("id" as keyof UserType)) {
        throw new Error("sessionFields must include `id`");
    }

    // Internal fields (not exposed)
    const _redis = createRedisClient(options.redis);
    const _sessionFields = options.sessionFields;
    const _ttl = options.ttl;

    // The public API
    const auth: AuthInstance<UserType> = {
        _redis,
        _sessionFields,
        _ttl,
        // -------------------
        // Session operations
        // -------------------
        getCurrentUser(cookies) {
            return getUserFromSession({ _redis, _sessionFields, _ttl: _ttl }, cookies);
        },

        createUserSession(user, cookies) {
            const sessionData: Partial<UserType> = {} as any;
            for (const key of _sessionFields) {
                if (key in user) sessionData[key] = user[key];
            }
            return internalCreateUserSession({ _redis, _sessionFields, _ttl: _ttl }, sessionData, cookies);
        },

        updateUserSession(user, cookies: Pick<Cookies, "get" | "set">) {
            const sessionData: Partial<UserType> = {};
            for (const key of _sessionFields) {
                if (key in user) sessionData[key] = user[key];
            }
            return internalUpdateUserSession({ _redis, _sessionFields, _ttl }, sessionData, cookies);
        },

        async removeUserFromSession(cookies) {
            await internalRemoveUserFromSession({ _redis, _sessionFields, _ttl: _ttl }, cookies);
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