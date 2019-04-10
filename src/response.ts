import { IncomingMessage, ServerResponse } from "http";
import { Response, asBuffer, Headers } from "@opennetwork/http-representation";
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
    workingHeaders.delete("Content-Type");
    workingHeaders.delete("Content-Length");
    workingHeaders.delete("Transfer-Encoding");
  }

  applyResponseHeaders(response, workingHeaders);

  // If statusText is not a string here, the status value will be looked up against http.STATUS_CODES
  // This is why in http-representation we don't mind if you don't supply statusText, it will be resolved
  // when it is needed!
  response.writeHead(representation.status, representation.statusText, undefined);

  if (!noBody && request.method !== "HEAD") {
    const buffer = await asBuffer(representation);
    response.write(buffer);
  }

  if (!response.finished) {
    // Finish up our response if we need to
    // It may have already been ended by a pipe
    await new Promise(resolve => response.end(resolve));
  }
}
