import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { prisma } from '../lib/database';
import { AutocompleteInteraction, MessageFlags } from 'discord.js';

const filePath = "./data/addaudio-command-usage.json";

@ApplyOptions<Command.Options>({
	description: 'Adds an audio to the blockate audio database.',
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
					.setDescription('The id of the audio')
					.setRequired(true)
				)
				.addStringOption(option => option
					.setName('name')
					.setDescription('The name of the audio')
					.setRequired(true)
				)
				.addStringOption(option => option
					.setName('category')
					.setDescription('The category of the audio')
					.setRequired(true)
					.setAutocomplete(true)
				)
				.addStringOption(option => option
					.setName('whitelister_name')
					.setDescription('The whitelister name')
				)
				.addStringOption(option => option
					.setName('whitelister_id')
					.setDescription('The whitelister id')
				)
				.addStringOption(option => option
					.setName('whitelister_type')
					.setDescription('The whitelister type')
					.setChoices([
						{ name: 'Roblox', value: 'roblox' },
						{ name: 'Discord', value: 'discord' }
					])
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
		const name = interaction.options.getString('name', true);
		const category = interaction.options.getString('category', true);
		const whitelisterName = interaction.options.getString('whitelister_name');
		const whitelisterId = interaction.options.getString('whitelister_id');
		const whitelisterType = interaction.options.getString('whitelister_type');

		// Check if some but not all whitelister fields are provided
		const hasPartialWhitelisterInfo =
			(whitelisterName !== null || whitelisterId !== null || whitelisterType !== null) &&
			!(whitelisterName !== null && whitelisterId !== null && whitelisterType !== null);

		if (hasPartialWhitelisterInfo) {
			return interaction.editReply({
				content: ":x: If providing whitelister information, all fields (name, id, and type) must be filled out."
			});
		}

		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral]
		});
		try {
			// Use provided whitelister info if all fields are filled, otherwise use defaults
			const audio = await prisma.audio.create({
				data: {
					id: id.toString(),
					name,
					category,
					whitelisterName: whitelisterName !== null ? whitelisterName : "Tylander66",
					whitelisterUserId: whitelisterId !== null ? parseInt(whitelisterId) : 196632240,
					whitelisterType: whitelisterType !== null ? whitelisterType : "roblox"
				}
			})

			if (audio instanceof Error) {
				throw audio;
			}
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				console.log(error.code)
				switch (error.code) {
					case "P2002":
						return interaction.editReply({
							content: [
								":x: This audio already exists in the database."
							].join("\n")
						})
					default:
						return interaction.editReply({
							content: "Something went wrong, please contact <@208876506146013185>.",
						})
				}
			} else {
				console.error(error)
				return interaction.editReply({
					content: "Something went wrong, please contact <@208876506146013185>.",
				})
			}
		}
		
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
				name,
				category,
				whitelisterName: whitelisterName !== null ? whitelisterName : "Tylander66",
				whitelisterId: whitelisterId !== null ? whitelisterId : "196632240",
				whitelisterType: whitelisterType !== null ? whitelisterType : "roblox"
			}
		};

		jsonData.push(newEntry);
		writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

		return interaction.editReply({
			content: [
				":white_check_mark: Added audio to the database.",
				"",
				`ID: ${id}`,
				`Name: ${name}`,
				`Category: ${category}`,
				`Whitelister: ${whitelisterName !== null ? whitelisterName : "Tylander66"} (${whitelisterId !== null ? whitelisterId : "196632240"}) [${whitelisterType !== null ? whitelisterType : "roblox"}]`
			].join("\n")
		})
	}
}
