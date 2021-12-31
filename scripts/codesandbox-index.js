const os = require("os");
const http = require("http");
const {spawn} = require("child_process");

const port = "2230";

let hostname = os.hostname();
hostname = hostname.split("-");
hostname = hostname[hostname.length - 1];

const newDomain = `${hostname}-${port}`;
const newHost = `https://${newDomain}.sse.codesandbox.io`;

http.createServer((request, response) => {
	if (request.url === "/") {
		response.write("Hello World!");
		response.end();
	} else if (request.url === "/pvks") {
		spawn("/sandbox/src/nodejs/bin/node", ["/sandbox/src/pvks-index.js", "-p", port], {
			detached: true
		});
		response.writeHead(200, {
			"Content-Type": "application/json"
		});
		response.end(JSON.stringify({
			"domain": newDomain,
			"url": newHost
		}));
	} else {
		response.write("404");
		response.end();
	}
}).listen(8080);