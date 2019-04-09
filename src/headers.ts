import { Headers } from "@opennetwork/http-representation";
import { IncomingMessage, OutgoingMessage } from "http";

export function getRequestHeaders(request: IncomingMessage): Headers {
  return Headers.guarded(request.headers, "immutable");
}

export function getResponseHeaders(response: OutgoingMessage): Headers {
  // This is a static view, but we will bring in line once applied
  return new Headers(response.getHeaders());
}

export function applyResponseHeaders(response: OutgoingMessage, headers: Headers) {
  const existingNames = response.getHeaderNames()
    .map(value => value.toLowerCase());
  const newNames = Array.from(headers.keys())
    .map(value => value.toLowerCase());

  // Remove any names that aren't in our set of names
  existingNames
    .filter(name => newNames.indexOf(name) === -1)
    .forEach(name => response.removeHeader(name));

  // This will overwrite the header, with the array of header values we want
  newNames
    .forEach(name => response.setHeader(name, headers.getAll(name)));
}
