import { z } from "zod";

export const AudioSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    whitelisterName: z.string(),
    whitelisterUserId: z.number(),
    whitelisterType: z.string(),
})

export const AudioPreviewAPISchema = z.array(z.string());

export const BatchPatchAudioSchema = z.record(
    z.string(),
    AudioSchema.partial()
)

export const BatchDeleteAudioSchema = z.array(
    z.string()
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
    audioId: z.string().min(1, "Audio ID is required"),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    reason: z.string().optional()
});

export const WhitelistRequestResponseSchema = z.object({
    id: z.string(),
    audioId: z.string(),
    name: z.string(),
    category: z.string(),
    userId: z.string(),
    reason: z.string().nullable(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    createdAt: z.string(),
    updatedAt: z.string()
});