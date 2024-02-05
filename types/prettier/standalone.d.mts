declare namespace Qo {
    function parse(...r: any[]): Promise<any>
    function formatAST(...r: any[]): Promise<any>
    function formatDoc(...r: any[]): Promise<any>
    function printToDoc(...r: any[]): Promise<any>
    function printDocToString(...r: any[]): Promise<any>
}
declare function Xo(t: any, e: any): Promise<boolean>
declare var Uc: {}
declare var er: {}
declare function su(t: any, e: any): Promise<any>
declare function iu(...r: any[]): Promise<any>
declare function Zo(...r: any[]): Promise<any>
declare var Qt: {}
declare var ou: string
export { Qo as __debug, Xo as check, Uc as default, er as doc, su as format, iu as formatWithCursor, Zo as getSupportInfo, Qt as util, ou as version }
