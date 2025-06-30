import { ofetch } from "ofetch";
import { JUKEHOSTCONNECT_KEY } from "$env/static/private";

export const uploadAudio = async (file: Blob, filename?: string) => {
    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("owner", "65748");

    console.log(`Uploading audio preview for ID: ${filename}`);
    const response = await fetch("https://audio.jukehost.co.uk/upload", {
        method: "POST",
        body: formData
    });
    
    if (response.ok) {
        console.log(`Uploaded audio preview for ID: ${filename}`);
        return true;
    }
    console.log(`Failed to upload audio preview for ID: ${filename}`);
    console.log(await response.text())
    return false
};

// returned id is NOT a numerical integer, it's a hash which can be queried using https://audio.jukehost.co.uk/${id}
// name is the audio ID (${<numerical integer>}.<file extension>)
export const getAudios = async (): Promise<{ id: string; name: string }[]> => {
    const response = await ofetch(`https://jukehost.co.uk/api/jhc/${JUKEHOSTCONNECT_KEY}`);
    return response[0].tracks
};