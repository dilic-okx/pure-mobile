import React from 'react'
import { IonList, IonItem, IonRadioGroup, IonRadio, IonLabel, IonNote, IonButton, isPlatform } from '@ionic/react'
import Loading from '../../components/spinner'
import Layout from '../../components/layout'
import { withTranslation } from '../../lib/translate'
import { Title, SmallText, Spacer, Sectiontitle } from '../../components/common'
import { connect } from 'react-redux'
import Basket from '../../lib/basket'
import { forwardTo, goBack } from '../../lib/utils'
import { Capacitor } from '@capacitor/core'
import Stripe from '../../lib/stripe'
import './index.css'

const { getMobile, setMobile } = Basket

class Checkout extends React.Component {

	constructor(props) {
		super(props)
		if (!getMobile() && this.props.profile && this.props.profile.mobile) {
			setMobile(this.props.profile.mobile)
		}
		this.state = {
			selectedCard: null
		}
	}

	componentDidMount() {
		const { profile } = this.props
		if (profile.cardToken) {
			this.changeSelectedPaymentCard(profile.cardToken)
		} else {
			forwardTo('/card-add')
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.profile.cardToken !== this.props.profile.cardToken) {
			this.changeSelectedPaymentCard(this.props.profile.cardToken)
		}
	}


	drawPayButton = () => {
		const { __ } = this.props
		let ret = null
		if (Stripe.getStripeInstance() && Capacitor.platform !== 'web') {
			if (!isPlatform('ios')) {
				//android
				ret = <IonButton expand="block" color="primary" onClick={ () => Basket.createOrder('google') }>{ __('Google Pay') }</IonButton>
			} else {
				//ios
				ret = <IonButton className='apple-button' onClick={ () => Basket.createOrder('apple')} expand="block" color="black">
					<div className="apple-pay-button apple-pay-button-black">
						<span classNeme="logo"></span>
					</div>
				</IonButton>
			}
		}
		return ret
	}

	changeSelectedPaymentCard = cardId => this.setState({ selectedCard: cardId }, () => {
		Basket.changeSelectedCard(cardId)
	})

	backHandler = () => {
		if (this.props.location && this.props.location.state && this.props.location.state.skipContactDetails) {
			forwardTo('/order-summary', { skipBackToThePreviousPage: true })
		} else if (this.props.location.pathname === '/checkout' ) {
			forwardTo('/order')
		} else {
			goBack()
		}
	}

	render () {
		const { __, cards } = this.props

		return (
			<Loading transparent>
				<Layout color="white" headerTitle={ __('Checkout') } backHandler={this.backHandler}>
					<div className="flex-row-wrapper absolute-content">
						<Title>{ __('Checkout') }</Title>
						<SmallText>{ __('Use saved payment card') }</SmallText>
						<Spacer size={ 1 }/>
						<div className="scrollable-y">
							<IonList lines="full">
								<IonRadioGroup onIonChange={ e => this.changeSelectedPaymentCard(e.detail.value) } value={ this.state.selectedCard }>
									{cards.map(card => {
										const { id, last4, brand, exp_month, exp_year, name } = card

										return (
											<IonItem key={ id }>
												<IonLabel className="ion-text-wrap">
													<Sectiontitle className="single-item">{ name }</Sectiontitle>
													<Sectiontitle className="no-margin">**** **** **** { last4 }</Sectiontitle>
													<IonNote>{ __(brand) } - { exp_month }/{ exp_year }</IonNote>
												</IonLabel>
												<IonRadio
													slot="start"
													value={ id }
													onIonSelect={() => {
														this.setState({ selectedCard: id }, () => {
															Basket.changeSelectedCard(id)
														})
													}}
												/>
											</IonItem>
										)
									})}
								</IonRadioGroup>
							</IonList>
							<IonButton fill="clear" color="dark" className="link underlined" onClick={ () => forwardTo('/card-add', { addCardFromCheckout: true }) }>{ __((cards.length > 0 ? 'Or add another' : 'Add ') + ' payment card') }</IonButton>
						</div>
						<div className="flex-min">
							<IonButton disabled={ cards.length === 0 } onClick={ () => Basket.createOrder() } expand="block">{ __('Pay') }</IonButton>
							{/* { this.drawPayButton() } */}
							<div className="centered"><IonButton color="gray" fill="clear" className="link" onClick={ this.backHandler }>{ __('Cancel') }</IonButton></div>
						</div>
					</div>
				</Layout>
			</Loading>
		)
	}
}

const mapStateToProps = store => {
	return {
		cards: store.orders.cards || [],
		profile: store.profile.profile || {}
	}
}

export default connect(mapStateToProps)(withTranslation(Checkout))
