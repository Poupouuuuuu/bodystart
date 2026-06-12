import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ArticleBlock, ArticleSection } from '@/lib/blog'

/**
 * Rendu des blocs d'article. Inline supporté : **gras** et [libellé](/route).
 * Les liens internes passent par next/link ; aucun HTML brut n'est injecté.
 */

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g

export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-spruce">
          {part.slice(2, -2)}
        </strong>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const [, label, href] = link
      if (href.startsWith('/')) {
        return (
          <Link key={i} href={href} className="font-semibold text-fresh hover:text-fresh-deep underline underline-offset-4 decoration-fresh/40">
            {label}
          </Link>
        )
      }
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-fresh underline underline-offset-4">
          {label}
        </a>
      )
    }
    return part
  })
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="text-ink/90 text-[16px] leading-[1.75] mb-5">{renderInline(block.text)}</p>
    case 'h3':
      return (
        <h3 className="font-display text-[19px] font-extrabold text-spruce tracking-tight mt-7 mb-3">
          {renderInline(block.text)}
        </h3>
      )
    case 'list':
      return (
        <ul className="space-y-2.5 mb-5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[16px] leading-[1.7] text-ink/90">
              <span className="w-1.5 h-1.5 rounded-full bg-fresh flex-shrink-0 mt-[11px]" aria-hidden="true" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="space-y-3 mb-5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[16px] leading-[1.7] text-ink/90">
              <span className="w-7 h-7 rounded-full bg-spruce text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="overflow-x-auto mb-6 rounded-xl border border-spruce/10">
          <table className="w-full text-[14px] bg-white">
            <thead>
              <tr className="bg-sage/70">
                {block.headers.map((h) => (
                  <th key={h} className="text-left font-bold text-spruce px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-spruce/8">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-ink/90 leading-snug">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export default function ArticleRenderer({ sections }: { sections: ArticleSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.h2} className="mb-10">
          <h2 className="font-display text-[24px] md:text-[27px] font-extrabold text-spruce tracking-tight leading-tight mb-4">
            {section.h2}
          </h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </>
  )
}
