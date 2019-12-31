const fs = require('fs');
const path = require('path');

const deleteFile = (filePaths) => {
    const filePath = path.join(path.dirname(process.mainModule.filename), filePaths);
    console.log(filePath);
    fs.unlink(filePath, err => {
        if(err) {
            throw new Error(err);
        }
    })
};

exports.deleteFile = deleteFile;