import React from 'react'
import { connect } from 'react-redux'
import { getConfig } from '../appConfig'
import { getCatalog } from '../translationCatalogWrapper'

export const translate = (key, lang = null) => {
	const catalog = getCatalog()
	return lang && catalog[key] && catalog[key][lang] ? catalog[key][lang] : key
}

const getUserLang = user => {
	const config = getConfig()
	return user && user.locale ? user.locale : config.localization && config.localization.defaultLocale ? config.localization.defaultLocale : 'en'
}

export const withTranslation = WrappedComponent => {
	class Translated extends React.Component {
		constructor(props) {
			super(props)
			this.__ = this.__.bind(this)
		}
		__(key) {
			const { lang } = this.props
			return translate(key, lang)
		}
		render() {
			return <WrappedComponent __={ this.__ } { ...this.props }/>
		}
	}

	const stateToProps = state => {
		const { profile } = state.profile
		return {
			lang: getUserLang(profile)
		}
	}

	return connect(stateToProps)(Translated)
}
