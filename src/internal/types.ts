import { Redis } from "@upstash/redis";
import { Cookies } from "./cookie";

export type AuthInstance<UserType extends Record<string, unknown>> = {
    _sessionFields: (keyof UserType)[];
    _redis: Redis;
    _ttl: number;

    // Only selected fields are returned
    getCurrentUser(cookies: Pick<Cookies, "get">): Promise<Partial<UserType> | null>;

    // Only selected fields are stored
    createUserSession(user: UserType, cookies: Pick<Cookies, "set">): Promise<void>;
    updateUserSession(user: UserType, cookies: Pick<Cookies, "set">): Promise<void>;
    removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">): Promise<void>;

    hashPassword(password: string, salt: string): Promise<string>;
    generateSalt(): string;

    comparePassword(params: {
        password: string;
        salt: string;
        hashedPassword: string;
    }): Promise<boolean>;
};

export type AuthPublic<UserType extends Record<string, unknown>> = {
    getCurrentUser(cookies: Pick<Cookies, "get">): Promise<Partial<UserType> | null>;
    createUserSession(user: UserType, cookies: Pick<Cookies, "set">): Promise<void>;
    updateUserSession(user: UserType, cookies: Pick<Cookies, "get" | "set">): Promise<void>;
    removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">): Promise<void>;
    hashPassword(password: string, salt: string): Promise<string>;
    generateSalt(): string;
    comparePassword(params: {
        password: string;
        salt: string;
        hashedPassword: string;
    }): Promise<boolean>;
};
