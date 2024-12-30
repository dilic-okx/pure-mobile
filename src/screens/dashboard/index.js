import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonList, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react'
import Layout from '../../components/layout'
import { withTranslation } from '../../lib/translate'
import './index.css'
import { isDefined, isEmptyObject, forwardTo, getSingleDeliveryOption } from '../../lib/utils'

import { getConfig } from '../../appConfig'

const { hasOrdering } = getConfig().appType

class Dashboard extends Component {
	constructor(props) {
		super(props)
		this.state = {
			singleDelivery: getSingleDeliveryOption(),
			showAlert: false
		}
	}

	render() {
		const { __, screenName } = this.props
		const { singleDelivery } = this.state
		return (
			<Layout hideSecondToolbar={ true } color="transparent" noPadding={ true }>
				<div className="absolute-content dash-layout"></div>
				<IonCard className="dash-card">
					<IonCardHeader className="ion-text-center">
						<IonLabel color="dark">{ __('Welcome Back')}</IonLabel>
						<IonCardTitle>{ screenName }</IonCardTitle>
					</IonCardHeader>

					<IonCardContent className="dash-menu">
						<IonList>
							{ hasOrdering ?
								singleDelivery ?
									<IonItem className="clickable" onClick={() => forwardTo('/click-and-collect')}>
										<IonLabel>{ __(singleDelivery.label)}</IonLabel>
									</IonItem> :
									<IonItem className="clickable" onClick={() => forwardTo('/delivery-options')}>
										<IonLabel>{ __('Start New Order')}</IonLabel>
									</IonItem> : null
							}
							<IonItem className="clickable" onClick={ () => forwardTo('/loyalty') }>
								<IonLabel>{ __('Loyalty') }</IonLabel>
							</IonItem>
							<IonItem lines="none" className="clickable" onClick={ () => forwardTo('/account') }>
								<IonLabel>{ __('My Account') }</IonLabel>
							</IonItem>
						</IonList>
					</IonCardContent>
				</IonCard>
			</Layout>
		)
	}
}

const stateToProps = state => {
	const { profile } = state.profile
	let screenName = ''
	if (isDefined(profile) && !isEmptyObject(profile) && profile.first_name) {
		screenName = profile.first_name
	}
	return {
		screenName
	}
}

export default connect(stateToProps)(withTranslation(Dashboard))
