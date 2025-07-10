<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const alertVariants = tv({
		base: "[&>svg]:text-foreground relative w-full rounded-lg p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
		variants: {
			variant: {
				default: "bg-background text-foreground",
				info: "bg-[#001b7a] text-white [&>svg]:text-white",
				warning: "bg-[#3d2c00] text-[#fbe6ad] [&>svg]:text-[#fbe6ad]",
				success: "bg-[#009e57] text-black [&>svg]:text-black",
				destructive:"bg-[#3b0703] text-[#fab4af] [&>svg]:text-[#fab4af]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div bind:this={ref} class={cn(alertVariants({ variant }), className)} {...restProps} role="alert">
	{@render children?.()}
</div>
