const fs: typeof import('fs') = (0, eval)('require("fs")')
const path: typeof import('path') = (0, eval)('require("path")')

export class FsUtil {
    static mkdirs(path: string) {
        if (! fs.existsSync(path)) { fs.mkdirSync(path, { recursive: true }) }
    }

    static clearDir(path: string) {
        fs.readdirSync(path).forEach((file: string) => {
            const filePath = `${path}/${file}`

            if (fs.lstatSync(filePath).isDirectory()) {
                FsUtil.clearDir(filePath)
                fs.rmdirSync(filePath)
            } else {
                fs.unlinkSync(filePath)
            }
        })
    }

    static mkdirsClear(path: string) {
        if (fs.existsSync(path)) {
            FsUtil.clearDir(path)
        } else {
            FsUtil.mkdirs(path)
        }
    }
    
    static writeFile(path: string, obj: any): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, typeof obj === 'string' ? obj : JSON.stringify(obj), (err: any) => {
                if (err) {
                    console.error('error writing file:', err)
                    reject()
                } else {
                    resolve()
                }
            })
        })
    }
    static writeFileSync(path: string, obj: any) {
        fs.writeFileSync(path, typeof obj === 'string' ? obj : JSON.stringify(obj))
    }

    static async readFileResponse(path: string): Promise<Response> {
        if (path.startsWith('assets/')) { path = path.substring('assets/'.length) }
        return fetch(path)
    }
    static async readFile(path: string): Promise<string> {
        return (await this.readFileResponse(path)).text()
    }
    static async readFileJson(path: string): Promise<any> {
        return (await this.readFileResponse(path)).json()
    }
    
    static doesFileExist(path: string): boolean {
        return fs.existsSync(path)
    }
    
    static async copyFile(from: string, dest: string): Promise<void> {
        return FsUtil.writeFile(dest, await FsUtil.readFile(from))
    }

    static listFiles(path: string): string[] {
        return fs.readdirSync(path)
    }
    
    static basename(path1: string): string {
        return path.basename(path1)
    }
}
