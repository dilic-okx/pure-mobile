import React from 'react'
import { connect } from 'react-redux'
import { IonList, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react'
import Layout from '../../components/layout'
import { NormalText } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { setDeliveryOption, clearBasketWarning } from '../../store/actions'
import { forwardTo, getSingleDeliveryOption } from '../../lib/utils'
import { getConfig } from '../../appConfig'
import api from '../../lib/api'
import './index.css'

const { delivery } = getConfig()

class DeliveryOptions extends React.Component {
	setDeliveryOption = (delivery) => {
		this.props.dispatch(setDeliveryOption(delivery))
		forwardTo(delivery.id === 'delivery' ? '/delivery' : delivery.id === 'pick-up-point' ? '/pick-up-point' : '/click-and-collect')
	}

	checkForSingleDeliveryOption = () => {
		const singleDeliveryOption = getSingleDeliveryOption()
		if (singleDeliveryOption) {
			this.setDeliveryOption(singleDeliveryOption)
		}
	}

	componentDidMount () {
		const { defaultMenuId } = this.props
		this.props.dispatch(clearBasketWarning())
		// Basket.reset()
		this.checkForSingleDeliveryOption()
		api.getDefaultMenu(defaultMenuId).then(res => {
			this.props.dispatch({ type: 'SET_RESTAURANT_PROP', key: 'defaultMenu', value: res })
		})
	}

	componentDidUpdate () {
		this.checkForSingleDeliveryOption()
	}

	render () {
		const { __ } = this.props
		return (
			<Layout hideSecondToolbar={ true } color="transparent" noPadding={ true }>
				<IonCard className="delivery-options-card">
					<IonCardHeader className="ion-text-center">
						<IonCardTitle>{ __('Start New Order')}</IonCardTitle>
						<NormalText color="dark">{ __('Select an order type to get started')}</NormalText>
					</IonCardHeader>

					<IonCardContent className="delivery-options-menu">
						<IonList lines="none">
							{ delivery.map(((d, index) => (
								<IonItem key={ 'delivery-option-' + index } color="primary" onClick={() => this.setDeliveryOption(d)}>
									<IonLabel>{ d.label }</IonLabel>
								</IonItem>
							)))}
						</IonList>
					</IonCardContent>
				</IonCard>
			</Layout>
		)
	}
}

const stateToProps = (state) => ({
	deliveryOption: state.orders.deliveryOption,
	defaultMenuId: state.common.defaultMenuId
})

export default connect(stateToProps)(withTranslation(DeliveryOptions))
