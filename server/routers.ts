import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as assetService from "./assets";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assets: router({
    getCategories: publicProcedure.query(() => assetService.getAssetCategories()),
    getAll: publicProcedure.query(() => assetService.getAllAssets()),
    getByCategory: publicProcedure.input(z.object({ categoryId: z.number() })).query(({ input }) => assetService.getAssetsByCategory(input.categoryId)),
    upload: protectedProcedure
      .input(
        z.object({
          categoryId: z.number(),
          fileName: z.string(),
          fileContent: z.string(),
          mimeType: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const fileKey = `assets/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const buffer = Buffer.from(input.fileContent, 'base64');
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        await assetService.uploadAsset({
          categoryId: input.categoryId,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize: buffer.length,
          mimeType: input.mimeType,
          description: input.description,
          uploadedBy: ctx.user.id,
        });

        return { success: true, url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
