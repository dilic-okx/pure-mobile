import React from 'react'
import { IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent } from '@ionic/react'
import { withTranslation } from '../../lib/translate'
// import moment from '../../lib/moment'
import { withRouter } from 'react-router'
import { SmallText } from '../../components/common'
import Basket from '../../lib/basket'
import NoData from '../../components/noData'
import { getConfig } from '../../appConfig'

const { delivery } = getConfig()

const doRefresh = (event, getTransactionHistory) => {
	setTimeout(() => {
		event.detail.complete()
		getTransactionHistory()
	}, 1000)
}

const HistoryTab = withRouter(({ __, transactionHistory, getTransactionHistory, history, ...rest }) => {
	const type = rest.type || 'order'

	const handleRowClick = item => {
		if (type === 'order') {
			history.push('./history-details', { order: item })
		} else {
			// history.push('./history-details')
		}
	}

	return (
		<>
			<IonRefresher slot="fixed" onIonRefresh={ e => doRefresh(e, getTransactionHistory) }>
				<IonRefresherContent></IonRefresherContent>
			</IonRefresher>
			<div className={`history-content ${type !== '' ? `${type}-tab` : ''}`}>
				{ (transactionHistory || [] ).length === 0 ?
					<NoData />
					:
					<IonGrid>
						{
							transactionHistory.map((i, index) => {
								const { stamp_power, transaction_date, label, item, location_name } = i
								const transDate = Basket.getDate(transaction_date)
								let orderLabel = Basket.getOrderType(i.item)
								let option = (delivery || []).find(d => d.id === orderLabel)
								let orderId = i && i.item ? ' #' + i.item.id : ''
								let locationName = location_name && location_name !== '' ? location_name : i && i.item ? i.item.restaurant_name : ''
								return (
									<IonRow onClick={ () => handleRowClick(item) } key={ index } className="history-item">
										<IonCol>
											<SmallText className="ellipsis">{ transDate.format('ddd DD MMMM YYYY ') + __('at') + transDate.format(' h:mm a')}</SmallText>
											<h2 className='uppercase'>{ type=== 'order' ? option ? option.label + orderId : '' : __(label)}</h2>
											<SmallText>{ locationName }</SmallText>
										</IonCol>
										{ type === 'order' ?
											<IonCol style={{ alignSelf: 'center' }} className="order-button-col-width">
												<div className="order-button-wrapper">
													<div className="order-button bordered uppercase">
														{ __(item && item.status ? item.status : '') }
													</div>
												</div>
											</IonCol>
											:
											<IonCol style={{ alignSelf: 'center' }}>
												<p className={ stamp_power < 0 ? 'redeem' : '' }><strong>{ stamp_power < 0 ? '' : '+' }{ stamp_power } { __('points') }</strong></p>
											</IonCol>
										}
									</IonRow>
								)
							})
						}
					</IonGrid>
				}
			</div>
		</>
	)
})

export default withTranslation(HistoryTab)
