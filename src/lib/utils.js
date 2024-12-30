import history from '../history'
import { default as BigNumberInstance } from './bignumber'
import { default as momentInstance } from './moment'
import navConfig from '../navConfig'
import { getConfig } from '../appConfig'
import { isMobileOnly } from 'react-device-detect'

export const BigNumber = BigNumberInstance

export const moment = momentInstance

export const emptyString = '--'

export const parseDecimal = (val, places) => {
	places = places || 2
	if (typeof val === 'string' || val instanceof String) {
		if ((val === '.' || val === '0.' || val.slice(-1) === '.') && val.slice(0, -1) === parseInt(val, 10).toString()) {
			return val
		}
	}
	return parseFloat(parseFloat(val).toFixed(places))
}

export const getComponentByDomNode = querySelector => {
	const dom = global.window.document.querySelector(querySelector)
	for (const key in dom) {
		if (key.startsWith('__reactInternalInstance$')) {
			const reactNode = dom[key]
			if (reactNode._currentElement) {
				// v15 < react < v16
				const compInternals = reactNode._currentElement
				if (compInternals) {
					const compWrapper = compInternals._owner
					if (compWrapper) {
						return compWrapper._instance
					}
				}
			} else {
				// react v16+
				return reactNode && reactNode.return && reactNode.return.stateNode
			}
		}
	}
	return null
}

// declarative "nav to"
export const forwardTo = (location, historyState = null) => {
	if (location === history.location.pathname) {
		// prevent to push same path to the history object multiple times in the row
		history.replace(location, historyState)
		return
	} else {
		history.push(location, historyState)
	}
}

export const goBack = () => history.goBack()

export const go = (val = -1) => history.go(val)

export const getDefaultRoute = protectedRoute => {
	protectedRoute = protectedRoute ? protectedRoute : false
	let defaultRoute = navConfig.routes.find(item => item.default === true && (protectedRoute ? item.protected === true : item.protected !== true))
	if (!defaultRoute) {
		defaultRoute = navConfig.routes.find(item => protectedRoute ? item.protected === true : item.protected !== true)
	}
	return defaultRoute || navConfig.routes[0]
}

export const getHistoryState = (path = null) => !path ? null : getPropertyByPath(history, 'location.state.' + path)

export const getScrollbarWidth = element => {
	let scrollbarWidth = 0
	if (element) {
		scrollbarWidth = element.offsetWidth - element.clientWidth
	} else if (global && global.window) {
		scrollbarWidth = global.window.innerWidth - global.window.document.documentElement.clientWidth
	}
	return scrollbarWidth
}

/**
 * Helper utility function
 * checking if `item` is not `undefined` and not `null`
 * @public
 * @function
 * @param {object|string|array|number} item - source object with property "path" we want to check
 * @return {boolean} item is defined or not
 */
export const isDefined = item => item !== undefined && item !== null

/**
 * Check if object have defined some path.
 * (e.g. path='someObj.property1.property2')
 * @public
 * @param {Object} object object for check
 * @param {String} [path=''] object for check
 * @return {Boolean}
 * @function
 */
export const deepIsDefined = (object, path = '') => {
	let def = true
	let obj = { ...object }
	const arr = path.split('.')

	arr.forEach(level => {
		if (!obj[level]) {
			def = false
			return
		}
		obj = obj[level]
	})
	return def
}

export const setPropertyByPath = (object, path = '', value) => {
	if (path.indexOf('.') === -1) {
		if (isDefined(value)) {
			object[path] = value
		}
		return object
	} else {
		let paths = path.split('.')
		const singlePath = paths[0]
		paths = paths.slice(1, paths.length)
		if (!object[singlePath]) {
			object[singlePath] = {}
		}
		setPropertyByPath(object[singlePath], paths.join('.'), value)
		return object
	}
}

export const getPropertyByPath = (object, path = '') => {
	if (path.indexOf('.') === -1) {
		return object[path]
	} else {
		let paths = path.split('.')
		const singlePath = paths[0]
		paths = paths.slice(1, paths.length)
		if (!object[singlePath]) {
			return null
		}
		return getPropertyByPath(object[singlePath], paths.join('.'))
	}
}

export const padNumber = (num, size) => {
	var s = num + ''
	while (s.length < size) { s = '0' + s }
	return s
}

/**
 * Simulate wait of some operation
 * @public
 * @function
 * @param {number} ms milliseconds
 * @return {Promise}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Remove white spaces from string from the left side
 * @public
 * @function
 * @param {string} s string to parse
 * @param {string} char_mask
 * @return {string}
 */
