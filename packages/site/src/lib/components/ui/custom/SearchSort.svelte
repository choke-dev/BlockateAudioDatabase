<script lang="ts">
    import * as Popover from "$lib/components/ui/popover/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Separator } from "$lib/components/ui/separator/index";

    import LucideArrowUpDown from "~icons/lucide/arrow-up-down";
    import Button from "../button/button.svelte";
    import LucideArrowUp from '~icons/lucide/arrow-up';
    import LucideArrowDown from '~icons/lucide/arrow-down';

    const availableSortFields = [
        { label: "ID", value: "id" },
        { label: "Name", value: "name" },
        { label: "Category", value: "category" },
    ];

    // State for the sort options
    let sortField = $state<string>("id");
    let sortOrder = $state<"asc" | "desc">("asc");
    let appliedSort = $state<{ field: string, order: "asc" | "desc" } | null>(null);
    let { updateSort } = $props();

    // Apply sort (expose values)
    const applySort = () => {
        appliedSort = { field: sortField, order: sortOrder };
        updateSort(appliedSort);
    };

    // Reset sort
    const resetSort = () => {
        sortField = "id";
        sortOrder = "asc";
        appliedSort = null;
        updateSort(null);
    };
</script>

<div>
    <Popover.Root>
        <Popover.Trigger class="flex items-center p-2 px-4 border rounded-lg text-nowrap">
            <Button variant={appliedSort === null ? "outline" : "default"} class="flex items-center">
                <LucideArrowUpDown class="mr-2" />
                {appliedSort === null ? "Sort" : `Sorted by ${availableSortFields.find(f => f.value === appliedSort.field)?.label} (${appliedSort.order === "asc" ? "A-Z" : "Z-A"})`}
            </Button>
        </Popover.Trigger>
        <Popover.Content class="p-4 rounded-lg shadow-lg w-[24rem]">
            <div>
                <h1 class="font-bold mb-2">Sort Options</h1>
                
                <div class="flex items-center space-x-2 mb-4">
                    <!-- Dropdown for sort field -->
                    <Select.Root
                        type="single"
                        name="sort-field"
                        bind:value={sortField}
                    >
                        <Select.Trigger class="w-[180px]">
                            {availableSortFields.find(f => f.value === sortField)?.label || "Select field..."}
                        </Select.Trigger>
                        <Select.Content>
                            {#each availableSortFields as field}
                                <Select.Item
                                    value={field.value}
                                    label={field.label}
                                >
                                    {field.label}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>

                    <!-- Dropdown for sort order -->
                    <Select.Root
                        type="single"
                        name="sort-order"
                        bind:value={sortOrder}
                    >
                        <Select.Trigger class="w-[180px]">
                            <div class="flex items-center">
                                {#if sortOrder === "asc"}
                                    <LucideArrowUp class="mr-2" size={16} />
                                    Ascending
                                {:else}
                                    <LucideArrowDown class="mr-2" size={16} />
                                    Descending
                                {/if}
                            </div>
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="asc">
                                <div class="flex items-center">
                                    <LucideArrowUp class="mr-2" size={16} />
                                    Ascending
                                </div>
                            </Select.Item>
                            <Select.Item value="desc">
                                <div class="flex items-center">
                                    <LucideArrowDown class="mr-2" size={16} />
                                    Descending
                                </div>
                            </Select.Item>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            <Separator class="my-4" />

            <!-- Apply and reset buttons -->
            <div class="flex justify-between items-center mt-4">
                <Button
                    variant="ghost"
                    class="flex items-center"
                    onclick={resetSort}
                >
                    Reset
                </Button>
                <Button
                    class="px-4 py-2"
                    onclick={applySort}
                >
                    Apply sort
                </Button>
            </div>
        </Popover.Content>
    </Popover.Root>
</div>