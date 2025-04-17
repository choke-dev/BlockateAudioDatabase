import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import { prisma } from '../lib/database';
import { AutocompleteInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Search for audio in the blockate audio database.'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option => option
					.setName('search_type')
					.setDescription('How to search for the audio')
					.setRequired(true)
					.addChoices(
						{ name: 'By ID', value: 'id' },
						{ name: 'By Name', value: 'name' },
						{ name: 'By Category', value: 'category' }
					)
				)
				.addStringOption(option => option
					.setName('query')
					.setDescription('The search query')
					.setRequired(true)
					.setAutocomplete(true)
				)
				.addIntegerOption(option => option
					.setName('limit')
					.setDescription('Maximum number of results to return (default: 10, max: 25)')
					.setRequired(false)
					.setMinValue(1)
					.setMaxValue(25)
				)
		);
	}

	public override autocompleteRun(interaction: AutocompleteInteraction): Awaitable<unknown> {
		const searchType = interaction.options.getString('search_type');
		const focusedOption = interaction.options.getFocused(true);
		
		if (focusedOption.name !== 'query') return interaction.respond([]);
		if (!searchType) return interaction.respond([]);
		if (focusedOption.value.length < 1) return interaction.respond([]);

		const input = focusedOption.value.toString().toLowerCase();

		switch (searchType) {
			case 'id':
				return prisma.audio.findMany({
					select: {
						id: true,
						name: true
					},
					where: {
						id: {
							contains: input,
							mode: 'insensitive'
						}
					},
					take: 25
				}).then(results => {
					const options = results.map(audio => ({
						name: `${audio.id} - ${audio.name}`,
						value: audio.id
					}));

					return interaction.respond(options);
				});
			case 'name':
				return prisma.audio.findMany({
					select: {
						id: true,
						name: true
					},
					where: {
						name: {
							contains: input,
							mode: 'insensitive'
						}
					},
					take: 25
				}).then(results => {
					const options = results.map(audio => ({
						name: `${audio.name} (ID: ${audio.id})`,
						value: input
					}));

					return interaction.respond(options);
				});
			case 'category':
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
			default:
				return interaction.respond([]);
		}
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const searchType = interaction.options.getString('search_type', true);
		const query = interaction.options.getString('query', true);
		const limit = interaction.options.getInteger('limit') || 10;

		await interaction.deferReply();

		try {
			let audioResults;
			
			switch (searchType) {
				case 'id':
					audioResults = await prisma.audio.findMany({
						where: {
							id: {
								contains: query,
								mode: 'insensitive'
							}
						},
						take: limit,
						orderBy: {
							id: 'asc'
						}
					});
					break;
				case 'name':
					audioResults = await prisma.audio.findMany({
						where: {
							name: {
								contains: query,
								mode: 'insensitive'
							}
						},
						take: limit,
						orderBy: {
							name: 'asc'
						}
					});
					break;
				case 'category':
					audioResults = await prisma.audio.findMany({
						where: {
							category: {
								contains: query,
								mode: 'insensitive'
							}
						},
						take: limit,
						orderBy: {
							category: 'asc'
						}
					});
					break;
				default:
					return interaction.editReply({
						content: ":x: Invalid search type."
					});
			}

			if (!audioResults || audioResults.length === 0) {
				return interaction.editReply({
					content: `:x: No audio found matching your search criteria: ${searchType} = "${query}"`
				});
			}

			// Create an embed for the results
			const embed = new EmbedBuilder()
				.setTitle(`Audio Search Results`)
				.setDescription(`Found ${audioResults.length} result(s) for ${searchType} = "${query}"`)
				.setColor(0x3498db)
				.setTimestamp();

			// Add fields for each audio result
			audioResults.forEach((audio, index) => {
				embed.addFields({
					name: `${index + 1}. ID: ${audio.id}`,
					value: `**Name:** ${audio.name}\n**Category:** ${audio.category}\n**Whitelister:** ${audio.whitelisterName}`
				});
			});

			return interaction.editReply({
				embeds: [embed]
			});
		} catch (error) {
			console.error(error);
			return interaction.editReply({
				content: "Something went wrong while searching for audio. Please try again later."
			});
		}
	}
}