import { z } from "zod";

export const AudioSchema = z.object({
    id: z.number(),
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

export const SearchFilterSchema = z.array(
    z.object({
        label: z.string(),
        value: z.string(),
        inputValue: z.string(),
    })
)