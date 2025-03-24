const fs = require('fs');
const path = require('path');


function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function readFileContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (['.txt', '.md', '.json'].includes(ext)) {
        return fs.readFileSync(filePath, 'utf-8');
    } else {
        return '[Unsupported file type for reading: ' + ext + ']';
    }
}

module.exports = {
    getAllFiles,
    readFileContent,
};