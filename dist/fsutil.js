"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FsUtil = void 0;
const fs = (0, eval)('require("fs")');
const path = (0, eval)('require("path")');
class FsUtil {
    static mkdirs(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    }
    static clearDir(path) {
        fs.readdirSync(path).forEach((file) => {
            const filePath = `${path}/${file}`;
            if (fs.lstatSync(filePath).isDirectory()) {
                FsUtil.clearDir(filePath);
                fs.rmdirSync(filePath);
            }
            else {
                fs.unlinkSync(filePath);
            }
        });
    }
    static mkdirsClear(path) {
        if (fs.existsSync(path)) {
            FsUtil.clearDir(path);
        }
        else {
            FsUtil.mkdirs(path);
        }
    }
    static writeFile(path, obj) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, typeof obj === 'string' ? obj : JSON.stringify(obj), (err) => {
                if (err) {
                    console.error('error writing file:', err);
                    reject();
                }
                else {
                    resolve();
                }
            });
        });
    }
    static writeFileSync(path, obj) {
        fs.writeFileSync(path, typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
    static readFileSync(path) {
        return fs.readFileSync(path);
    }
    static doesFileExist(path) {
        return fs.existsSync(path);
    }
    static listFiles(path) {
        return fs.readdirSync(path);
    }
    static basename(path1) {
        return path.basename(path1);
    }
}
exports.FsUtil = FsUtil;
