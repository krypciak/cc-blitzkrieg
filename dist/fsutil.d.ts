export declare class FsUtil {
    static mkdirs(path: string): void;
    static clearDir(path: string): void;
    static mkdirsClear(path: string): void;
    static writeFile(path: string, obj: any): Promise<void>;
    static writeFileSync(path: string, obj: any): void;
    static readFileSync(path: string): string;
    static doesFileExist(path: string): boolean;
    static listFiles(path: string): string[];
    static basename(path1: string): string;
}
