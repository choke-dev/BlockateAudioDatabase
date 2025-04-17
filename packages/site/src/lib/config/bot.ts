export const generateAcceptNotification = (
	userId: string,
	audio: { id: string, name: string; category: string }
) => {
	return {
		userId: userId,
		messageData: {
			content: null,
			embeds: [
				{
					title: 'ℹ️ Request Accepted',
					description: [
						'Your audio whitelist request was accepted and is now in the moderation queue.',
						'You will receive a notification if the audio was whitelisted/moderated.'
					].join("\n"),
					color: 3901635,
					fields: [
						...audio.id ? [{
							name: 'Audio ID',
							value: audio.id
						}] : [],
						...audio.name ? [{
							name: 'Audio Name',
							value: audio.name
						}] : [],
						...audio.category ? [{
							name: 'Audio Category',
							value: audio.category
						}] : []
					]
				}
			],
			attachments: []
		}
	};
};

export const generateRejectNotification = (
	userId: string,
	audio: { name: string; category: string },
    rejectReason?: string
) => {
	return {
		userId: userId,
		messageData: {
			content: null,
			embeds: [
				{
					title: '❌ Request Denied',
					description: 'Your audio whitelist request was denied.',
					color: 10038818,
					fields: [
						...(rejectReason ? [{
							name: 'Reason',
							value: rejectReason
						}] : []),
						{
							name: 'Audio Name',
							value: audio.name
						},
						{
							name: 'Audio Category',
							value: audio.category
						}
					]
				}
			],
			attachments: []
		}
	};
};
