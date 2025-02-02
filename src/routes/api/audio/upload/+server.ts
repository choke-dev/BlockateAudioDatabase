import { uploadConfig } from '$lib/config/upload';
import { prisma, supabase } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync, readFile, stat, unlink } from 'fs';
import { appendFile, mkdir, writeFile } from 'fs/promises';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { join } from 'path';
import { promisify } from 'util';

const MODE = import.meta.env.MODE;

// Convert callback-based functions to promise-based
const readFileAsync = promisify(readFile);

const UPLOADS_DIR = MODE === 'development' ? join(process.cwd(), uploadConfig.directories.uploads) : uploadConfig.directories.uploads
const TEMP_DIR = MODE === 'development' ? join(process.cwd(), uploadConfig.directories.temp) : uploadConfig.directories.temp

// Define allowed MIME types
const allowedFileTypes = ["audio/mpeg", "audio/ogg", "audio/wav", "audio/flac"];
const fileNameRegex = /^(\S.*) --- (\S.*?)(?:\..*)?$/

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const formData = await request.formData();
        const chunk = formData.get('chunk') as Blob;
        const fileName = formData.get('fileName') as string;
        const chunkIndex = parseInt(formData.get('chunkIndex') as string);
        const totalChunks = parseInt(formData.get('totalChunks') as string);
        const uploadId = formData.get('uploadId') as string;
        
        if (!chunk || !fileName || isNaN(chunkIndex) || isNaN(totalChunks) || !uploadId) {
            return json({ error: 'Invalid upload data' }, { status: 400 });
        }
        
        // Create directories if they don't exist
        if (!existsSync(UPLOADS_DIR)) {
            await mkdir(UPLOADS_DIR);
        }
        if (!existsSync(TEMP_DIR)) {
            await mkdir(TEMP_DIR);
        }
        
        // Write chunk to temporary file
        const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
        const tempFilePath = join(TEMP_DIR, `${uploadId}-${chunkIndex}`);
        await writeFile(tempFilePath, chunkBuffer, { encoding: "binary" });
        
        // Detect MIME type from chunk data
        if (chunkIndex === 0) {
            const detectedMime = await fileTypeFromBuffer(chunkBuffer);
            if (!detectedMime) {
                return json({ code: "file_type_detection_failed", error: 'Unable to detect MIME type' }, { status: 400 });
            }

            // Check if MIME type is in allowed file types
            if (!allowedFileTypes.includes(detectedMime.mime)) {
                return json({ code: "invalid_file_type", error: 'File type not allowed' }, { status: 400 });
            }

            // if file name does not match /(.*) --- (.*)/, return 400
            if (!fileNameRegex.test(fileName)) {
                return json({ code: "invalid_file_name", error: 'Invalid file name' }, { status: 400 });
            }
        }
        
        // If this is the last chunk, combine all chunks
        if (chunkIndex === totalChunks - 1) {
            const finalFilePath = join(UPLOADS_DIR, fileName);
            
            // Combine all chunks
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = join(TEMP_DIR, `${uploadId}-${i}`);
                const chunkContent = await readChunk(chunkPath);
                await appendFile(finalFilePath, chunkContent, { encoding: "binary" });
                
                unlink(chunkPath, (err) => {
                    if (err) {
                        console.error(`Error deleting chunk file ${chunkPath}:`, err);
                    }
                });
            }
            
            stat(finalFilePath, async (err, stats) => {
                if (uploadConfig.maxFileSize > 0 && stats.size > uploadConfig.maxFileSize) {
                    unlink(finalFilePath, (err) => {
                        if (err) {
                            console.error(`Error deleting chunk file ${finalFilePath}:`, err);
                        }
                    });
                    return json({ error: `File size exceeds maximum allowed size of ${formatFileSize(uploadConfig.maxFileSize)}` }, { status: 400 });
                }
            });

            const audioDuration = await getAudioDurationInSeconds(finalFilePath);
            if (audioDuration > uploadConfig.maxAudioDuration) {
                unlink(finalFilePath, (err) => {
                    if (err) {
                        console.error(`Error deleting chunk file ${finalFilePath}:`, err);
                    }
                });
                return json({ error: `Audio duration exceeds maximum allowed duration of ${formatDuration(uploadConfig.maxAudioDuration)}` }, { status: 400 });
            }
            
            const fileBuffer = await readFileAsync(finalFilePath);
            const fileMime = await fileTypeFromBuffer(fileBuffer);

            if (!fileMime) {
                return json({ error: 'Unable to detect MIME type' }, { status: 500 });
            }

            const file = new File([fileBuffer], fileName, { type: fileMime.mime });
            console.log(`Uploading file ${fileName} (${formatFileSize(file.size)})...`);
            const { data, error } = await supabase
            .storage
            .from('whitelistrequests')
            .upload(`audios/user-${locals.user.id}_${fileName}`, file, {
                cacheControl: '3600',
                upsert: false
            })
            
            if (error) {
                console.error('Error uploading file:', error);
                return json({ errors: [{ message: 'Failed to upload file' }] }, { status: 500 });
            }
            
            unlink(finalFilePath, (err) => {
                if (err) {
                    console.error(`Error deleting chunk file ${finalFilePath}:`, err);
                }
            });

            await prisma.requests.create({
                data: {
                    fileName: file.name,
                    fullFilePath: data.fullPath,
                    filePath: data.path,
                    userId: locals.user.id
                }
            })

            return json({ message: 'File uploaded successfully' }, { status: 201 });
            
        }
        
        return json({ message: 'Chunk uploaded successfully' });
    } catch (error) {
        console.error('Error processing upload:', error);
        return json({ errors: [{ message: 'Failed to process upload.'}] }, { status: 500 });
    }
}

async function readChunk(path: string): Promise<Buffer> {
    try {
        const chunk = await readFileAsync(path);
        return chunk;
    } catch (error) {
        console.error(`Error reading chunk file ${path}:`, error);
        throw error;
    }
}

function formatFileSize(size: number): string {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
    return parts.join(', ');
}
