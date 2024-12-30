import React, { Component } from 'react'
import { connect } from 'react-redux'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
// import { Title } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { getPrivacyPolicy } from '../../store/actions'
import NoData from '../../components/noData'

import './index.css'

class Privacy extends Component {
	componentDidMount() {
		this.props.dispatch(getPrivacyPolicy())
	}

	render() {
		const { __, privacyPolicy } = this.props
		return (
			<Loading>
				<Layout headerTitle={ __('Privacy Policy')}>
					<div>
						{/* <Title>{ __('Privacy Policy')}</Title> */}
						{ privacyPolicy ? <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} /> : <NoData/> }
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	return {
		privacyPolicy: state.common.privacyPolicy || null
	}
}

export default connect(stateToProps)(withTranslation(Privacy))
