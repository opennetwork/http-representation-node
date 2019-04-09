import { IncomingMessage, ServerResponse } from "http";
import { Response, asBestSuited } from "@opennetwork/http-representation";
import { getResponseHeaders, applyResponseHeaders } from "./headers";

export function fromResponse(response: ServerResponse): Response {
  // At this point, we know nothing, so don't provide status
  // It will default to 200
  return new Response(
    undefined,
    {
      headers: getResponseHeaders(response)
    }
  );
}

export async function sendResponse(representation: Response, request: Request | IncomingMessage, response: ServerResponse): Promise<any> {
  if (representation.status === 100) {
    // Idk if this actually makes sense to do this on behalf.
    // But it mimics the 100 stuff as far as I can tell, so should be fine
    // I guess it just opens the request!
    return new Promise(resolve => response.writeContinue(resolve));
  } else if (representation.status === 204 || representation.status === 304) {
    representation.headers.delete("");
    representation.headers.delete("Content-Type");
    representation.headers.delete("Content-Length");
    representation.headers.delete("Transfer-Encoding");
    applyResponseHeaders(response, representation.headers);
  } else if (request.method !== "HEAD") {
    // Content-Type would be applied from kind of body
    applyResponseHeaders(response, representation.headers);
    const {
      text,
      blob,
      formData,
      arrayBuffer,
      buffer,
      readable
    } = await asBestSuited(representation);
    if (typeof text === "string" || buffer || arrayBuffer) {
      await new Promise((resolve, reject) => response.write(typeof text === "string" ? text : (buffer || arrayBuffer), (error) => error ? reject(error) : resolve()));
    } else if (blob || formData) {
      // How did we get here? Node.js doesn't have blob support
      throw new Error("Blob and FormData are not implemented for responses");
    } else if (readable) {
      readable.pipe(response, {
        // We will end below
        end: false
      });
    }
  } else {
    applyResponseHeaders(response, representation.headers);
  }

  response.writeHead(representation.status, representation.statusText);
  await new Promise(resolve => response.end(resolve));
}
