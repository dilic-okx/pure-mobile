import React, { Component } from 'react'
import BigNumber from '../../lib/bignumber'
import { IonRow, IonCol } from '@ionic/react'
import Basket from '../../lib/basket'
import { SmallText } from '../common'
import { withTranslation } from '../../lib/translate'
import { isDefined } from '../../lib/utils'

class AmountPaid extends Component {
	render() {
		const { __, order, cards } = this.props
		let amount_paid = isDefined(order.amount_paid) ? order.amount_paid : 0
		if (amount_paid > 0) {
			// amount_paid were represents payed amount in cents
			amount_paid = new BigNumber(amount_paid).div(100).toNumber()
		}

		let label = __('Paid')
		if (order.payment_token && cards && cards.length > 0) {
			const card = cards.find(c => c.id === order.payment_token)
			if (card) {
				const { brand, last4 } = card
				label = brand + ' ' + __('card ending') + ' **** ' + last4
			}
		}
		return (
			<>
				<IonRow className="no-border">
					<IonCol className="paddLR">
						<SmallText color="gray">{ label }</SmallText>
					</IonCol>
					<IonCol className="righted paddLR">{ Basket.formatPrice(amount_paid, true) }</IonCol>
				</IonRow>
				{ order && order.process_message ? <IonRow className="ion-color-danger">
					<IonCol className="paddLR ion-color-danger">
						<SmallText color="red">*** { __(order.process_message) } ***</SmallText>
					</IonCol>
				</IonRow> : null }
			</>
		)
	}
}

export default withTranslation(AmountPaid)
