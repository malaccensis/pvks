import fs from "fs";
import {liveEndingCrunch} from "../config/config.js";

const getLastCrunch = () => {
    try {
        return fs.readFileSync(liveEndingCrunch, "utf-8");
    } catch (error) {
        return false;
    }
};

export default getLastCrunch;