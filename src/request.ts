import { IncomingMessage } from "http";
import { Request } from "@opennetwork/http-representation";
import { getRequestHeaders } from "./headers";

export function fromRequest(request: IncomingMessage): Request {
  return new Request(
    request.url,
    {
      method: request.method,
      headers: getRequestHeaders(request),
      body: request // As readable
    }
  );
}
