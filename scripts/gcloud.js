import {createRequire} from "module";
const require = createRequire(import.meta.url);

import {google} from "googleapis";
import {exec, execSync} from "child_process";
import {Command} from "commander";
import os from "os";
import {
	chalkBold,
	chalkInfo,
	chalkSuccess,
	chalkError,
	chalkValid,
	line,
	log
} from "../config/chalk-config.js";

const oauthCreds = require("../config/oauth-creds.json");
const credentials = oauthCreds.web;

const commandExec = "eth-private-key-finder";

const program = new Command();
program
	.alias(`${commandExec} - Google Cloud`)
	.version("0.1.0", "-v, --version", "output the current version")
	.description(`Search "Private Key" by address${os.EOL}Author: Havea Crenata <havea.crenata@gmail.com>`)
	.option("-c, --code <string>", "code")
	.option("-s, --scopes <array|string>", "https://www.googleapis.com/auth/cloud-platform");
program.parse(process.argv);
const options = program.opts();

if (!options.code) {
	log(chalkError(`Atleast use ${chalkBold("-c")} parameter.`));
	process.exit();
}

console.log("Code", options.code);

exec(`curl -s --request POST --data "redirect_uri=${credentials.redirect_uris[0]}&code=${options.code}&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}&grant_type=authorization_code&prompt=consent&access_type=offline" ${credentials.token_uri}`, (errorExchange, stdoutExchange, stderrExchange) => {
	if (stdoutExchange) {
		const exchangeJson = JSON.parse(stdoutExchange) || null;
		if (exchangeJson && exchangeJson.refresh_token) {
			console.log("Refresh Token:", exchangeJson.refresh_token);
			exec(`curl -s --request POST --data "refresh_token=${exchangeJson.refresh_token}&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}&grant_type=refresh_token&prompt=consent&access_type=offline" ${credentials.token_uri}`, (errorRefresh, stdoutRefresh, stderrRefresh) => {
				if (stdoutRefresh) {
					const refreshJson = JSON.parse(stdoutRefresh) || null;
					if (refreshJson && refreshJson.access_token) {
						console.log("Access Token:", refreshJson.access_token);
						exec(`curl -X POST https://cloudshell.googleapis.com/v1/users/me/environments/default:start -H "Accept: application/json" -H "Authorization: Bearer ${refreshJson.access_token}"`, (errorStart, stdoutStart, stderrStart) => {
							if (stdoutStart) {
								if (!stdoutStart.error) {
									console.log("Data:", stdoutStart);
								} else {
									console.log("Start Instance:", "Credentials invalid!");
								}
							} else {
								console.log("Failed to start!", errorStart, stderrStart);
							}
						});
					} else {
						console.log("Refresh Token:", "Credentials invalid!");
					}
				} else {
					console.log("Failed refresh token!", errorRefresh, stderrRefresh);
				}
			});
		} else {
			console.log("Exchange Token:", "Credentials invalid!");
		}
	} else {
		console.log("Failed exchange token!", errorExchange, stderrExchange);
	}
});