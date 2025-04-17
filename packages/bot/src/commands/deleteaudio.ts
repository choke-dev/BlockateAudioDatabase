import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { prisma } from '../lib/database';
import { MessageFlags } from 'discord.js';

const filePath = "./data/deleteaudio-command-usage.json";

@ApplyOptions<Command.Options>({
	description: 'Deletes an audio from the blockate audio database.',
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
					.setDescription('The id of the audio to delete')
					.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const id = interaction.options.getNumber('id', true);

		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral]
		});

		try {
			const audio = await prisma.audio.delete({
				where: {
					id: id.toString()
				}
			});

			if (!audio) {
				return interaction.editReply({
					content: ":x: No audio found with that ID."
				});
			}

			// Log the deletion
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
					name: audio.name,
					category: audio.category
				}
			};

			jsonData.push(newEntry);
			writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

			return interaction.editReply({
				content: [
					":white_check_mark: Successfully deleted audio from the database.",
					"",
					`ID: ${id}`,
					`Name: ${audio.name}`,
					`Category: ${audio.category}`
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