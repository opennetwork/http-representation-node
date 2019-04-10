const { FSStore } = require('@opennetwork/http-store'),
  { fromRequest, sendResponse } = require('../dist'),
  http = require('http'),
  fs = require('fs');

const store = new FSStore({
  fs,
  rootPath: './examples/store',
  statusCodes: http.STATUS_CODES
});

const port = 8080;

const server = http.createServer((request, response) => {
  return store.fetch(
    fromRequest(request, `http://localhost:${port}/`)
  )
    .then(representation => sendResponse(representation, request, response))
    .catch(error => {
      console.error(error);
      try {
        response.writeHead(500, {
          "Content-Type": "text/plain"
        });
        response.end(error.message);
      } catch(e) {

      }
    });
});


server.listen(port, () => console.log(`Listening on port ${port}`));
