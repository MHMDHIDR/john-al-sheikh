import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { openaiRouter } from "./routers/openai";
import { optimizeImageRouter } from "./routers/optimize-image";
import { pageContentRouter } from "./routers/page-content.ts";
import { S3Router } from "./routers/s3";
import { usersRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  users: usersRouter,
  optimizeImage: optimizeImageRouter,
  S3: S3Router,
  openai: openaiRouter,
  pageContent: pageContentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
