import {
    platforms,
    protocol,
    domain,
    platform,
    platformDomain
} from "../config/config.js";

const keepAlive = (callback = null) => {
    if (platform === platforms.first) {
        exec(`curl ${protocol}://${domain}.${platformDomain}/last-crunch`, (error, stdout, stderr) => {
            if (callback) callback();
        });
    } else {
        if (callback) callback();
    }
};

export default keepAlive;