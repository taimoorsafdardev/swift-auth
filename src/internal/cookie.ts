import { COOKIE_SESSION_KEY } from "./keys.js";

export type Cookies = {
    set: (
        key: string,
        value: string,
        options?: {
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: "strict" | "lax";
            path: string;
            maxAge: number
        }
    ) => void;
    get: (key: string) => { name: string; value: string } | undefined;
    delete: (key: string) => void;
};

export function getSessionId(
    cookies: Pick<Cookies, "get">
): string | null {
    return cookies.get(COOKIE_SESSION_KEY)?.value ?? null;
}

export function deleteSessionCookie(
    cookies: Pick<Cookies, "delete">
) {
    cookies.delete(COOKIE_SESSION_KEY);
}
