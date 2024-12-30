import asyncStorage from './asyncStorage'
import moment from 'moment'
import { getConfig } from '../appConfig'

import 'moment/locale/en-gb'
/*import 'moment/locale/de'
import 'moment/locale/fr'
import 'moment/locale/de'
import 'moment/locale/it'
import 'moment/locale/sr'
import 'moment/locale/es'*/

moment.locale('en-gb')
export const applayLocale = async () => {
	const localeMap = {
		en: 'en-gb',
		fr: 'fr'
	}

	const config = getConfig()
	const localization = config.localization && config.localization.defaultLocale ? config.localization.defaultLocale : 'en'
	moment.locale(localeMap[localization ])
	const profile = JSON.parse(await asyncStorage.getItem('profile'))
	const locale = profile && profile.locale ? profile.locale : localization
	moment.locale(localeMap[locale])
	if (locale === 'en') {
		moment.updateLocale('en-gb', {
			longDateFormat: {
				LT: 'h:mm a'
				// LTS: "h:mm:ss A",
				// L: "MM/DD/YYYY",
				// l: "M/D/YYYY",
				// LL: "MMMM Do YYYY",
				// ll: "MMM D YYYY",
				// LLL: "MMMM Do YYYY LT",
				// lll: "MMM D YYYY LT",
				// LLLL: "dddd, MMMM Do YYYY LT",
				// llll: "ddd, MMM D YYYY LT"
			}
		})
	}
}

applayLocale()

export default moment
