const fs: typeof import('fs') = (0, eval)('require("fs")')
const path: typeof import('path') = (0, eval)('require("path")')

import { loadAsync } from 'jszip'

export class FsUtil {
    static async exists(path: string): Promise<boolean> {
        return new Promise(resolve => {
            fs.promises
                .stat(path)
                .then(() => resolve(true))
                .catch(_err => resolve(false))
        })
    }

    static async mkdirs(path: string): Promise<void> {
        return fs.promises.mkdir(path, { recursive: true })
    }

    static async clearDir(path: string) {
        const promises: Promise<void>[] = []
        for (const file of await fs.promises.readdir(path)) {
            const filePath = `${path}/${file}`
            promises.push(
                new Promise<void>(async resolve => {
                    if ((await fs.promises.lstat(filePath)).isDirectory()) {
                        await FsUtil.clearDir(filePath)
                        await fs.promises.rmdir(filePath)
                    } else {
                        await fs.promises.unlink(filePath)
                    }
                    resolve()
                })
            )
        }
        await Promise.all(promises)
    }

    static async mkdirsClear(path: string): Promise<void> {
        return (await FsUtil.exists(path)) ? FsUtil.clearDir(path) : FsUtil.mkdirs(path)
    }

    static async writeFile(path: string, obj: any): Promise<void> {
        return fs.promises.writeFile(path, typeof obj === 'string' ? obj : JSON.stringify(obj))
    }

    static async readFileExternal(path: string): Promise<string> {
        return (await fs.promises.readFile(path)).toString()
    }

    static async readFileInternalResponse(path: string): Promise<Response> {
        if (path.startsWith('assets/')) {
            path = path.substring('assets/'.length)
        }
        return fetch(path)
    }

    static async readFileInternal(path: string): Promise<string> {
        return (await this.readFileInternalResponse(path)).text()
    }

    static async readFileJson(path: string): Promise<any> {
        return (await this.readFileInternalResponse(path)).json()
    }

    static async doesFileExist(path: string): Promise<boolean> {
        return new Promise(resolve => {
            fs.promises
                .stat(path)
                .then(() => resolve(true))
                .catch(_err => resolve(false))
        })
    }

    static async copyFileInternal(from: string, dest: string): Promise<void> {
        return FsUtil.writeFile(dest, await FsUtil.readFileInternal(from))
    }

    static async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        if ('arrayBuffer' in blob) {
            return await blob.arrayBuffer()
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as ArrayBuffer)
            reader.onerror = () => reject()
            reader.readAsArrayBuffer(blob)
        })
    }

    static async downloadFile(url: string, outPath: string): Promise<void> {
        const blob = await (await fetch(url, { mode: 'cors' })).blob()
        const arrayBuffer = await FsUtil.blobToArrayBuffer(blob)
        return fs.promises.writeFile(outPath, Buffer.from(arrayBuffer))
    }

    static async unzipArchive(data: ArrayBuffer, targetPath: string) {
        const zip = await loadAsync(data)

        return Promise.all(
            Object.values(zip.files)
                .filter(file => !file.dir)
                .map(async file => {
                    const data = await file.async('uint8array')
                    const relative = path.join(targetPath, file.name)
                    if (relative.startsWith('..' + path.sep)) {
                        return
                    }

                    const filepath = relative
                    try {
                        await fs.promises.mkdir(path.dirname(filepath), { recursive: true })
                    } catch {}
                    return fs.promises.writeFile(filepath, data)
                })
        )
    }
}
