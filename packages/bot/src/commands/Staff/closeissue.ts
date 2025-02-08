import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType } from 'discord.js';

//@ts-ignore
const ISSUES_FORUM_CHANNEL_ID = "1316657847374712872";

@ApplyOptions<Command.Options>({
	description: 'Closes an issue',
	preconditions: ['StaffOnly']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option => option
					.setName('resolution')
					.setDescription('Indicates if the issue was solved or just closed')
					.setRequired(true)
					.addChoices(
						{ name: 'Solved', value: 'solved' },
						{ name: 'Closed', value: 'closed' }
					))
		)
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const resolution = interaction.options.getString('resolution', true);
		
		// if (
		// 	interaction.channel?.type === ChannelType.PublicThread &&
		// 	interaction.channel.parent?.type === ChannelType.GuildForum
		//   ) {
		// 	console.log(`This message is sent in a forum thread (ID: ${interaction.channel.parentId})`);
		//   }

		const channel = interaction.channel
		if (!channel) return interaction.reply(':x: Couldn\'t retrieve channel');
		if (channel.type !== ChannelType.PublicThread) return interaction.reply(':x: This command can only be used in a public thread channel.');
		if (channel.parent?.type !== ChannelType.GuildForum) return interaction.reply(':x: This command can only be used in a forum thread');
		if (channel.parentId !== ISSUES_FORUM_CHANNEL_ID) return interaction.reply(`:x: This command can only be used in <#${ISSUES_FORUM_CHANNEL_ID}>.`);

		await channel.setLocked(true);
		if (!channel.appliedTags.includes('1316658723686580254')) {
			channel.setAppliedTags([...channel.appliedTags, '1316658723686580254']);
		}
		return interaction.reply({ content: `This issue has been marked as ${resolution} by ${interaction.user}.`, allowedMentions: {} });
	}
}
