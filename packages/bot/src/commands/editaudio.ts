import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { prisma } from '../lib/database';
import { AutocompleteInteraction, Awaitable, MessageFlags } from 'discord.js';

const filePath = "./data/editaudio-command-usage.json";

@ApplyOptions<Command.Options>({
	description: 'Edits an audio in the blockate audio database.',
	preconditions: ["StaffOnly"]
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addNumberOption(option => option
					.setName('id')
					.setDescription('The id of the audio to edit')
					.setRequired(true)
				)
				.addStringOption(option => option
					.setName('name')
					.setDescription('The new name of the audio')
					.setRequired(false)
				)
				.addStringOption(option => option
					.setName('category')
					.setDescription('The new category of the audio')
					.setRequired(false)
					.setAutocomplete(true)
				)
				.addStringOption(option => option
					.setName('whitelister')
					.setDescription('The new whitelister name')
					.setRequired(false)
				)
		);
	}

	public override autocompleteRun(interaction: AutocompleteInteraction): Awaitable<unknown> {
		const focusedOption = interaction.options.getFocused(true);
		
		if (focusedOption.name !== 'category') return interaction.respond([]);
		if (focusedOption.value.length < 3) return interaction.respond([]);

		const input = focusedOption.value.toLowerCase();

		return prisma.audio.findMany({
			select: {
				category: true
			},
			distinct: ['category'],
			where: {
				category: {
					contains: input,
					mode: 'insensitive'
				}
			},
			take: 25
		}).then(categories => {
			const options = categories.map(category => ({
				name: category.category,
				value: category.category
			}));

			return interaction.respond(options);
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const id = interaction.options.getNumber('id', true);
		const name = interaction.options.getString('name');
		const category = interaction.options.getString('category');
		const whitelister = interaction.options.getString('whitelister');

		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral]
		});

		try {
			// First get the current audio to log the changes
			const currentAudio = await prisma.audio.findUnique({
				where: {
					id: id.toString()
				}
			});

			if (!currentAudio) {
				return interaction.editReply({
					content: ":x: No audio found with that ID."
				});
			}

			// Prepare the update data
			const updateData: {
				name?: string;
				category?: string;
				whitelisterName?: string;
			} = {};

			if (name) updateData.name = name;
			if (category) updateData.category = category;
			if (whitelister) updateData.whitelisterName = whitelister;

			// If no fields to update, return early
			if (Object.keys(updateData).length === 0) {
				return interaction.editReply({
					content: ":x: No fields to update. Please provide at least one field to change."
				});
			}

			// Update the audio
			const updatedAudio = await prisma.audio.update({
				where: {
					id: id.toString()
				},
				data: updateData
			});

			if (!updatedAudio) {
				return interaction.editReply({
					content: ":x: Failed to update the audio."
				});
			}

			// Log the edit
			if (!existsSync(filePath)) {
				writeFileSync(filePath, JSON.stringify([]));
			}

			const fileContent = readFileSync(filePath, 'utf-8');
			const jsonData = JSON.parse(fileContent);

			const newEntry = {
				user: interaction.user.id,
				timestamp: Date.now(),
				timestamp_string: new Date(),
				arguments: {
					id,
					changes: {
						...(name && { name: { from: currentAudio.name, to: name } }),
						...(category && { category: { from: currentAudio.category, to: category } }),
						...(whitelister && { whitelister: { from: currentAudio.whitelisterName, to: whitelister } })
					}
				}
			};

			jsonData.push(newEntry);
			writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

			// Build the response message
			const changes = [];
			if (name) changes.push(`Name: ${currentAudio.name} → ${name}`);
			if (category) changes.push(`Category: ${currentAudio.category} → ${category}`);
			if (whitelister) changes.push(`Whitelister: ${currentAudio.whitelisterName} → ${whitelister}`);

			return interaction.editReply({
				content: [
					":white_check_mark: Successfully updated audio in the database.",
					"",
					`ID: ${id}`,
					...changes
				].join("\n")
			});
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return interaction.editReply({
						content: ":x: No audio found with that ID."
					});
				}
			}
			
			console.error(error);
			return interaction.editReply({
				content: "Something went wrong, please contact <@208876506146013185>."
			});
		}
	}
} 