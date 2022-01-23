import privateKeyToAddress from "ethereum-private-key-to-address";
import os from "os";
import fs from "fs";
import lineByLine from "n-readlines";
import {exec, execSync} from "child_process";
import {Command} from "commander";
import {doc, getDoc, Timestamp, updateDoc} from "firebase/firestore";
import {db} from "./config/firebase-config.js";
import {chalkBold, chalkError, chalkInfo, log} from "./config/chalk-config.js";
import {collection, liveEndingCrunch, savingAddress, scriptId, statuses} from "./config/config.js";
import keepAlive from "./helpers/keep-alive.js";
import arrayDistinct from "./helpers/array-distinct.js";
import getLastCrunch from "./helpers/get-last-crunch.js";

const commandExec = "eth-private-key-finder";

let currentDate = new Date();
let currentYear = new Intl.DateTimeFormat("en", {year: "numeric"}).format(currentDate);
let currentMonth = new Intl.DateTimeFormat("en", {month: "numeric"}).format(currentDate);
let currentDay = new Intl.DateTimeFormat("en", {day: "numeric"}).format(currentDate);
let currentTime = currentDate.getTime();

const program = new Command();
program
	.alias(commandExec)
	.version("0.1.0", "-v, --version", "output the current version")
	.description(`Search "Private Key" by address${os.EOL}Author: Havea Crenata <havea.crenata@gmail.com>`)
	.option("-a, --address <addresses...>", "single or multiple address start with 0x")
	.option("-s, --start <hex|string>", "set start from")
	.option("-e, --end <hex|string>", "set end to")
	.option("-f, --file <path>", "address list in file")
	.option("-u, --url <url>", "address list from url")
	.option("-o, --output <path>", "output found addresses", `output/output.txt`)
	.option("-w, --wordlist <path>", "wordlist", `${savingAddress}live/START`)
	.option("-c, --code <string>", "google oauth code", "ya29.")
	.option("-r, --resume", "resume from last key", false)
	.addHelpText("after", `${os.EOL}Examples:${os.EOL}  $ ${commandExec} -a 0x5A83529ff76Ac5723A87008c4D9B436AD4CA7d28${os.EOL}  $ ${commandExec} -f address-list.txt${os.EOL}  $ ${commandExec} -f address-list.txt -o output.txt${os.EOL}  $ ${commandExec} -a 0x5A83529ff76Ac5723A87008c4D9B436AD4CA7d28 0xB83B6241f966B1685C8B2fFce3956E21F35B4DcB${os.EOL}  $ ${commandExec} -a 0x5A83529ff76Ac5723A87008c4D9B436AD4CA7d28$ -s 000000000000000000000000000000000000000000000000000000000000000c -e 000000000000000000000000000000000000000000000000000000000000000f`);
program.parse(process.argv);
const options = program.opts();

const initFirestoreDatabase = () => {
	updateDoc(doc(db, collection, scriptId), {
		status: statuses.first,
		updated_at: Timestamp.now()
	}).then((data) => {
		return true;
	}).catch((error) => {
		return initFirestoreDatabase();
	});
};
const getFirestoreLastCrunch = () => {
	return getDoc(doc(db, collection, scriptId)).then((snapshot) => {
		return snapshot.data();
	}).catch((error) => {
		return false;
	});
};
const logging = (status) => {
	let lastCrunch = getLastCrunch();
	if (lastCrunch) {
		let output = [];
		try {
			const liner = new lineByLine(options.output);
			let next;
			let lineNumber = 0;
			while (next = liner.next()) {
				const data = next.toString("ascii");
				output.push(data);
				lineNumber++;
			}
		} catch (error) {
			log(chalkError("Can't open file, no such file or directory"));
		}
		getFirestoreLastCrunch().then((data) => {
			let finalOutput = output.concat(data.output).filter((value, index, self) => {
				return self.indexOf(value) === index;
			});
			updateDoc(doc(db, collection, scriptId), {
				last_crunch: lastCrunch,
				output: finalOutput,
				status: status,
				updated_at: Timestamp.now()
			}).then((data) => {
				return true;
			}).catch((error) => {
				return logging(status);
			});
		}).catch((error) => {
			return logging(status);
		});
	} else {
		return logging(status);
	}
};
const interval = setInterval(() => {
	logging(statuses.first);
}, 1000 * 60 * 10);

const regenerate = (inputAddresses = [], fileAddresses = [], urlAddresses = []) => {
	exec(`cd ${savingAddress}crunch-3.6 && make && cd .. && ./crunch-3.6/crunch 64 64 0123456789abcdef -b 5mb -o ${options.wordlist} -r`, (error, stdout, stderr) => {
		if (error) {
			processLineByLine(inputAddresses, fileAddresses, urlAddresses);
		} else {
			log(chalkInfo("Done."));
			clearInterval(interval);
			logging(statuses.second);
			process.exit();
		}
	});
};
const save = (format) => {
	try {
		fs.appendFileSync(options.output, format);
		logging(statuses.third);
	} catch (error) {
		log(chalkError(`Failed to save ${format}`));
	}
};

