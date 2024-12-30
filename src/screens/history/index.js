import React from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import Layout from '../../components/layout'
import SwipableTabs from '../../components/swipeableTabs'
import { Title } from '../../components/common'
import HistoryTab from './historyTab'
import { withTranslation } from '../../lib/translate'
import { getTransactionHistory } from '../../store/actions'
import { getConfig } from '../../appConfig'

import './index.css'

const tabLabelMap = {
	ordering: {
		first: 'Loyalty',
		second: 'Orders'
	},
	catalog: {
		first: 'Accrue',
		second: 'Redeem'
	}
}

class History extends React.Component {
	constructor(props) {
		super(props)
		this.state = {}
	}

	componentDidMount() {
		this.getTransactionHistory()
	}

	getTransactionHistory = () => {
		this.props.dispatch(getTransactionHistory())
	}

	getNameOfLabelFirstTab = () => {
		const { hasOrdering } = getConfig().appType
		const { __, transactionHistory } = this.props

		const firstTabListAdditional = transactionHistory.map(item => ({ ...item, label: (item.business_location_id + '') === '-1' ? __('Referral Bonus') : (item.business_location_id + '') === '-2' ? __('Sign up Bonus') : (item.business_location_id + '') === '-3' ? __('Points Refunded') :
			hasOrdering ?
				item.stamp_power < 0 ? __('Redeemed') : __('Earned') :
				transactionHistory.filter(i => i.stamp_power >= 0).map(item => ({ ...item, label: 'Earned' })) }))

		return firstTabListAdditional
	}

	render() {
		const { __, transactionHistory, orderHistory } = this.props
		const { hasOrdering, hasLoyalty } = getConfig().appType
		const tabLabels = hasOrdering ? tabLabelMap.ordering : tabLabelMap.catalog

		// const firstTabList = hasOrdering ?
		// 	transactionHistory.map(item => ({ ...item, label: __('Points ' + (item.stamp_power < 0 ? 'Redeemed' : 'Earned'))})) :
		// 	transactionHistory.filter(i => i.stamp_power >= 0).map(item => ({ ...item, label: 'Points Earned' }))
		const secondTabList = hasOrdering ?
			orderHistory.map(i => ({ label: i.restaurant_name + ' #' + i.id, transaction_date: i.collection_time, item: i })) :
			transactionHistory.filter(i => i.stamp_power < 0).map(item => ({ ...item, label: 'Points Redeemed' }))

		const firstTabType = 'points'
		const secondTabType = hasOrdering ? 'order' : 'points'

		return (
			<Layout headerTitle={ __('History')} noPadding={ true } color="white" scrollY={ false }>
				<div className="web-only padded-top padded-left">
					<Title>{ __('Account History')}</Title>
				</div>
				{hasLoyalty && hasOrdering ?
					<SwipableTabs
						history={ this.props.location }
						tabs={[
							{ label: __(tabLabels.first), tabContent: <HistoryTab type={ firstTabType } transactionHistory={ this.getNameOfLabelFirstTab() } getTransactionHistory={ this.getTransactionHistory } /> },
							{ label: __(tabLabels.second), tabContent: <HistoryTab type={ secondTabType } transactionHistory={ secondTabList } getTransactionHistory={ this.getTransactionHistory } /> }
						]}
					/> :
					hasLoyalty ?
						<HistoryTab type={ firstTabType } transactionHistory={ this.getNameOfLabelFirstTab() } getTransactionHistory={ this.getTransactionHistory } /> :
						hasOrdering ?
							<HistoryTab type={ secondTabType } transactionHistory={ secondTabList } getTransactionHistory={ this.getTransactionHistory } />
							: null
				}
			</Layout>
		)
	}
}

const stateToProps = state => {
	return {
		transactionHistory: state.orders.history || [],
		orderHistory: state.orders.orderHistory || []
	}
}

export default withRouter(withTranslation(connect(stateToProps)(History)))
