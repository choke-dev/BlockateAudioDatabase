export const uploadConfig = {
	chunkSize: 1024 * 1024 * 1, // 6MB

	maxFileSize: 1024 * 1024 * 20, // 20MB

	// Maximum concurrent uploads
	maxConcurrentUploads: 3,

	// Maximum amount of files that can be uploaded in a single batch
	maxBatchSize: 10,

	// Maximum audio duration
	maxAudioDuration: 7 * 60 + 5,

	// Allowed file types (empty array means all types allowed)
	allowedFileTypes: ['audio/mpeg', 'audio/ogg', 'video/ogg', 'audio/wav', 'audio/flac'] as string[],

	// Upload directories
	directories: {
		uploads: 'uploads',
		temp: 'uploads/temp'
	},

	fileNameRegex: /^(\S.*) --- (\S.*?)(?:\..*)?$/,

  descriptionTemplate: [
    "Uploaded for audio whitelisting on Blockate.",
    "",
    "Audio Name: {audioName}",
    "Audio Category: {audioCategory}",
    "",
    "If you are the copyright owner, or someone on behalf of the copyright owner, and wish to remove the following audio, please contact me."
  ].join("\n")
};
