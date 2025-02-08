import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { supabase } from '../lib/database';

const EVENTS_TO_LISTEN = [
    "audio_request_accepted",
    "audio_requests_moderated"
]

@ApplyOptions<Listener.Options>({
    event: "ready",
    once: true 
})
export class UserEvent extends Listener {

	public override run() {
        const channel = supabase.channel("updates")

        channel.on("broadcast", { event: "*" }, async (metadata) => {
            if (!EVENTS_TO_LISTEN.includes(metadata.event)) return;
            const payload = metadata.payload;

            const user = await this.container.client.users.fetch(payload.userId)

            try {
                user.send(payload.messageData);
            } catch(err) {
                this.container.logger.error(`Failed to send message to ${user.username}`);
            }

        }).subscribe();
	}

}
