import React, { Component } from 'react'
import { connect } from 'react-redux'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
// import { Title } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { getLocale } from '../../lib/utils'
import { getAllergensInfo } from '../../store/actions'
import NoData from '../../components/noData'
import './index.css'

class AllergensInfo extends Component {
	componentDidMount() {
		this.props.dispatch(getAllergensInfo())
	}

	render() {
		const { __, allergensInfo, profile } = this.props
		return (
			<Loading>
				<Layout color="white" headerTitle={ __('Allergens Info')}>
					<div>
						{/* <Title>{ __('Allergens Info')}</Title> */}
						{ allergensInfo ?
							allergensInfo.map((allergen, index) => {
								let label = allergen.code
								const translation = allergen.translations.find(t => t.locale.indexOf(getLocale(profile)) !== -1)
								if (translation) {
									label = translation.text
								}
								return <div key={index + label}>{label}</div>
							})
							: <NoData/> }
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	return {
		allergensInfo: state.common.allergensInfo || null,
		profile: state.profile.profile
	}
}

export default connect(stateToProps)(withTranslation(AllergensInfo))
