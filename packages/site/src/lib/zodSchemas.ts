import { z } from "zod";

export const AudioSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    whitelisterName: z.string(),
    whitelisterUserId: z.number(),
})

export const BatchPatchAudioSchema = z.record(
    z.string(),
    AudioSchema.partial()
)

export const BatchDeleteAudioSchema = z.array(
    z.string()
)

export const SortSchema = z.object({
    field: z.string(),
    order: z.enum(["asc", "desc"])
}).nullable();

export const SearchFilterSchema = z.object({
    filters: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
            inputValue: z.string(),
        })
    ),
    filterType: z.enum(["and", "or"]),
    sort: SortSchema.optional()
});