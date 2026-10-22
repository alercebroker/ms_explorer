// The side list of the results page an object was opened from, kept for this tab, so the object page
// shows it without running the search again. A list from another search is ignored.
const KEY = 'explorer-side-list'

// The search behind an object page: its query without the selected object, in a stable form
// (a reload turns a one-item array into a string).
function searchKey(query) {
  const search = { ...query }
  delete search.selected_oid
  return JSON.stringify(
    Object.keys(search)
      .sort()
      .map((key) => [key, [].concat(search[key]).map(String)])
  )
}

export function saveSideList(query, html) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ search: searchKey(query), html })
    )
  } catch {}
}

export function savedSideList(query) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY))
    if (saved && saved.search === searchKey(query)) return saved.html
  } catch {}
  return null
}
