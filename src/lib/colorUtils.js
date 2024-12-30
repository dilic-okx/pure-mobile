import * as utils from './utils'

const { parseDecimal } = utils

export const validHex = (hex) => {
	return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex)
}

export const validOpacity = (opacity) => {
	return opacity >= 0 && opacity <= 1
}

export const trimHex = (hex) => {
	hex = utils.lTrim(hex, '#')
	if (!validHex('#' + hex)) {
		throw new Error('Invalid hex code')
	}
	return hex
}

export const parseOpacity = (opacity) => {
	opacity = parseFloat(opacity)
	if (!validOpacity(opacity)) {
		throw new Error('Invalid opacity')
	}
	return opacity
}

export const getBrightness = (color, format) => {
	format = format || 'hex'
	const rgb = format === 'hex' ? hexToRGB(color, false) : color

	return parseDecimal((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000)
}

export const getLuminance = (color, format) => {
	format = format || 'hex'
	const rgb = format === 'hex' ? hexToRGB(color, false) : color

	let RsRGB, GsRGB, BsRGB, R, G, B
	RsRGB = rgb[0] /255
	GsRGB = rgb[1] /255
	BsRGB = rgb[2] /255

	if (RsRGB <= 0.03928) {
		R = RsRGB /12.92
	} else {
		R = Math.pow((RsRGB + 0.055) / 1.055, 2.4)
	}
	if (GsRGB <= 0.03928) {
		G = GsRGB / 12.92
	} else {
		G = Math.pow((GsRGB + 0.055) / 1.055, 2.4)
	}
	if (BsRGB <= 0.03928) {
		B = BsRGB / 12.92
	} else {
		B = Math.pow((BsRGB + 0.055) / 1.055, 2.4)
	}

	return parseDecimal(0.2126 * R + 0.7152 * G + 0.0722 * B, 4)
}

export const isDark = (color, format) => {
	return getBrightness(color, format) < 128
}

export const isLight = (color, format) => {
	return !isDark(color, format)
}

export const hexToRGB = (hex, asString) => {
	asString = asString !== undefined ? asString : true
	hex = trimHex(hex)
	let rString, gString, bString
	if (hex.length === 3) {
		rString = hex.charAt(0) + hex.charAt(0)
		gString = hex.charAt(1) + hex.charAt(1)
		bString = hex.charAt(2) + hex.charAt(2)
	} else {
		rString = hex.slice(0, 2)
		gString = hex.slice(2, 4)
		bString = hex.slice(4, 6)
	}
	const r = parseInt(rString, 16)
	const g = parseInt(gString, 16)
	const b = parseInt(bString, 16)
	return asString ? 'rgb(' + r + ',' + g + ',' + b + ')' : [r, g, b]
}

export const hexToRGBA = (hex, opacity, asString) => {
	asString = asString ? asString : true
	hex = trimHex(hex)
	opacity = parseOpacity(opacity)
	const rgb = hexToRGB(hex, false)
	return asString ? 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + opacity + ')' : [...rgb, opacity]
}

export const rgbToHEX = (rgb, skipHash) => {
	skipHash = skipHash !== undefined ? skipHash : false
	const rHEX = rgb[0].toString(16)
	const gHEX = rgb[1].toString(16)
	const bHEX = rgb[2].toString(16)

	return (skipHash ? '' : '#') + rHEX + gHEX + bHEX
}

// 4th argument depends on 3rd: if 3rd is hex (default), 4th is 'skipHash' (default false); if 3rd is rgb, 4th is 'asString'
export const lighterColor = (color, factor, format, skipHash_asString) => {
	factor = factor || 30
	format = format || 'hex'
	skipHash_asString = skipHash_asString !== undefined ? skipHash_asString : false
	const rgb = format === 'hex' ? hexToRGB(color, false) : color
	let newHEX = ''
	rgb.forEach((component) => {
		let componentHEX = (component + Math.round((255 - component) / 100 * factor)).toString(16)
		if (componentHEX.length < 2) {
			componentHEX = '0' + componentHEX
		}
		newHEX += componentHEX
	})

	return format === 'hex' ? (skipHash_asString ? '' : '#') + newHEX : hexToRGB(newHEX, skipHash_asString)
}

export const darkerColor = (color, factor, format, skipHash_asString) => {
	factor = factor || 30
	format = format || 'hex'
	skipHash_asString = skipHash_asString !== undefined ? skipHash_asString : false
	const rgb = format === 'hex' ? hexToRGB(color, false) : color
	let newHEX = ''

	rgb.forEach((component) => {
		let dec = component - Math.round((255 - component) / 100 * factor)
		if (dec > 255) {
			dec = 255
		} else if (dec < 0) {
			dec = 0
		}
		let componentHEX = dec.toString(16)
		if (componentHEX.length < 2) {
			componentHEX = '0' + componentHEX
		}
		newHEX += componentHEX
	})

	return format === 'hex' ? (skipHash_asString ? '' : '#') + newHEX : hexToRGB(newHEX, skipHash_asString)
}

export const triad = (color, format, skipHash_asString) => {
	format = format || 'hex'
	skipHash_asString = skipHash_asString !== undefined ? skipHash_asString : false
	const rgb = format === 'hex' ? hexToRGB(color, false) : color

	const rgbFirst = [rgb[1], rgb[2], rgb[0]]
	const rgbSecond = [rgb[2], rgb[0], rgb[1]]

	return format === 'hex' ? [rgbToHEX(rgbFirst, skipHash_asString), rgbToHEX(rgbSecond, skipHash_asString)] : skipHash_asString ? ['rgb(' + rgbFirst[0] + ',' + rgbFirst[1] + ',' + rgbFirst[2] + ')', 'rgb(' + rgbSecond[0] + ',' + rgbSecond[1] + ',' + rgbSecond[2] + ')'] : [rgbFirst, rgbSecond]
}

export const rgbToHSL = (rgb) => {
	const r = rgb[0] / 255.0
	const g = rgb[1] / 255.0
	const b = rgb[2] / 255.0

	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	let h, s, l = (max + min) / 2.0
	if (max === min) {
		h = s = 0
	} else {
		const d = max - min
		s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min)

		if (max === r && g >= b) {
			h = 1.0472 * (g - b) / d
		} else if (max === r && g < b) {
			h = 1.0472 * (g - b) / d + 6.2832
		} else if (max === g) {
			h = 1.0472 * (b - r) / d + 2.0944
		} else if (max === b) {
			h = 1.0472 * (r - g) / d + 4.1888
		}
	}
	h = h / 6.2832 * 360.0 + 0

	return [h, s, l]
}

