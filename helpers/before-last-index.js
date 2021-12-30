const beforeLastIndex = (text = "", delimiter = ".") => {
	return text.split(delimiter).slice(0, -1).join(delimiter) || null;
};

export default beforeLastIndex;