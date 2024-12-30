import React, { Component } from 'react'
import { connect } from 'react-redux'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
// import { Title } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { getFaq } from '../../store/actions'
import NoData from '../../components/noData'

import './index.css'

class Faq extends Component {
	componentDidMount() {
		this.props.dispatch(getFaq())
	}

	render() {
		const { __, faq } = this.props
		return (
			<Loading>
				<Layout headerTitle={ __('Faq & Support') }>
					<div>
						{/* <Title>{ __('Faq & Support') }</Title> */}
						{ faq ? <div dangerouslySetInnerHTML={{ __html: faq }} /> : <NoData/> }
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	return {
		faq: state.common.faq || null
	}
}

export default connect(stateToProps)(withTranslation(Faq))
