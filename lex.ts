import { Token, Lexer } from './types'
const keywords = {
    "function": Token.Function,
    "var": Token.Var,
    "if": Token.If,
    "else": Token.Else,
    "return": Token.Return,
}
function findKey<T>(o: T, pred: (s: keyof T) => boolean): keyof T | undefined {
    for (const k in o) {
        if (pred(k)) {
            return k
        }
    }
}
export function lex(s: string): Lexer {
    let pos = 0
    let text = ""
    let token = Token.BOF
    return {
        scan() {
            scanForward(c => /[ \t\b\n]/.test(c))
            if (pos === s.length) {
                token = Token.EOF
            }
            else if (!scanKeyword()) {
                scanToken()
            }
        },
        token: () => token,
        pos: () => pos,
        text: () => text,
    }

    function scanToken() {
        const start = pos
        if (/[0-9]/.test(s.charAt(pos))) {
            scanForward(c => /[0-9]/.test(c))
            text = s.slice(start, pos)
            token = Token.Literal
            return
        }
        if (/[_a-zA-Z]/.test(s.charAt(pos))) {
            scanForward(c => /[_a-zA-Z0-9]/.test(c))
            text = s.slice(start, pos)
            token = Token.Identifier
            return
        }
        pos++
        switch (s.charAt(pos - 1)) {
            case "{": token = Token.LeftBrace; break
            case "}": token = Token.RightBrace; break
            case '(': token = Token.LeftParen; break
            case ')': token = Token.RightParen; break
            case '=': token = Token.Equals; break
            case ';': token = Token.Semicolon; break
            case ":": token = Token.Colon; break
            default: token = Token.Unknown; break
        }
    }
    function scanKeyword() {
        let kw = findKey(keywords, kw => s.slice(pos).startsWith(kw))
        if (kw) {
            text = kw
            token = keywords[kw]
            pos += kw.length
        }
        return !!kw
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
            case Token.Literal:
                tokens.push({ token: t, text: lexer.text() })
                break
            default:
                tokens.push({ token: t })
                break
        }
    }
}
