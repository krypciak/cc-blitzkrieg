export declare class FsUtil {
    static mkdirs(path: string): void;
    static clearDir(path: string): void;
    static mkdirsClear(path: string): void;
    static writeFile(path: string, obj: any): Promise<void>;
    static writeFileSync(path: string, obj: any): void;
    static readFileResponse(path: string): Promise<Response>;
    static readFile(path: string): Promise<string>;
    static readFileJson(path: string): Promise<any>;
    static doesFileExist(path: string): boolean;
    static copyFile(from: string, dest: string): Promise<void>;
    static listFiles(path: string): string[];
    static basename(path1: string): string;
}
