'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
}

export default function SearchBar({
  initialQuery = '',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Mobile : fermer le clavier, sinon il cache les résultats.
    inputRef.current?.blur()
    if (query.trim()) {
      router.push('/search?q=' + encodeURIComponent(query.trim()))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'relative flex items-center bg-white border border-spruce/15 rounded-2xl px-4 py-3 shadow-soft focus-within:border-fresh focus-within:ring-2 focus-within:ring-fresh/20',
        className,
      ].join(' ')}
    >
      <Search className="w-5 h-5 text-ink-mute flex-shrink-0 mr-3" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
        aria-label="Rechercher un produit"
        className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-mute text-[16px] md:text-sm [&::-webkit-search-cancel-button]:hidden"
        // Focus seulement sur la page vide : avec une recherche déjà faite, le
        // clavier se rouvrait par-dessus les résultats (bug du 17/10/2026).
        autoFocus={!initialQuery}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="-my-2.5 -mr-2.5 ml-1 flex h-11 w-11 flex-shrink-0 items-center justify-center text-ink-mute hover:text-ink transition-colors"
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
