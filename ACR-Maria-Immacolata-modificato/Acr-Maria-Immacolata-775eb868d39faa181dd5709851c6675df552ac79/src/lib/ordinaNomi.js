// Ordinamento alfabetico "all'italiana": ignora maiuscole/minuscole e accenti.
const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true })

export function confrontaNomi(a, b) {
  return collator.compare((a ?? '').trim(), (b ?? '').trim())
}

// Ragazzi: per nome, a parità per cognome (come vengono mostrati: "Nome Cognome")
export function ordinaRagazzi(lista) {
  return [...lista].sort((a, b) => confrontaNomi(a.nome, b.nome) || confrontaNomi(a.cognome, b.cognome))
}

// Educatori: il campo `nome` contiene già nome e cognome
export function ordinaEducatori(lista) {
  return [...lista].sort((a, b) => confrontaNomi(a.nome, b.nome))
}

// Elenchi di semplici stringhe (es. chi ha firmato)
export function ordinaStringhe(lista) {
  return [...lista].sort(confrontaNomi)
}