export const lTrim = (s, char_mask) => {
	const whitespace = ' \t\n\r' + (char_mask || '')

	if (whitespace.indexOf(s.charAt(0)) !== -1) {
		let j = 0, i = s.length
		while (j < i && whitespace.indexOf(s.charAt(j)) !== -1) {
			j++
		}
		s = s.substring(j, i)
	}

	return s
}

/**
 * Remove white spaces from string from the right side
 * @public
 * @function
 * @param {string} s string to parse
 * @param {string} char_mask
 * @return {string}
 */
export const rTrim = (s, char_mask) => {
	const whitespace = ' \t\n\r' + (char_mask || '')

	if (whitespace.indexOf(s.charAt(s.length - 1)) !== -1) {
		let i = s.length - 1
		while (i >= 0 && whitespace.indexOf(s.charAt(i)) !== -1) {
			i--
		}
		s = s.substring(0, i + 1)
	}

	return s
}

/**
 * Remove white spaces from string
 * @public
 * @function
 * @param {string} s string to parse
 * @param {string} char_mask
 * @return {string}
 */
export const trim = (s, char_mask) => rTrim(lTrim(s, char_mask), char_mask)

export const fileSize = (sizeB, unit) => {
	const validUnits = ['B', 'kB', 'MB', 'GB', 'TB']
	const dv = 1024
	const intSize = parseInt(sizeB, 10)
	let unitIndex = 0
	let size = new BigNumber(intSize)
	if (unit) {
		if (validUnits.map(vu => vu.toLowerCase()).indexOf(unit.toLowerCase()) === -1) {
			if (unit.indexOf('i') !== -1 || unit.indexOf('I') !== -1) {
				// eslint-disable-next-line no-console
				console.error('BS "bi-bi-bytes" units (kiB, MiB, GiB, TiB) are not supported!')
			} else {
				// eslint-disable-next-line no-console
				console.error('Invalid file size unit "' + unit + '" provided!')
			}
			return intSize
		}
		if (unit.toLowerCase() === 'kb') {
			size = size.div(dv)
			unitIndex = 1
		} else if (unit.toLowerCase() === 'mb') {
			size = size.div(dv).div(dv)
			unitIndex = 2
		} else if (unit.toLowerCase() === 'gb') {
			size = size.div(dv).div(dv).div(dv)
			unitIndex = 3
		} else if (unit.toLowerCase() === 'tb') {
			size = size.div(dv).div(dv).div(dv).div(dv)
			unitIndex = 4
		} else {
			unitIndex = 0
		}
	} else {
		while (size.toNumber() > dv && unitIndex < validUnits.length - 1) {
			size = size.div(dv)
			unitIndex++
		}
	}
	return size.toFormat(2, BigNumber.ROUND_HALF_CEIL) + ' ' + validUnits[unitIndex]
}

export const compareByKey = (key, a, b) => {
	if (a[key] < b[key]) {
		return -1
	}
	if (a[key] > b[key]) {
		return 1
	}
	return 0
}

export const deepCopy = json => JSON.parse(JSON.stringify(json))

export const isString = val => typeof val === 'string' || val instanceof String

export const ucFirst = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const ucWords = str => str.split(' ').map(word => ucFirst(word)).join(' ')

export const labelize = string => trim(ucWords(string.replace(/[/\-_]/gi, ' ')))

export const getRouteClassName = path => 'route-' + (path === '/' ? getDefaultRoute().path : path).substr(1)

export const getDistance = (position, mylatitude, mylongitude, unit = 'M') => {
	const lat1 = mylatitude.toFixed(8)
	const lon1 = mylongitude.toFixed(8)
	const LatLong = (isDefined(position) ? position : '').split(',')
	const lat2 = parseFloat(LatLong[0]).toFixed(8)
	const lon2 = parseFloat(LatLong[1]).toFixed(8)

	if (lat1 === lat2 && lon1 === lon2) {
		return 0
	}
	else {
		var radlat1 = Math.PI * lat1/180
		var radlat2 = Math.PI * lat2/180
		var theta = lon1-lon2
		var radtheta = Math.PI * theta/180
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
		if (dist > 1) {
			dist = 1
		}
		dist = Math.acos(dist)
		dist = dist * 180/Math.PI
		dist = dist * 60 * 1.1515
		if (unit === 'K') { dist = dist * 1.609344 }
		if (unit === 'N') { dist = dist * 0.8684 }
		return dist
	}
}

