import { SyntaxKind, Lexer } from './types'
const keywords = {
    "function": SyntaxKind.Function,
    "var": SyntaxKind.Var,
    "if": SyntaxKind.If,
    "else": SyntaxKind.Else,
    "return": SyntaxKind.Return,
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
    let token = SyntaxKind.BOF
    return {
        scan() {
            scanForward(c => /[ \t\b]/.test(c))
            if (pos === s.length) {
                token = SyntaxKind.EOF
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
            token = SyntaxKind.IntLiteral
            return
        }
        if (/[_a-zA-Z]/.test(s.charAt(pos))) {
            scanForward(c => /[_a-zA-Z0-9]/.test(c))
            text = s.slice(start, pos)
            token = SyntaxKind.Identifier
            return
        }
        pos++
        switch (s.charAt(pos - 1)) {
            case '\n': token = SyntaxKind.Newline; break
            case "{": token = SyntaxKind.LeftBrace; break
            case "}": token = SyntaxKind.RightBrace; break
            case '(': token = SyntaxKind.LeftParen; break
            case ')': token = SyntaxKind.RightParen; break
            case '=': token = SyntaxKind.Equals; break
            case ';': token = SyntaxKind.Semicolon; break
            case ":": token = SyntaxKind.Colon; break
            default: token = SyntaxKind.Unknown; break
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
            case SyntaxKind.EOF:
                return tokens
            case SyntaxKind.Identifier:
            case SyntaxKind.IntLiteral:
                tokens.push({ token: t, text: lexer.text() })
                break
            default:
                tokens.push({ token: t })
                break
        }
    }
}
