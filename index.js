import {createRequire} from "module";
import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import {Command} from "commander";
import {exec, execSync, spawn} from "child_process";
import {savingAddress} from "./config/config.js";
import downloadFile from "./helpers/download-file.js";
import getLastCrunch from "./helpers/get-last-crunch.js";
import getOutput from "./helpers/get-output.js";

const require = createRequire(import.meta.url);

const commandExec = "eth-private-key-finder";

const program = new Command();
program
	.alias(commandExec)
	.version("0.1.0", "-v, --version", "output the current version")
	.description(`Search "Private Key" by address${os.EOL}Author: Havea Crenata <havea.crenata@gmail.com>`)
	.option("-p, --port <port>", "listen port", 3000)
	.addHelpText("after", `${os.EOL}Examples:${os.EOL}  $ ${commandExec} -p 3000`);
program.parse(process.argv);
const options = program.opts();

const app = express();
const port = options.port || process.env.PORT;

app.get("/", (request, response) => {
	response.send("Hey...");
});
app.get("/last-crunch", (request, response) => {
	let lastCrunch = getLastCrunch();
	if (lastCrunch) response.send(lastCrunch);
	response.status(500).send("Failed to read Ending Crunch");
});
app.get("/output", (request, response) => {
	let output = getOutput();
	if (output) response.send(output);
	response.status(500).send("Failed to read Output");
});
app.get("/pvk", (request, response) => {
	let command = request.query.command;
	if (command) {
		command = command.split(" ");
		spawn(`${savingAddress}nodejs/bin/node`, command, {
			detached: true
		});
		response.send(command);
	} else {
		response.status(400).send("Use command params");
	}
});
app.get("/command", (request, response) => {
	let command = request.query.command;
	if (command) {
		let data = execSync(command).toString();
		response.send(`<pre>${data}</pre>`);
	} else {
		response.status(400).send("Use command params");
	}
});
app.get("/download-file", (request, response) => {
	let url = request.query.url;
	let path = request.query.path;
	if (url && path) {
		downloadFile(url, path, () => {
			response.send("Downloaded");
		});
	} else {
		response.status(400).send("Use command params");
	}
});
app.listen(port, () => console.log("Server running on port", port));