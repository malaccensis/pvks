import {createRequire} from "module";
import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import {Command} from "commander";
import {exec, execSync, spawn} from "child_process";
import {savingAddress} from "./config/config.js";

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

const oauthCreds = require("./config/oauth-creds.json");
const credentials = oauthCreds.web;
const scopes = "https://www.googleapis.com/auth/cloud-platform";

const app = express();
const port = options.port || process.env.PORT;

app.get("/", (request, response) => {
	response.send("Hey...");
});
app.get("/last-crunch", (request, response) => {
	try {
		let lastCrunch = fs.readFileSync(`${savingAddress}live/live-ending-crunch.txt`, "utf-8");
		response.send(lastCrunch);
	} catch (error) {
		response.status(500).send("Failed to read Ending Crunch");
	}
});
app.get("/output", (request, response) => {
	try {
		let output = fs.readFileSync(`${savingAddress}output/output.txt`, "utf-8");
		response.send(output);
	} catch (error) {
		response.status(500).send("Failed to read Output");
	}
});
app.get("/pvk", (request, response) => {
	let command = request.query.command;
	if (command) {
		command = command.split(" ");
		spawn("node", command, {
			detached: true
		});
		response.send(command);
	} else {
		response.status(400).send("Use command params");
	}
});
app.get("/g-cloud", (request, response) => {
	const query = request.query.query;
	response.redirect(`${credentials.auth_uri}?redirect_uri=${credentials.redirect_uris[0]}&client_id=${credentials.client_id}&scope=${scopes}&response_type=code&prompt=consent&access_type=offline&${
		JSON.stringify({
			command: query
		})
	}`);
});
app.get("/g-cloud-oauthcallback", (request, response) => {
	const code = request.query.code;
	const scope = request.query.scope;
	if (code) {
		exec(`curl -s --request POST --data "redirect_uri=${credentials.redirect_uris[0]}&code=${code}&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}&grant_type=authorization_code&prompt=consent&access_type=offline" ${credentials.token_uri}`, (errorExchange, stdoutExchange, stderrExchange) => {
			if (stdoutExchange) {
				const exchangeJson = JSON.parse(stdoutExchange) || null;
				if (exchangeJson && exchangeJson.refresh_token) {
					response.send({
						success: true,
						message: "Success",
						access_token: exchangeJson.access_token
					});
				} else {
					response.status(500).send({
						success: false,
						message: "Credentials invalid"
					});
				}
			} else {
				response.status(500).send({
					success: false,
					message: "Credentials invalid"
				});
			}
		});
	} else {
		response.status(400).send("Use code params");
	}
});
app.listen(port, () => console.log("Server running on port", port));