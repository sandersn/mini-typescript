var o = { x: 1, y: "string" }
o = { x: 2, y: "string" }
o = { x: 3, y: "string", extra: "yep" }
o = { x: 4 }
o = { x: 5, z: "hiiii" }
o = { k: "byeeee" }
var p: { x: number, y: string } = o
var q: { x: number, y: string, extra: string } = o
var r: { x: number } = o
var s: { x: number, z: string } = { x: 1, z: "string" }
var t: { y: string, x: number } = o
var oof = {
    first: "John",
    last: "Doe",
    f: function (x: string) {
        return {
            first: x,
            last: "Last"
        }
    },
    extra: "yep"
}
type In = { a: number }
var f = function (inward: { a: number }): { c: string } {
    return { c: "string" }
}
var i: In = { a: 1 }
f(i)
