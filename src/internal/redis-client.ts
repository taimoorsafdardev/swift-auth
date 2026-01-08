import { Redis } from "@upstash/redis";

export type CreateRedisClientOptions = {
    url: string;
    token: string;
};

export const createRedisClient = ({ url, token }: CreateRedisClientOptions) => {
    if (!url || !token) {
        throw new Error("Both REDIS URL and TOKEN are required to create Redis client");
    }

    const redisClient = new Redis({
        url,
        token,
    });

    return redisClient;
};