export const sortLocations = (locations = [], currentPosition = {}) => {
	let updatedLocations = []
	const { latitude, longitude } = currentPosition

	if (isDefined(currentPosition) && isDefined(latitude) && isDefined(longitude)) {
		updatedLocations = locations.map(i => ({ ...i, distance: getDistance(i.position, latitude, longitude ) }))

		return updatedLocations.sort((a, b) => {
			if (isDefined(a.distance) && isDefined(b.distance)) {
				if (a.distance < b.distance) { return -1 }
				if (a.distance > b.distance) { return 1 }
				return 0
			} else {
				return 0
			}
		})
	} else {
		//If we dont have current position. In that case return array as it is.
		return locations
	}
}

export const validateProfileData = ( profile = {} ) => {
	const { first_name, last_name, birthday, email, email_verified } = profile
	const obj = {
		first_name: true,
		last_name: true,
		birthday: true,
		email: true,
		email_verified: true
	}
	if (first_name && first_name !== '') {
		obj.first_name = true
	}
	if (last_name && last_name !== '') {
		obj.last_name = true
	}

	if (birthday && birthday !== '') {
		obj.birthday = true
	}
	if (email && email !== '') {
		obj.email = true
	}
	if (email_verified === 'True' || email_verified === 'true' || email_verified === 'TRUE' || email_verified === true) {
		obj.email_verified = true
	}

	let isValid = true
	Object.keys(obj).forEach(key => {
		isValid = isValid && obj[key]
	})
	return { ...obj, isValid }
}

export const validateForm = (formConfig, state) => {
	let formErrors = {}
	Object.keys(state).forEach(element => {
		if (formConfig[element]) {
			const type = formConfig[element].type
			const fieldValue = state[element]
			switch (type) {
			case 'select':
				if (!fieldValue) {
					formErrors[element] = 'Select restaurant'
				}
				break
			case 'toggle':
				if (!fieldValue) {
					formErrors[element] = 'Required field'
				}
				break
			case 'first_name':
				if (formConfig[element].required === true && (fieldValue === undefined || fieldValue === '')) {
					formErrors[element] = 'Required field'
				}
				break
			case 'tel': {
				if (isDefined(fieldValue) && formConfig[element].required === true && fieldValue === '') {
					formErrors[element] = 'Required field'
				} else if (/^[0-9]+\.[0-9][0-9]$/.test(fieldValue)) {
					formErrors[element] = 'Invalid mobile number'
				}
				break
			}
			case 'password': // password in case we want some extra rules
				if (formConfig[element].required === true && (fieldValue === undefined || fieldValue === '')) {
					formErrors[element] = 'Required field'
				} else if (formConfig[element].invalidValue === fieldValue) {
					formErrors[element] = 'Invalid value'
				}
				break
			case 'email':
				if (formConfig[element].required === true && (fieldValue === undefined || fieldValue === '')) {
					formErrors[element] = 'Required field'
				} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(fieldValue)) {
					formErrors[element] = 'Invalid email'
				}
				break
			case 'cardNumber': {
				// let value = fieldValue + ''
				// value = value.replace(/\s+/g, '') //remove spaces
				if (formConfig[element].required === true && (fieldValue === undefined || fieldValue === '')) {
					formErrors[element] = 'Required field'
				}
				// else if (value.length !== 16) {
				// 	formErrors[element] = 'Invalid card number'
				// }
				break
			}
			default:
				if (formConfig[element].required === true && (fieldValue === undefined || fieldValue === '')) {
					formErrors[element] = 'Required field'
				}
			}
		}
	})
	return formErrors
}

export const isEmptyObject = obj => {
	for (var key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) { return false }
	}
	return true
}

/**
 * Checks if specified 'value' is array type
 * @public
 * @function
 * @param {array|object|number|string} value value for check
 * @return {boolean}
 */
export const isArray = value => value && typeof value === 'object' && value.constructor === Array

/**
 * Checks if specified 'value' is object type
 * @public
 * @function
 * @param {array|object|number|string} value value for check
 * @return {boolean}
 */
export const isObject = value => value && typeof value === 'object' && value.constructor === Object

export const sprintf = function() {
	const replacer = '%s'
	let args = Object.values(arguments)
	const formatted = args.shift()
	if (formatted.indexOf(replacer) === -1) {
		return formatted
	}
	let replaced = formatted
	args.forEach((arg) => {
		replaced = replaced.replace(replacer, arg)
	})
	return replaced
}

export const makeKey = (...args) => (args || []).join('_')

