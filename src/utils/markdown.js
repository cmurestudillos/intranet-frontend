// Render de notas de Obsidian. El backend ya convierte los wikilinks en enlaces
// "obsidian:<ruta>#<seccion>" (o "obsidian-roto:" si la nota no existe).
import MarkdownIt from 'markdown-it'

// Debe coincidir con slugify() de intranet-backend/src/obsidian/parser.js
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// breaks: true imita a Obsidian con "saltos de línea estrictos" desactivado (su valor por defecto)
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

// Permite los esquemas propios además de los habituales
const validateLink = md.validateLink
md.validateLink = (url) => /^obsidian(-roto)?:/.test(url) || validateLink(url)

// ids en los encabezados para poder navegar a [[nota#Sección]]
md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const inline = tokens[idx + 1]
  if (inline && inline.type === 'inline') tokens[idx].attrSet('id', slugify(inline.content))
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href') || ''
  if (href.startsWith('obsidian-roto:')) {
    token.attrSet('class', 'wikilink wikilink-roto')
    token.attrSet('title', 'La nota no existe en el vault')
  } else if (href.startsWith('obsidian:')) {
    token.attrSet('class', 'wikilink')
  } else if (/^https?:/.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, idx, options)
}

// Casillas "- [ ]" / "- [x]" como checkboxes de solo lectura
md.core.ruler.after('inline', 'tasklists', (state) => {
  const tokens = state.tokens
  for (let i = 2; i < tokens.length; i++) {
    const inline = tokens[i]
    if (inline.type !== 'inline' || tokens[i - 2].type !== 'list_item_open') continue
    const m = /^\[([ xX])\]\s/.exec(inline.content)
    if (!m || !inline.children.length || inline.children[0].type !== 'text') continue
    const first = inline.children[0]
    first.content = first.content.replace(/^\[[ xX]\]\s/, '')
    const box = new state.Token('html_inline', '', 0)
    box.content = `<input type="checkbox" class="task-checkbox" disabled${m[1] === ' ' ? '' : ' checked'}> `
    inline.children.unshift(box)
    tokens[i - 2].attrJoin('class', 'task-item')
  }
})

export function renderNote(body) {
  return md.render(body || '')
}

// "obsidian:carpeta/nota.md#seccion" → { path, anchor }
export function parseObsidianHref(href) {
  const raw = href.replace(/^obsidian:/, '')
  const [path, anchor] = raw.split('#')
  return { path: decodeURI(path), anchor: anchor || null }
}
