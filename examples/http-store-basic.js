import { FSStore } from "@opennetwork/http-store";
import { fromRequest, sendResponse } from "../dist";
import http from "http";
import fs from "fs";
import rimraf from "rimraf";
import { mkdirp } from "fs-extra";

const store = new FSStore({
  fs,
  rootPath: './examples/store',
  statusCodes: http.STATUS_CODES,
  rimraf,
  mkdirp
});

const port = 8080;

const server = http.createServer((request, response) => {
  return store.fetch(
    fromRequest(request, `http://localhost:${port}/`)
  )
    .then(representation => sendResponse(representation, request, response))
    .catch(error => {
      console.error({ error });
      try {
        response.writeHead(500, {
          "Content-Type": "text/plain"
        });
        response.end(error.message);
      } catch(e) {
        // Unsure what to do here, this would have only been if
        // the head was already written
      }
    });
});


server.listen(port, () => console.log(`Listening on port ${port}`));