export const hueToRGB = (p, q, t) => {
	if (t < 0) {
		t += 1
	}
	if (t > 1) {
		t -= 1
	}
	if (t < 1/6) {
		return p + (q - p) * 6 * t
	}
	if (t < 1/2) {
		return q
	}
	if (t < 2/3) {
		return p + (q - p) * (2/3 - t) * 6
	}
	return p
}

export const rgbToCMYK = (color, format) => {
	format = format || 'hex'
	const rgb = format === 'hex' ? hexToRGB(color, false) : color

	let cyan = 255 - rgb[0]
	let magenta = 255 - rgb[1]
	let yellow = 255 - rgb[2]
	const key = Math.min(cyan, magenta, yellow)

	cyan = (cyan - key) / (255 - key) * 255
	magenta = (magenta - key) / (255 - key) * 255
	yellow = (yellow - key) / (255 - key) * 255

	return {
		'c': parseDecimal(cyan / 255 * 100),
		'm': parseDecimal(magenta / 255 * 100),
		'y': parseDecimal(yellow / 255 * 100),
		'k': parseDecimal(key / 255 * 100)
	}
}

export const complementary = (color, format, skipHash_asString) => {
	format = format || 'hex'
	skipHash_asString = skipHash_asString !== undefined ? skipHash_asString : false
	const rgb = format === 'hex' ? hexToRGB(color, false) : color
	const hsl = rgbToHSL(rgb)
	let h = hsl[0]
	let s = hsl[1]
	let l = hsl[2]

	h += 180
	if (h > 360) {
		h -= 360
	}
	h /= 360

	let r, g, b
	if (s === 0) {
		r = g = b = l
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s
		const p = 2 * l - q

		r = hueToRGB(p, q, h + 1/3)
		g = hueToRGB(p, q, h)
		b = hueToRGB(p, q, h - 1/3)
	}

	r = Math.round(r * 255)
	g = Math.round(g * 255)
	b = Math.round(b * 255)

	return format === 'hex' ? rgbToHEX([r, g, b], skipHash_asString) : skipHash_asString ? 'rgb(' + r + ',' + g + ',' + b + ')' : [r, g, b]
}
