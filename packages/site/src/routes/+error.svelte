<script lang="ts">
    import { page } from "$app/state";
    
    // Map HTTP status codes to their messages
    const httpStatusMessages = {
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Payload Too Large",
        414: "URI Too Long",
        415: "Unsupported Media Type",
        416: "Range Not Satisfiable",
        417: "Expectation Failed",
        418: "I'm a Teapot",
        421: "Misdirected Request",
        422: "Unprocessable Entity",
        423: "Locked",
        424: "Failed Dependency",
        425: "Too Early",
        426: "Upgrade Required",
        428: "Precondition Required",
        429: "Too Many Requests",
        431: "Request Header Fields Too Large",
        451: "Unavailable For Legal Reasons",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported",
        506: "Variant Also Negotiates",
        507: "Insufficient Storage",
        508: "Loop Detected",
        510: "Not Extended",
        511: "Network Authentication Required"
    };

    function isValidHttpStatus(status: number): status is keyof typeof httpStatusMessages {
        return status in httpStatusMessages;
    }
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
    <div class="text-center">
        <div class="flex justify-center mb-4">
            <span class="iconify text-red-500 text-6xl" data-icon="mdi:alert-circle-outline"></span>
        </div>
        <h1 class="text-4xl font-bold mb-2">{page.status}: {isValidHttpStatus(page.status) ? httpStatusMessages[page.status] : "Unknown Error"}</h1>
        <p class="text-lg text-gray-600">{page.error?.message || "An unexpected error occurred."}</p>
    </div>
</main>
