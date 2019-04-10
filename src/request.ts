import { IncomingMessage } from "http";
import { Request } from "@opennetwork/http-representation";
import { getRequestHeaders } from "./headers";

export function fromRequest(request: IncomingMessage, baseUrl: string = undefined): Request {
  return new Request(
    new URL(request.url, baseUrl).toString(),
    {
      method: request.method,
      headers: getRequestHeaders(request),
      body: request // As readable
    }
  );
}
