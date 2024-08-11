export let JSZip: typeof import('jszip')

export async function initLibraries() {
    if (blitzkrieg.mod.isCCL3) {
        // @ts-expect-error
        JSZip = ccmod.jszip
    } else {
        // @ts-expect-error
        JSZip = window.JSZip
    }
}
