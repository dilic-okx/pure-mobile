import translationCatalog from './translationCatalog.json'

let catalog = translationCatalog

export const getCatalog = () => {
	return catalog
}

export const setCatalog = newCatalog => {
	catalog = { ...translationCatalog, ...newCatalog }
}
