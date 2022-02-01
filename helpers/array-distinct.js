const arrayDistinct = (array) => {
    return array.filter((value, index, self) => {
        return self.indexOf(value) === index;
    });
};

export default arrayDistinct;