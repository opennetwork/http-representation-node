import { IncomingMessage, ServerResponse } from "http";
import { Response, asBestSuited, Headers } from "@opennetwork/http-representation";
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
  }

  // We are going to possibly modify these
  const workingHeaders = new Headers(representation.headers);

  const noBody = representation.status === 204 || representation.status === 304;

  if (noBody) {
    // Remove any headers that are disallowed!
    workingHeaders.delete("");
    workingHeaders.delete("Content-Type");
    workingHeaders.delete("Content-Length");
    workingHeaders.delete("Transfer-Encoding");
  }

  applyResponseHeaders(response, workingHeaders);

  // If statusText is not a string here, the status value will be looked up against http.STATUS_CODES
  // This is why in http-representation we don't mind if you don't supply statusText, it will be resolved
  // when it is needed!
  response.writeHead(representation.status, representation.statusText);

  if (!noBody && request.method !== "HEAD") {
    // Content-Type would be applied from kind of body
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
      // Pass the error up, and also wait for the readable to finish before ending the response
      const promise = new Promise((resolve, reject) => {
        readable.once("error", reject);
        readable.once("end", resolve);
      });
      readable.resume();
      await promise;
    }
  }

  if (!response.finished) {
    // Finish up our response if we need to
    // It may have already been ended by a pipe
    await new Promise(resolve => response.end(resolve));
  }
}
