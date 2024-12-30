import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import Scan from './scan'
import Points from './points'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { getRewards } from '../../store/actions'
import { withTranslation } from '../../lib/translate'
import './index.css'
import SwipableTabs from '../../components/swipeableTabs'

class Loyalty extends React.Component {
	constructor(props) {
		super(props)
		this.state = { page: null }
	}

	componentDidMount() {
		this.props.dispatch(getRewards())
		if (this.props.location && this.props.location.state && this.props.location.state.tab) {
			this.setState({ page: this.props.location.state.tab })
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.location && this.props.location.state && this.props.location.state.tab &&
		prevProps.location && prevProps.location.state && prevProps.location.state.tab &&
		prevProps.location.state.tab !== this.props.location.state.tab
		) {
			this.setState({ page: this.props.location.state.tab })
		}
	}

	render() {
		const { __, rewards, profile } = this.props

		return (
			<Loading>
				<Layout headerTitle={ __('Loyalty')} noPadding={ true } scrollY={ false }>
					<SwipableTabs
						tabs={[
							{ label: __('Points'), tabContent: <Points rewards={ rewards } available_balance= { profile.available_balance }/>, canScroll: false },
							{ label: __('Scan'), tabContent: <Scan profile={ profile } qr_code = { profile.qr_code } /> }
						]}
						defaultTab = { this.state.page === 'scan' ? 1 : 0 }
						available_balance = { profile.available_balance }
						displayFooterTab = { 1 }
						displayFooter = 'balance'
						history={ this.props.location }
					/>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { profile } = state.profile
	const { rewards } = state.restaurants
	return {
		profile,
		rewards: rewards || []
	}
}

export default connect(stateToProps)(withRouter(withTranslation(Loyalty)))
