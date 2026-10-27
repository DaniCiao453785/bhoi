// Ordina le classi per il campo `ordine` (1 = prima); quelle senza ordine vanno in fondo.
export function ordinaClassi(classi) {
  return [...classi].sort(
    (a, b) => (a.ordine ?? 9999) - (b.ordine ?? 9999) || a.nome.localeCompare(b.nome, 'it')
  )
}
