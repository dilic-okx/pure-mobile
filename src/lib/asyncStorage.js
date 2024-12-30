const browserLocalStorage = global.window && global.window.localStorage
	? global.window.localStorage
	: window && window.localStorage
		? window.localStorage
		: localStorage
			? localStorage : null

const promisify = val => {
	return new Promise(resolve => {
		setTimeout(() => { resolve(val) }, 30)
	})
}

const throwNoLSError = () => {
	throw new Error('No local storage support!')
}

const asyncStorage = {
	getItem: async key => {
		if (browserLocalStorage) {
			return promisify(browserLocalStorage.getItem(key))
		}
		throwNoLSError()
	},
	setItem: async (key, val) => {
		if (browserLocalStorage) {
			return promisify(browserLocalStorage.setItem(key, val))
		}
		throwNoLSError()
	},
	removeItem: async key => {
		if (browserLocalStorage) {
			return promisify(browserLocalStorage.removeItem(key))
		}
		throwNoLSError()
	}
}

export default asyncStorage
