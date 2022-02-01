import fs from "fs";
import {latestOutput} from "../config/config.js";

const getOutput = () => {
    try {
        return fs.readFileSync(latestOutput, "utf-8");
    } catch (error) {
        return false;
    }
};

export default getOutput;