const processLineByLine = (inputAddresses = [], fileAddresses = [], urlAddresses = []) => {
	inputAddresses = arrayDistinct(inputAddresses);
	fileAddresses = arrayDistinct(fileAddresses);
	urlAddresses = arrayDistinct(urlAddresses);

	try {
		const liner = new lineByLine(options.wordlist);

		let next;
		let lineNumber = 0;
		while (next = liner.next()) {
			const privateKey = next.toString("ascii");

			try {
				const address = privateKeyToAddress(privateKey);
				const format = `${privateKey}/${address}${os.EOL}`;

				for (const inputAddress of inputAddresses) {
					if (address.toLowerCase() === inputAddress.toLowerCase()) {
						save(format);
						inputAddresses = inputAddresses.filter(value => value !== inputAddress);
					}
				}

				for (const fileAddress of fileAddresses) {
					if (address.toLowerCase() === fileAddress.toLowerCase()) {
						save(format);
						fileAddresses = fileAddresses.filter(value => value !== fileAddress);
					}
				}

				for (const urlAddress of urlAddresses) {
					if (address.toLowerCase() === urlAddress.toLowerCase()) {
						save(format);
						urlAddresses = urlAddresses.filter(value => value !== urlAddress);
					}
				}

				try {
					fs.writeFileSync(liveEndingCrunch, privateKey);
				} catch (error) {
					log(chalkError("Failed to replace Ending Crunch"), error);
				}

				if (options.address && inputAddresses.length === 0) {
					inputAddresses = [];
					liner.close();
				}
				if (options.file && fileAddresses.length === 0) {
					fileAddresses = [];
					liner.close();
				}
				if (options.url && urlAddresses.length === 0) {
					urlAddresses = [];
					liner.close();
				}
				if (options.end) {
					if (privateKey.toLowerCase() === options.end.toLowerCase()) {
						inputAddresses = [];
						fileAddresses = [];
						urlAddresses = [];
						liner.close();
					}
				}
			} catch (error) {
				//
			}

			lineNumber++;
		}

		try {
			if (fs.existsSync(options.wordlist)) {
				execSync(`rm ${options.wordlist}`);
			}
		} catch (error) {
			log(chalkError("Failed to removed Wordlist"));
		}

		keepAlive(() => {
			if (inputAddresses.length > 0 || fileAddresses.length > 0 || urlAddresses.length > 0) {
				try {
					let lastCrunch = getLastCrunch();
					fs.writeFileSync(options.wordlist, lastCrunch + os.EOL);
					regenerate(inputAddresses, fileAddresses, urlAddresses);
				} catch (error) {
					log(chalkError("Failed to read Ending Crunch"));
				}
			} else {
				log(chalkInfo("Done."));
				clearInterval(interval);
				logging(statuses.second);
				process.exit();
			}
		});
	} catch (error) {
		log(chalkError("Can't open wordlist, no such file or directory"), error.message);
	}
}

if (!options.address && !options.file && !options.url) {
	log(chalkError(`Atleast use ${chalkBold("-a")}, ${chalkBold("-f")}, or ${chalkBold("-u")} parameter.`));
	process.exit();
}
if (options.start) {
	if (options.start.length < 64) {
		log(chalkError("Invalid start private key, min 64 characters."));
		process.exit();
	}
}
if (options.end) {
	if (options.end.length < 64) {
		log(chalkError("Invalid end private key, min 64 characters."));
		process.exit();
	}
}

let fileAddresses = [];
if (options.file) {
	try {
		const fileLineAddresses = new lineByLine(options.file);
		let nextAddress;
		let fileLineNumber = 0;
		while (nextAddress = fileLineAddresses.next()) {
			const fileAddress = nextAddress.toString("ascii");
			fileAddresses.push(fileAddress);
			fileLineNumber++;
		}
	} catch (error) {
		log(chalkError("Can't open file, no such file or directory"));
	}
}

let urlAddresses = [];
if (options.url) {
	try {
		execSync(`curl ${options.url} -o ${savingAddress}downloads/${currentTime}.txt`);
		try {
			const urlLineAddresses = new lineByLine(`${savingAddress}downloads/${currentTime}.txt`);
			let nextAddress;
			let urlLineNumber = 0;
			while (nextAddress = urlLineAddresses.next()) {
				const urlAddress = nextAddress.toString("ascii");
				urlAddresses.push(urlAddress);
				urlLineNumber++;
			}
		} catch (error) {
			log(chalkError("Can't open file, no such file or directory"));
		}
	} catch (error) {
		log(chalkError("Failed to download Addresses"));
	}
}

initFirestoreDatabase();

if (options.resume) {
	try {
		let lastCrunch = getLastCrunch();
		fs.writeFileSync(options.wordlist, lastCrunch + os.EOL);

		regenerate(options.address, fileAddresses, urlAddresses);
	} catch (error) {
		log(chalkError("Failed to read Ending Crunch"));
	}
} else {
	if (options.start) {
		try {
			if (fs.existsSync(options.wordlist)) {
				execSync(`rm ${options.wordlist}`);
			}
		} catch (error) {
			//
		}

		try {
			fs.writeFileSync(options.wordlist, options.start + os.EOL);
			regenerate(options.address, fileAddresses, urlAddresses);
		} catch (error) {
			log(chalkError("Failed to read Ending Crunch"));
		}
	} else {
		exec(`cd ${savingAddress}crunch-3.6 && make && cd .. && ./crunch-3.6/crunch 64 64 0123456789abcdef -b 5mb -o ${options.wordlist}`, (error, stdout, stderr) => {
			if (error) {
				processLineByLine(options.address, fileAddresses, urlAddresses);
			} else {
				//
			}
		});
	}
}
