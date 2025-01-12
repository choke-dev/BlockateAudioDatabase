import { ROBLOX_WEBAPI_COOKIE } from "$env/static/private";
import axios from "axios";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
    const audioId = params.audioId;
    // const audioFileResponse = await fetch('https://assetdelivery.roblox.com/v1/assets/batch', {
    //     method: "POST",
    //     headers: {
    //         "Cookie": encodeURIComponent(ROBLOX_WEBAPI_COOKIE)
    //     },
    //     body: JSON.stringify({ assetIds: [audioId] })
    // })
    // if (!audioFileResponse.ok) return new Response(JSON.stringify({ success: false, data: null }), { status: 400 });

    const audioFileResponse = await axios.post('https://assetdelivery.roblox.com/v1/assets/batch', {
        headers: {
            "Cookie": ROBLOX_WEBAPI_COOKIE
        },
        body: JSON.stringify([{"requestId":"1837871067","assetId":audioId}])
      })
      .catch(function (error) {
        console.log(error.response.data);
      })

      console.log(audioFileResponse.data);
    //@ts-ignore
    const audioFile = await audioFileResponse[0].lo
    
    return new Response(audioFile, { status: 200 });
};