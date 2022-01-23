import fs from "fs";
import https from "https";

const downloadFile = (url, path, callback = null) => {
	https.get(url, (res) => {
		const file = fs.createWriteStream(path);
		res.pipe(file);
		file.on("finish", () => {
			file.close();
			if (callback) callback();
		});
	});
};

export default downloadFile;