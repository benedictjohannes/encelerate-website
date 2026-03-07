---
title: 'Markdown Style Guide'
description: 'Here is a sample of some basic Markdown syntax that can be used when writing Markdown content in Astro.'
pubDate: 'Jun 19 2024'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

Here is a sample of some basic Markdown syntax that can be used when writing Markdown content in Astro.

## Headings

The following HTML `<h1>`—`<h6>` elements represent six levels of section headings. `<h1>` is the highest section level while `<h6>` is the lowest.

# Heading 1 `#`

## Heading 2 `##`

### Heading 3 `###`

#### Heading 4 `####`

##### Heading 5 `#####`

###### Heading 6 `######`

## Paragraph

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat.

## Images

### Syntax

```markdown
![Alt text](./full/or/relative/path/of/image)
```

### Output

![blog placeholder](../../assets/blog-placeholder-about.jpg)

## Blockquotes

The blockquote element represents content that is quoted from another source, optionally with a citation which must be within a `footer` or `cite` element, and optionally with in-line changes such as annotations and abbreviations.

### Blockquote without attribution

#### Syntax

```markdown
> Tiam, ad mint andaepu dandae nostion secatur sequo quae.  
> **Note** that you can use _Markdown syntax_ within a blockquote.
```

#### Output

> Tiam, ad mint andaepu dandae nostion secatur sequo quae.  
> **Note** that you can use _Markdown syntax_ within a blockquote.

### Blockquote with attribution

#### Syntax

```markdown
> Don't communicate by sharing memory, share memory by communicating.
> <cite>Rob Pike[^1]</cite>
```

#### Output

> Don't communicate by sharing memory, share memory by communicating.
> <cite>Rob Pike[^1]</cite>

[^1]: The above quote is excerpted from Rob Pike's [talk](https://www.youtube.com/watch?v=PAAkCSZUG1c) during Gopherfest, November 18, 2015.

## Tables

### Syntax

```markdown
| Drink       | Source            | Energy     |
| :---------- | :---------------- | :--------- |
| _Coffee_    | **Roasted Beans** | `High`     |
| _Green Tea_ | **Dried Leaves**  | `Balanced` |
```

### Output

| Drink       | Source            | Energy     |
| :---------- | :---------------- | :--------- |
| _Coffee_    | **Roasted Beans** | `High`     |
| _Green Tea_ | **Dried Leaves**  | `Balanced` |

## Premium Table Card

For structured data that needs a sophisticated look, you can use the `table-card` and `table-title` wrappers. Note how the headers here use the custom sans-serif font instead of the global serif font.

<div class="table-card">
<div class="table-title"><h3>Comparison: Go vs Rust</h3></div>

| Feature            | Go                       | Rust                           |
| :----------------- | :----------------------- | :----------------------------- |
| **Typing**         | Static, Strong           | Static, Strong, ADTs           |
| **Concurrency**    | Goroutines & Channels    | Ownership & Send/Sync          |
| **Performance**    | High (with Runtime GC)   | Exceptional (No Runtime GC)    |
| **Error Handling** | explicit `if err != nil` | Result Type & Pattern Matching |
| **Memory**         | Garbage Collected        | Borrow Checker (Zero Cost)     |

</div>

## Code Blocks

### Syntax

we can use 3 backticks ``` in new line and write snippet and close with 3 backticks on new line and to highlight language specific syntax, write one word of language name after first 3 backticks, for eg. html, javascript, css, markdown, typescript, txt, bash

````markdown
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example HTML5 Document</title>
  </head>
  <body>
    <p>Test</p>
  </body>
</html>
```
````

### Output

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example HTML5 Document</title>
  </head>
  <body>
    <p>Test</p>
  </body>
</html>
```

## List Types

### Ordered List

#### Syntax

```markdown
1. First item
2. Second item
3. Third item
```

#### Output

1. First item
2. Second item
3. Third item

### Unordered List

#### Syntax

```markdown
- List item
- Another item
- And another item
```

#### Output

- List item
- Another item
- And another item

### Nested list

#### Syntax

```markdown
- Fruit
  - Apple
  - Orange
  - Banana
- Dairy
  - Milk
  - Cheese
```

#### Output

- Dairy
  - Milk
  - Cheese

## Links

### Syntax

```markdown
[Inline-style link](https://google.com)

[Link with title](https://google.com "Google's Homepage")
```

### Output

[Inline-style link](https://google.com)

[Link with title](https://google.com "Google's Homepage")

## Horizontal Rules

Three or more hyphens, asterisks, or underscores.

---

## Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

## Emphasis & Strikethrough

```markdown
~~Strikethrough~~
**_Combined Bold & Italics_**
```

~~Strikethrough text~~
**_Combined Bold & Italics_**

## Emojis ✨

Most modern Markdown parsers support emoji shortcodes or direct Unicode.

```markdown
:rocket: :sparkles: :memo:
```

🚀 ✨ 📝


## Other Elements — abbr, sub, sup, kbd, mark

### Syntax

```markdown
<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format.

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

Press <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> to end the session.

Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures.
```

### Output

<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format.

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

Press <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> to end the session.

Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures.
