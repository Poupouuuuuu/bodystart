'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
}

export default function SearchBar({
  initialQuery = '',
  placeholder = 'Rechercher un produit&hellip;',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push('/search?q=' + encodeURIComponent(query.trim()))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'relative flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
        className,
      ].join(' ')}
    >
      <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
        className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm"
        autoFocus
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
