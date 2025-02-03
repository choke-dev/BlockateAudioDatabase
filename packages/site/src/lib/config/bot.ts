export const generateAcceptNotification = (
	userId: string,
	audio: { name: string; category: string }
) => {
	return {
		userId: userId,
		messageData: {
			content: null,
			embeds: [
				{
					title: '✅ Request Accepted',
					description: 'Your audio whitelist request was accepted.',
					color: 3908956,
					fields: [
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
