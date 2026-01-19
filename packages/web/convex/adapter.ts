// @ts-nocheck
import { Adapter, AdapterInstance } from "better-auth/types";
import { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

export const convexAdapter = (
  ctx: ActionCtx
): AdapterInstance => {
  return {
    id: "convex",
    create: async ({ model, data }) => {
      const table = model === "user" ? "users" : (model + "s");
      const id = await ctx.runMutation(internal.authAdapterFunctions.create, { table, data });
      return { id, ...data };
    },
    findOne: async ({ model, where }) => {
      const table = model === "user" ? "users" : (model + "s");
      const clauses = where.filter((w) => w.value !== undefined);
      if (clauses.length === 0) return null;

      if (clauses.length === 1 && clauses[0].field === "id") {
          // Optimization: if looking up by ID, we can use a simpler query or get
          // But our findOne implementation handles optimization internally if we pass where clause.
          // Wait, 'get' by ID needs to be separate if we want efficiency.
          // Let's rely on findOne handler in authAdapterFunctions to handle it or add a 'get' op.
          // internal.authAdapterFunctions.get is available? I didn't export it yet?
          // I didn't export 'get' in the previous step. I'll stick to findOne.
      }
      
      const doc = await ctx.runQuery(internal.authAdapterFunctions.findOne, { table, where: clauses });
      return doc ? mapDoc(doc) : null;
    },
    findMany: async ({ model, where }) => {
      const table = model === "user" ? "users" : (model + "s");
      const docs = await ctx.runQuery(internal.authAdapterFunctions.findMany, { table, where });
      return docs.map(mapDoc);
    },
    update: async ({ model, where, update }) => {
       const table = model === "user" ? "users" : (model + "s");
       const clauses = where.filter((w) => w.value !== undefined);
       if (clauses.length === 0) return null;
       
       // Find first
       const doc = await ctx.runQuery(internal.authAdapterFunctions.findOne, { table, where: clauses });
       if (!doc) return null;
       
       const updated = await ctx.runMutation(internal.authAdapterFunctions.update, { id: doc._id, data: update });
       return updated ? mapDoc(updated) : null;
    },
    delete: async ({ model, where }) => {
        const table = model === "user" ? "users" : (model + "s");
        const clauses = where.filter((w) => w.value !== undefined);
        // Find first (or all? delete usually deletes one or all matching?)
        // Better auth 'delete' usually implies one or many? 
        // Adapter interface says: delete(options: { model: string, where: Where[] })
        
        const docs = await ctx.runQuery(internal.authAdapterFunctions.findMany, { table, where: clauses });
        for (const doc of docs) {
            await ctx.runMutation(internal.authAdapterFunctions.del, { id: doc._id });
        }
    },
    deleteMany: async ({ model, where }) => {
         const table = model === "user" ? "users" : (model + "s");
         const docs = await ctx.runQuery(internal.authAdapterFunctions.findMany, { table, where });
         for (const doc of docs) {
             await ctx.runMutation(internal.authAdapterFunctions.del, { id: doc._id });
         }
         return docs.length;
    }
  };
};

function mapDoc(doc: any) {
  const { _id, _creationTime, ...rest } = doc;
  return {
    id: _id,
    createdAt: _creationTime, // Convex _creationTime is number (ms or ns?) ms. Better Auth expects Date or number.
    updatedAt: rest.updatedAt || _creationTime,
    ...rest,
  };
}
