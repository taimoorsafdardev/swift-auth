export function stringifyBigInt<T>(obj: T): string {
    return JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
}

export function generateSessionId(): string {
    const array = new Uint8Array(512);
    crypto.getRandomValues(array);

    return Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}