export const mergeConfigs = (configFromApi, appConfigObj) => {
	let merged = deepCopy(appConfigObj)
	const configKeys = Object.keys(merged)
	Object.keys(configFromApi).forEach(key => {
		const value = configFromApi[key]
		if (isObject(value)) {
			if (!isDefined(merged[key])) {
				merged[key] = {}
			}
			merged[key] = mergeConfigs(value, merged[key])
		} else {
			// prevent to apiConfig override confing form front-end project
			const keyExistInAppConfig = (configKeys || []).find(i => i === key)
			if (!isDefined(keyExistInAppConfig) && !isDefined(appConfigObj[key])) {
				merged[key] = value
			}
		}
	})
	return merged
}


export const parseTranslationsToCsv = () => {
	const json = {
		'Welcome Back': {
			'fr': 'Bienvenue à nouveau',
			'en': 'Welcome Back'
		},
		'Click & Collect': {
			'fr': 'Cliquez et collectez',
			'en': 'Click & Collect'
		},
		'After completing your order you will be able to collect from the location in': {
			'fr': 'Après avoir terminé votre commande, vous pourrez récupérer à partir de l\'emplacement dans',
			'en': 'After completing your order you will be able to collect from the location in'
		}
	}

	let csvContent = 'data:text/csv;charset=utf-8,'
	Object.keys(json).forEach(key => {
		csvContent += '"' + key+'", "'+json[key].fr+'"\n'
	})

	var encodedUri = encodeURI(csvContent)
	var link = document.createElement('a')
	link.setAttribute('href', encodedUri)
	link.setAttribute('download', 'my_data.csv')
	document.body.appendChild(link)

	link.click()
	return csvContent
}

export const getLocale = profile => {
	let locale = getConfig().localization.defaultLocale
	if (profile && profile.locale) {
		locale = profile.locale
	}
	return locale
}

export const isWebConfig = () => {
	// return getConfig().general.isWebPlatform
	return !isMobileOnly
}

export const getSingleDeliveryOption = () => {
	const { delivery } = getConfig()
	return delivery ? delivery.length === 1 ? delivery[0] : null : { id: 'collection', label: 'Click & Collect' }
}

export const forwardToDeliveryOption = () => {
	const delivery = getSingleDeliveryOption()
	if (!delivery) {
		forwardTo('/delivery-options')
	} else {
		forwardTo(delivery.route)
	}
}

export const checkForDeliveryOption = (deliveryOption, currentRoute) => {
	deliveryOption = deliveryOption || getSingleDeliveryOption()

	if (!deliveryOption) {
		forwardTo('/delivery-options')
		return
	} else if (deliveryOption.route !== currentRoute) {
		forwardTo(deliveryOption.route)
		return
	}
	return deliveryOption
}


export const cutoffTime = (deliveryTime, slots) => {
	let day = moment(deliveryTime).format('dddd')
	let hour = moment(deliveryTime).format('HH:mm')
	let deliveryTimeFormated = moment(deliveryTime)
	let slot = null
	Object.keys(slots).map((key) => {
		if (key === day) {
			slot = slots[key]
		}
	})
	if (slot) {
		let slotRes = slot.find(s => moment(s.start_time, 'HH:mm').format('HH:mm') === moment(hour, 'HH:mm').format('HH:mm') ? s : null)
		let cutoffTime = moment(deliveryTimeFormated).subtract(slotRes.prep_time, 'h').unix()
		return cutoffTime
	}
	return null
}

export const parseAllergenData = (profile, item, allergens) => {
	// profile, item, allergens
	let locale = getLocale(profile)
	if (locale === 'fr') {
		locale = 'fr_FR'
	}
	let allergensCodes = item ? item.itemRichData ? (item.itemRichData.allergenCodes && item.itemRichData.allergenCodes.length) > 0 ? item.itemRichData.allergenCodes : [] : [] : []
	let newArr = []
	allergensCodes.map((allergenCode) => {
		let dataArr = (allergens && allergens.data ? allergens.data : []).find((allergen) => {
			let dataArr2 = null
			if (allergen.code === allergenCode) {
				dataArr2 = allergen.translations.find((data) => {
					if (data.locale === locale) {
						newArr.push(data.text)
						return data
					}
					return null
				})
			}
			return dataArr2
		})
		if (!dataArr) {
			newArr.push(allergenCode)
		}
		return null
	})

	return newArr
}

export const checkIdenticalArrays = (arr1, arr2) => {
	if (arr1.length !== arr2.length) {
		return false
	}
	for (let i = arr1.length; i--;) {
		if (arr1[i] !== arr2[i]) {
			return false
		}
	}
	return true
}
