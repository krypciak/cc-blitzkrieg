declare var FA: {}
declare var yl: (
    | {
          linguistLanguageId: number
          name: string
          type: string
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          color: undefined
          aliases: undefined
          extensions: string[]
          filenames: undefined
          interpreters: undefined
          parsers: string[]
          vscodeLanguageIds: string[]
          group: string
      }
    | {
          linguistLanguageId: number
          name: string
          type: string
          color: string
          aliases: string[]
          interpreters: string[]
          extensions: string[]
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          parsers: string[]
          vscodeLanguageIds: string[]
          filenames?: undefined
          group?: undefined
      }
    | {
          linguistLanguageId: number
          name: string
          type: string
          color: string
          group: string
          extensions: string[]
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          parsers: string[]
          vscodeLanguageIds: string[]
          aliases?: undefined
          filenames?: undefined
          interpreters?: undefined
      }
    | {
          linguistLanguageId: number
          name: string
          type: string
          color: string
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          aliases: string[]
          extensions: string[]
          filenames: string[]
          parsers: string[]
          vscodeLanguageIds: string[]
          group?: undefined
      }
    | {
          linguistLanguageId: number
          name: string
          type: string
          color: string
          group: string
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          aliases: string[]
          extensions: string[]
          filenames: string[]
          parsers: string[]
          vscodeLanguageIds: string[]
      }
    | {
          linguistLanguageId: number
          name: string
          type: string
          color: string
          extensions: string[]
          tmScope: string
          aceMode: string
          codemirrorMode: string
          codemirrorMimeType: string
          parsers: string[]
          vscodeLanguageIds: string[]
          aliases?: undefined
          filenames?: undefined
          group?: undefined
      }
)[]
declare namespace sa {
    export namespace arrowParens {
        export { Nt as category }
        export let type: string
        let _default: string
        export { _default as default }
        export let description: string
        export let choices: {
            value: string
            description: string
        }[]
    }
    import bracketSameLine = ir.bracketSameLine
    export { bracketSameLine }
    import bracketSpacing = ir.bracketSpacing
    export { bracketSpacing }
    export namespace jsxBracketSameLine {
        export { Nt as category }
        let type_1: string
        export { type_1 as type }
        let description_1: string
        export { description_1 as description }
        export let deprecated: string
    }
    export namespace semi {
        export { Nt as category }
        let type_2: string
        export { type_2 as type }
        let _default_1: boolean
        export { _default_1 as default }
        let description_2: string
        export { description_2 as description }
        export let oppositeDescription: string
    }
    import singleQuote = ir.singleQuote
    export { singleQuote }
    export namespace jsxSingleQuote {
        export { Nt as category }
        let type_3: string
        export { type_3 as type }
        let _default_2: boolean
        export { _default_2 as default }
        let description_3: string
        export { description_3 as description }
    }
    export namespace quoteProps {
        export { Nt as category }
        let type_4: string
        export { type_4 as type }
        let _default_3: string
        export { _default_3 as default }
        let description_4: string
        export { description_4 as description }
        let choices_1: {
            value: string
            description: string
        }[]
        export { choices_1 as choices }
    }
    export namespace trailingComma {
        export { Nt as category }
        let type_5: string
        export { type_5 as type }
        let _default_4: string
        export { _default_4 as default }
        let description_5: string
        export { description_5 as description }
        let choices_2: {
            value: string
            description: string
        }[]
        export { choices_2 as choices }
    }
    import singleAttributePerLine = ir.singleAttributePerLine
    export { singleAttributePerLine }
}
declare var ml: {
    estree: {}
    'estree-json': {}
}
declare var Nt: string
declare namespace ir {
    export namespace bracketSpacing_1 {
        export let category: string
        let type_6: string
        export { type_6 as type }
        let _default_5: boolean
        export { _default_5 as default }
        let description_6: string
        export { description_6 as description }
        let oppositeDescription_1: string
        export { oppositeDescription_1 as oppositeDescription }
    }
    export { bracketSpacing_1 as bracketSpacing }
    export namespace singleQuote_1 {
        let category_1: string
        export { category_1 as category }
        let type_7: string
        export { type_7 as type }
        let _default_6: boolean
        export { _default_6 as default }
        let description_7: string
        export { description_7 as description }
    }
    export { singleQuote_1 as singleQuote }
    export namespace proseWrap {
        let category_2: string
        export { category_2 as category }
        let type_8: string
        export { type_8 as type }
        let _default_7: string
        export { _default_7 as default }
        let description_8: string
        export { description_8 as description }
        let choices_3: {
            value: string
            description: string
        }[]
        export { choices_3 as choices }
    }
    export namespace bracketSameLine_1 {
        let category_3: string
        export { category_3 as category }
        let type_9: string
        export { type_9 as type }
        let _default_8: boolean
        export { _default_8 as default }
        let description_9: string
        export { description_9 as description }
    }
    export { bracketSameLine_1 as bracketSameLine }
    export namespace singleAttributePerLine_1 {
        let category_4: string
        export { category_4 as category }
        let type_10: string
        export { type_10 as type }
        let _default_9: boolean
        export { _default_9 as default }
        let description_10: string
        export { description_10 as description }
    }
    export { singleAttributePerLine_1 as singleAttributePerLine }
}
export { FA as default, yl as languages, sa as options, ml as printers }
