import { Token, Lexer } from './types.js'
const keywords = {
    "function": Token.Function,
    "var": Token.Var,
    "type": Token.Type,
    "return": Token.Return,
}
export function lex(s: string): Lexer {
    let pos = 0
    let text = ""
    let token = Token.BOF
    return {
        scan,
        token: () => token,
        pos: () => pos,
        text: () => text,
    }
    function scan() {
        scanForward(c => /[ \t\b\n]/.test(c))
        const start = pos
        if (pos === s.length) {
            token = Token.EOF
        }
        else if (s.charAt(pos) === '"') {
            pos++
            scanForward(c => /[^\"]/.test(c))
            if (s.charAt(pos) !== '"') {
                // TODO: Better error reporting (and return the current span as a string)
                throw new Error("unclosed string literal")
            }
            else {
                pos++
            }
            text = s.slice(start, pos)
            token = Token.StringLiteral
        }
        else if (/[0-9]/.test(s.charAt(pos))) {
            scanForward(c => /[0-9]/.test(c))
            text = s.slice(start, pos)
            token = Token.NumericLiteral
        }
        else if (/[_a-zA-Z]/.test(s.charAt(pos))) {
            scanForward(c => /[_a-zA-Z0-9]/.test(c))
            text = s.slice(start, pos)
            token = text in keywords ? keywords[text as keyof typeof keywords] : Token.Identifier
        }
        else {
            pos++
            switch (s.charAt(pos - 1)) {
                case '=': token = Token.Equals; break
                case ',': token = Token.Comma; break
                case ';': token = Token.Semicolon; break
                case ":": token = Token.Colon; break
                case "{": token = Token.OpenBrace; break
                case "}": token = Token.CloseBrace; break
                default: token = Token.Unknown; break
            }
        }
    }
    function scanForward(pred: (x: string) => boolean) {
        while (pos < s.length && pred(s.charAt(pos))) pos++
    }
}
export function lexAll(s: string) {
    const lexer = lex(s)
    let tokens = []
    let t
    while(true) {
        lexer.scan()
        t = lexer.token()
        switch (t) {
            case Token.EOF:
                return tokens
            case Token.Identifier:
            case Token.NumericLiteral:
                tokens.push({ token: t, text: lexer.text() })
                break
            default:
                tokens.push({ token: t })
                break
        }
    }
}
