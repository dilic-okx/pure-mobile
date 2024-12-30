import React, { Component } from 'react'
import { connect } from 'react-redux'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
// import { Title } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { getTermsAndConditions } from '../../store/actions'
import NoData from '../../components/noData'

import './index.css'

class Terms extends Component {
	componentDidMount() {
		this.props.dispatch(getTermsAndConditions())
	}

	render() {
		const { __, terms } = this.props
		return (
			<Loading>
				<Layout color="white" headerTitle={ __('Terms & Conditions')}>
					<div>
						{/* <Title>{ __('Terms & Conditions')}</Title> */}
						{ terms ? <div dangerouslySetInnerHTML={{ __html: terms }} /> : <NoData/> }
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	return {
		terms: state.common.terms || null
	}
}

export default connect(stateToProps)(withTranslation(Terms))
