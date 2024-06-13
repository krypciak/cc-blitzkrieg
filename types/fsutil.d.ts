export declare class FsUtil {
    static exists(path: string): Promise<boolean>;
    static mkdirs(path: string): Promise<void>;
    static clearDir(path: string): Promise<void>;
    static mkdirsClear(path: string): Promise<void>;
    static writeFile(path: string, obj: any): Promise<void>;
    static readFileExternal(path: string): Promise<string>;
    static readFileInternalResponse(path: string): Promise<Response>;
    static readFileInternal(path: string): Promise<string>;
    static readFileJson(path: string): Promise<any>;
    static doesFileExist(path: string): Promise<boolean>;
    static copyFileInternal(from: string, dest: string): Promise<void>;
    static blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>;
    static downloadFile(url: string, outPath: string): Promise<void>;
    static unzipArchive(data: ArrayBuffer, targetPath: string): Promise<void[]>;
}
