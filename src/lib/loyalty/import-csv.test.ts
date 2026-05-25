import { describe, it, expect } from 'vitest'
import { parseCSVLine, parseCSV, mapRowToInput } from './import-csv'

describe('parseCSVLine', () => {
  it('split simple par virgule', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('trim les espaces', () => {
    expect(parseCSVLine('a , b , c')).toEqual(['a', 'b', 'c'])
  })

  it('preserve virgule entre guillemets', () => {
    expect(parseCSVLine('"a,b",c')).toEqual(['a,b', 'c'])
  })

  it('echappe guillemet via doublement', () => {
    expect(parseCSVLine('"a""b",c')).toEqual(['a"b', 'c'])
  })

  it('valeur vide preservee', () => {
    expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c'])
  })

  it('trailing comma genere valeur vide', () => {
    expect(parseCSVLine('a,b,')).toEqual(['a', 'b', ''])
  })

  it('quoted vide est ok', () => {
    expect(parseCSVLine('a,"",c')).toEqual(['a', '', 'c'])
  })
})

describe('parseCSV', () => {
  it('header + rows simple', () => {
    const csv = 'phone,first_name,email\n+33612345678,Adam,a@b.fr\n+33687654321,Theo,'
    const { headers, rows } = parseCSV(csv)
    expect(headers).toEqual(['phone', 'first_name', 'email'])
    expect(rows).toEqual([
      ['+33612345678', 'Adam', 'a@b.fr'],
      ['+33687654321', 'Theo', ''],
    ])
  })

  it('header lowercase normalise', () => {
    const csv = 'Phone,First_Name,EMAIL\n+33612345678,Adam,a@b.fr'
    const { headers } = parseCSV(csv)
    expect(headers).toEqual(['phone', 'first_name', 'email'])
  })

  it('lignes vides ignorees', () => {
    const csv = 'phone,first_name\n+33612345678,Adam\n\n+33687654321,Theo\n'
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(2)
  })

  it('CRLF supporte', () => {
    const csv = 'phone,first_name\r\n+33612345678,Adam\r\n+33687654321,Theo'
    const { rows } = parseCSV(csv)
    expect(rows).toHaveLength(2)
  })

  it('CSV vide retourne arrays vides', () => {
    const { headers, rows } = parseCSV('')
    expect(headers).toEqual([])
    expect(rows).toEqual([])
  })

  it('CSV avec seulement header retourne 0 rows', () => {
    const { headers, rows } = parseCSV('phone,first_name')
    expect(headers).toEqual(['phone', 'first_name'])
    expect(rows).toEqual([])
  })
})

describe('mapRowToInput', () => {
  const headers = ['phone', 'first_name', 'email']

  it('happy path : tous champs presents', () => {
    const result = mapRowToInput(['+33612345678', 'Adam', 'a@b.fr'], headers)
    expect(result).toEqual({
      ok: true,
      value: { phone: '+33612345678', firstName: 'Adam', email: 'a@b.fr' },
    })
  })

  it('email vide -> email: null', () => {
    const result = mapRowToInput(['+33612345678', 'Adam', ''], headers)
    if (!result.ok) throw new Error('attendu ok')
    expect(result.value.email).toBeNull()
  })

  it('phone manquant -> missing_phone', () => {
    const result = mapRowToInput(['', 'Adam', 'a@b.fr'], headers)
    expect(result).toEqual({ ok: false, reason: 'missing_phone' })
  })

  it('first_name manquant -> missing_first_name', () => {
    const result = mapRowToInput(['+33612345678', '', 'a@b.fr'], headers)
    expect(result).toEqual({ ok: false, reason: 'missing_first_name' })
  })

  it('row vide -> empty_row', () => {
    const result = mapRowToInput(['', '', ''], headers)
    expect(result).toEqual({ ok: false, reason: 'empty_row' })
  })

  it('headers sans email column ok (email = null)', () => {
    const result = mapRowToInput(['+33612345678', 'Adam'], ['phone', 'first_name'])
    if (!result.ok) throw new Error('attendu ok')
    expect(result.value.email).toBeNull()
  })

  it('headers dans un ordre different', () => {
    const result = mapRowToInput(['Adam', '+33612345678', 'a@b.fr'], ['first_name', 'phone', 'email'])
    if (!result.ok) throw new Error('attendu ok')
    expect(result.value.phone).toBe('+33612345678')
    expect(result.value.firstName).toBe('Adam')
  })

  it('first_name trim les espaces', () => {
    const result = mapRowToInput(['+33612345678', '  Adam  ', 'a@b.fr'], headers)
    if (!result.ok) throw new Error('attendu ok')
    expect(result.value.firstName).toBe('Adam')
  })
})
