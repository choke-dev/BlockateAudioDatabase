import { z } from "zod";

export const AudioSchema = z.object({
    id: z.bigint(),
    name: z.string(),
    category: z.string(),
    is_previewable: z.boolean().default(true),
    audio_url: z.string().nullable(),
    requester: z.object({
        discord: z.object({
            id: z.string().nullable(),
            username: z.string().nullable(),
        }),
        roblox: z.object({
            id: z.string().nullable(),
            username: z.string().nullable(),
        }),
    }),
    whitelister: z.object({
        discord: z.object({
            id: z.string().nullable(),
            username: z.string().nullable(),
        }),
        roblox: z.object({
            id: z.string().nullable(),
            username: z.string().nullable(),
        }),
    }),
    audio_lifecycle: z.enum(["ACTIVE", "MODERATED"]).default("ACTIVE"),
    audio_visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
    created_at: z.date().default(new Date()),
    updated_at: z.date().default(new Date()),
})

export const AudioPreviewAPISchema = z.array(z.string().transform(val => BigInt(val)));

export const BatchPatchAudioSchema = z.record(
    z.bigint(),
    AudioSchema.partial()
)

export const BatchDeleteAudioSchema = z.array(
    z.bigint()
)

export const SearchSortSchema = z.object({
    field: z.string(),
    order: z.enum(["asc", "desc"])
}).nullable();

export const SearchRequestSchema = z.object({
    filters: z.object({
        filters: z.array(
            z.object({
                label: z.string(),
                value: z.string(),
                inputValue: z.string(),
            })
        ),
        type: z.enum(["and", "or"])
    }),
    sort: SearchSortSchema
});

export const SearchFilterSchema = z.object({
    filters: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
            inputValue: z.string(),
        })
    ),
    filterType: z.enum(["and", "or"]),
    sort: SearchSortSchema.optional()
});


export const WhitelistRequestSchema = z.object({
  audioId: z.preprocess((val) => {
    if (typeof val === "string" && /^\d+$/.test(val)) {
      return BigInt(val);
    }
    return val;
  }, z.bigint().min(1n, "Audio ID is required")),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  is_private: z.boolean().default(false),
});

export const WhitelistRequestResponseSchema = z.object({
    id: z.bigint(),
    audioId: z.string(),
    name: z.string(),
    category: z.string(),
    userId: z.string(),
    reason: z.string().nullable(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    createdAt: z.string(),
    updatedAt: z.string()
});