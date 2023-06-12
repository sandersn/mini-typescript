# mini-typescript
A miniature model of the Typescript compiler, intended to teach the structure of the real Typescript compiler

I started this project as part of reading [Modern Compiler Implementation in ML](https://www.cs.princeton.edu/~appel/modern/ml/) because I wanted to learn more about compiler backends. When I started building the example compiler I found I disagreed with the implementation of nearly everything in the *frontend*. So I wrote my own, and found that I had just written [a small Typescript](https://github.com/sandersn/minits).

I realised a small Typescript would be useful to others who want to learn how the Typescript compiler works. So I rewrote it in Typescript and added some exercises to let you practise with it. The resulting compiler covers a tiny slice of Typescript: just `var` declarations, assignments and numeric literals. The only two types are `string` and `number`.

### To get set up

```sh
git clone https://github.com/sandersn/mini-typescript
cd mini-typescript
code .

# Get set up
npm i
npm run build

# Or have your changes instantly happen
npm run build --watch

# Run the compiler:
npm run mtsc ./tests/singleVar.ts
```

## Limitations

1. This is an example of the way that Typescript's compiler does things. A compiler textbook will help you learn *compilers*. This project will help you learn *Typescript's code*.
2. This is only a tiny slice of the language, also unlike a textbook. Often I only put it one instance of a thing, like nodes that introduce a scope, to keep the code size small.
3. There is no laziness, caching or node reuse, so the checker and transformer code do not teach you those aspects of the design.
4. There's no surrounding infrastructure, like a language service or a program builder. This is just a model of tsc.

## Future work

### Deci-typescript

A larger, 1/10-scale model of Typescript.
Things are still simplified, but the interfaces and method names are the same ones that Typescript uses.
I expect this to be a lot less friendly than the current milli-typescript approach, which only tries to convey the underlying ideas.
Roughly, my aim for mini-typescript originally was to be a textbook compiler written the Typescript way. I didn't look at the Typescript source when writing it.
My aim fom for deci-typescript is to be a simplified Typescript compiler. I'll start from Typescript's implementation most of the time.

One big difference from TypeScript will be better organisation.
A 1/10-scale of the checker is still 5,000 lines, but I intend to split it into one file per component.

Some concerns that might make it in:

- build system
- more realistic interface (eg createChecker, createFile, getSemanticDiagnostics, etc)
- language service
- file watcher
- module target
- module resolution
- package.json/tsconfig.json handling
- some fun flags (strict, target, checkjs?)
- different transform targets
- real binder flags implementation
- lookahead parsing of arrows
- type inference
- overloads
- real assignability implemention
- literals (and other unit types)
- classes
- generics
- `this` types and/or `this` parameters
- late-bound fields
- advanced types (index [access], mapped, conditional, template literals) -- probably not
- more efficient, realistic transform pipeline
- .d.ts transform
- js support. of any kind.
- realistic parsing/checking of binary expressions
- more realistic types (specifically, SyntaxKind and a single Node interface)
- objects and object types
- more realistic top-level exception handling and errors
- maybe generate error messages like diagnosticMessages.json?
- probably more realistic tests
- 3rd resolution space for binder: namespaces
- symbol flags/type flags
- caching of types on symbols

But:

- better organisation as files get long
- better baselines (and perhaps dropping or simplifying symbol baselines)

First up:

- [x] strings
- [x] objects
- [x] function expressions (arrows are too hard to parse and functions show off `this` semantics to boot)
- [x] return statements
- [x] assignability
- [x] tests of nested functions and objects
- [x] calls
- [ ] object types
- [ ] signatures
- [ ] real type node in parse tree
- [ ] property access/element access

Then:
- [ ] type argument inference
- [ ] control flow analysis
- [ ] `this`
- [ ] union types
- [ ] cleanup pass or two

## Exercises

- Add EmptyStatement.
- Make semicolon a statement ender, not statement separator.
  - Hint: You'll need a predicate to peek at the next token and decide if it's the start of an element.
  - Bonus: Switch from semicolon to newline as statement ender.
- Add string literals.
- Add `let`.
  - Make sure the binder resolves variables declared with `var` and `let` the same way. The simplest way is to add a `kind` property to `Symbol`.
  - Add use-before-declaration errors in the checker.
  - Finally, add an ES2015 -> ES5 transform that transforms `let` to `var`.
- Allow var to have multiple declarations.
  - Check that all declarations have the same type.
- Add objects and object types.
  - `Type` will need to become more complicated.
- Add `interface`.
  - Make sure the binder resolves types declared with `type` and `interface` the same way.
  - After the basics are working, allow interface to have multiple declarations.
  - Interfaces should have an object type, but that object type should combine the properties from every declaration.
- Add an ES5 transformer that converts `let` -> `var`.
- Add function declarations and function calls.
- Add arrow functions with an appropriate transform in ES5.
