import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ofetch } from "ofetch";
import { getBots } from '../lib/credentialService';
import { prisma, supabase } from '../lib/database';

type AudioInformationResponse = {
    id: string,
    reviewStatus: 'Finished' | 'InReview' | 'NotReviewed',
    isModerated: boolean
}[]

@ApplyOptions<Listener.Options>({
    event: "ready",
    once: true 
})
export class UserEvent extends Listener {

    private updatesChannel = supabase.channel("updates")

    public override async run() {
        this.taskLoop();
        setInterval(this.taskLoop.bind(this), 10 * 60 * 1000);
    }

    private async taskLoop() {
        const audios = await this.retrieveAudios()

        const groupedAudios = audios.reduce((acc, curr) => {
            const key = curr.uploaderUserId
            if (!acc[key]) acc[key] = []
            acc[key].push(curr)
            return acc
        }, {} as Record<string, typeof audios>)

        for (const audio in groupedAudios) {
            await this.checkAudios(audio, groupedAudios[audio])
        }
        
    }

    private async handleAudioModeration(audios: { id: string, name: string, category: string, uploaderUserId: string, requesterUserId: string }[], isModerated: boolean) {
        
        if (audios.length == 0) return;

        prisma.uploadedAudio.updateMany({
            where: {
                id: {
                    in: audios.map(audio => audio.id)
                }
            },
            data: {
                inModerationQueue: false,
                isModerated: isModerated
            }
        }).catch(x => {
            console.log(`Failed to update ${x.count} audios in moderation queue`, x)
        })

        if (isModerated) {
            const moderationNotification = this.generateModerationNotification(audios[0].requesterUserId, audios);
            this.updatesChannel.send({
                type: "broadcast",
                event: "audio_requests_moderated",
                payload: moderationNotification
            })
        }

    }

    private async checkAudios(uploaderUserId: string, audios: { id: string, name: string, category: string, uploaderUserId: string, requesterUserId: string }[]) {
        const bots = await getBots()
        const uploaderBot = bots.find(x => x.decrypted_secret.userId == uploaderUserId)
        if (!uploaderBot) return

        if (audios.length == 0) {
            console.log(`No audios to check for ${uploaderBot.description} (${uploaderBot.decrypted_secret.userId})`)
            return
        }
        console.log(`Checking audios for ${uploaderBot.description} (${uploaderBot.decrypted_secret.userId})`)
        const { data }: { data: AudioInformationResponse } = await ofetch(`https://develop.roblox.com/v1/assets?assetIds=${audios.map(x => x.id).join(',')}`, {
            headers: {
                "Cookie": `.ROBLOSECURITY=${uploaderBot.decrypted_secret.accountCookie}`
            }
        })

        const moderatedAudios = data.filter(audio => audio.reviewStatus == 'Finished' && audio.isModerated)
        const approvedAudios = data.filter(audio => audio.reviewStatus == 'Finished' && !audio.isModerated)

        this.handleAudioModeration(audios.filter(x => moderatedAudios.find(y => y.id == x.id)), true)
        this.handleAudioModeration(audios.filter(x => approvedAudios.find(y => y.id == x.id)), false)

    }

    private async retrieveAudios() {
        const data = await prisma.uploadedAudio.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                uploaderUserId: true,
                requesterUserId: true
            },
            where: {
                inModerationQueue: true
            }
        })

        return data
    }

    private generateModerationNotification(userId: string, audios: { id: string, name: string, category: string, uploaderUserId: string, requesterUserId: string }[]) {
        return {
            userId: userId,
            messageData: {
                "content": null,
                "embeds": [
                  {
                    "title": ":warning: Some of your requested audios were moderated",
                    "description": "We've automatically detected that the following audio you requested for whitelisting earlier has been removed by **roblox moderation**.\n\nThe following is a list of audios that were moderated.",
                    "color": 16763981,
                    "fields": [
                      {
                        "name": "Moderated audios",
                        "value": audios.map(audio => `- ${audio.category} - ${audio.name}`).join('\n')
                      }
                    ]
                  }
                ],
                "attachments": []
            }
        }
    }
    
}

