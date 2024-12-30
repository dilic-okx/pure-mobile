const envKeyPrefix = 'REACT_APP_'
const defaultKeys = [ 'NODE_ENV', 'PUBLIC_URL' ]

export const getEnv = (key, addPrefix = true) => {
	//console.log('process.env', process.env)
	if (key) {
		const keyName = ( addPrefix && defaultKeys.indexOf(key) === -1 && key.indexOf(envKeyPrefix) === -1 ? envKeyPrefix : '' ) + key
		const value = process.env[keyName]
		if (!value || value === 'xxx') {
			throw new Error('Please define .env variable [' + keyName + ']')
		}
		return parseEnvProperty(value)
	}
	return null
}

export const getEntireEnv = () => {
	const resObj = {}
	Object.keys(process.env).forEach(key => {
		const value = process.env[key]
		if (value) {
			resObj[key] = getEnv(key)
		}
	})
	return resObj
}

/**
 * Convert specific process.env key to proper type
 * @public
 * @function
 * @param {string} envKey - name of env property
 * @return {string|number|array}
 */
const parseEnvProperty = value => {
	// if the value is wrapped in bacticks e.g. (`value`) then just return its value
	if (value.toString().indexOf('`') === 0
		&& value.toString().lastIndexOf('`') === value.toString().length - 1) {
		return value.toString().substring(1, value.toString().length - 1)
	}
	// if the value ends in an asterisk then just return its value
	if (value.toString().lastIndexOf('*') === value.toString().length - 1
		&& value.toString().indexOf(',') === -1) {
		return value.toString().substring(0, value.toString().length - 1)
	}
	// Boolean
	if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
		return value === 'true'
	}
	// Number
	if (!isNaN(value)) {
		return Number(value)
	}
	// Array
	if ((value.indexOf(',') !== -1 || value.indexOf('[') !== -1) && value.indexOf(']') !== -1) {
		let a = value
		a = a.replace(/'/g, '"')
		a = JSON.parse(a)
		return a
	}
	// object
	if (value.indexOf('{') === 0) {
		try {
			value = JSON.parse(value)
		} catch (e) {
			throw Error('Environment Variable has invalid JSON input.')
		}
	}
	return value
}
