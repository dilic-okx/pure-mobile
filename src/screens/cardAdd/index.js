import React from 'react'
import { connect } from 'react-redux'
import { IonButton, IonList, IonItem, IonIcon, isPlatform } from '@ionic/react'
import { CardIO } from '@ionic-native/card-io/ngx'
import Loading from '../../components/spinner'
import Layout from '../../components/layout'
import { Title, SmallText, Spacer, FieldError } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { showToast, addScannedCard } from '../../store/actions'
import { camera } from 'ionicons/icons'
import { validateForm, getLocale, goBack, isDefined } from '../../lib/utils'
import MaskedInput from 'react-text-mask'
import { forwardTo } from '../../lib/utils'
import './index.css'
import Mobiscroll from '../../components/mobiscroll'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, ElementsConsumer } from '@stripe/react-stripe-js'
import Stripe from '../../lib/stripe'
import { Capacitor } from '@capacitor/core'
import moment from '../../lib/moment'
import Basket from '../../lib/basket'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'

const { DatePicker } = Mobiscroll

const nameInputMask = Array(50).fill(/[a-z0-9A-Z ]/)

const { getMobile, setMobile } = Basket

class Cards extends React.Component {
	constructor(props) {
		super(props)
		if (!getMobile() && this.props.profile && this.props.profile.mobile) {
			setMobile(this.props.profile.mobile)
		}
		this.state = {
			name: '',
			cardNumber: '',
			expiryDate: '',
			cvc: '',
			formErrors: {},
			focus: {},
			numberOfReadyElements: 0,
			focusedInput: ''
		}
		this.cardIO = new CardIO()
		this.androidPermissions = new AndroidPermissions()
	}

	isFistCard = () => this.props.cards && this.props.cards.length === 1

	resetState = () => this.setState({ cardNumber: '', expiryDate: '', cvc: '', name: '' }, () => {
		const { cards, location } = this.props
		const addCardFromAccount = location && location.state && isDefined(location.state.addCardFromAccount) ? location.state.addCardFromAccount : false
		// when user add his first card then create order instantly
		// note: this method will be called after card added
		if (this.isFistCard() && !addCardFromAccount) {
			Basket.changeSelectedCard(cards[0].id)
			Basket.createOrder()
		} else {
			if (this.props.skipRedirect) {
				return
			}
			if (this.props.location && this.props.location.state && this.props.location.state.addCardFromCheckout) {
				// skip cards list page when we going back from add card form page to checkout page
				goBack()
			} else if (addCardFromAccount) {
				// skip cards list page when we going back from add card form page to account page
				goBack()
			} else {
				forwardTo('/cards')
			}
		}
	})

	createCard = card => {
		const { dispatch } = this.props
		const { name } = this.state
		// dispatch(loading(true))

		try {
			Stripe.getStripeInstance().createCardToken(card).then(token => {
				const cardToken = token.id //'tok_....'
				dispatch(addScannedCard(name, cardToken, { cb: () => {
					// dispatch(loading(false))
					this.resetState()
				} }))
			}).catch(error => {
				// dispatch(loading(false))
				dispatch(showToast(error, 'warning'))
			})
		} catch (e) {
			// dispatch(loading(false))
		}
	}

	validateCardForm = field => {
		const formErrors = validateForm({
			cardNumber: { type: 'cardNumber', required: true },
			expiryDate: { required: true },
			cvc: { required: true }
		}, this.state)

		const errorsLength = Object.keys(formErrors).length
		if (errorsLength !== 0 && !field) {
			this.setState({ formErrors })
		} else if (errorsLength !== 0 && field) {
			this.setState({ formErrors: {
				...this.state.formErrors,
				[field]: formErrors[field]
			}})
		} else if (errorsLength === 0) {
			this.setState({ formErrors })
		}
		return formErrors
	}

	addPaymentCard = event => {
		event.preventDefault()
		const { cardNumber, expiryDate, cvc, name } = this.state
		const { stripe, elements } = this
		const { dispatch, __ } = this.props

		if (Capacitor.platform === 'web') {
			if (!stripe || !elements) {
				return
			}
			const that = this
			const cardNumberElement = elements.getElement(CardNumberElement)
			stripe.createToken(cardNumberElement).then(function(result) {
				if (result.error) {
					dispatch(showToast(__(result.error.message), 'warning'))
				} else {
					if (result.token && result.token.card) {
						const cardToken = result.token.id
						dispatch(addScannedCard(name, cardToken, { cb: () => {
							that.resetState()
						} }))
					}
				}
			})
		} else {
			const formErrors = this.validateCardForm()

			if (Object.keys(formErrors).length !== 0) {
				this.setState({ formErrors })
			} else {
				const arr = expiryDate.split('/')
				const month = arr[0]
				const year = arr[1].length === 2 ? arr[1] : arr[1].length === 4 ? arr[1].substr(2, 4) : arr[1]
				const card = {
					number: (cardNumber + '').replace(/\s+/g, ''),
					exp_month: month,
					exp_year: year,
					cvc: cvc
				}
				this.createCard(card)
			}
		}
	}

	scandCard = () => {
		const that = this
		const { dispatch, __ } = this.props
		return this.cardIO.canScan().then(res => {
			if (res) {
				let options = {
					requireExpiry: true,
					requireCVV: true,
					requirePostalCode: false
				}
				this.cardIO.scan(options).then(card => {
					that.setState({
						cardNumber: card.cardNumber,
						expiryDate: card.expiryMonth + '/' + card.expiryYear,
						cvc: card.cvv
					})
				})
			} else {
				dispatch(showToast(__('You need to give this app permission to use the camera in your phone settings'), 'warning'))
			}
		}).catch(function() {
			dispatch(showToast(__('Scan card problem'), 'warning'))
		})
	}

	handleScanCard = () => {
		const { dispatch, __ } = this.props
		if (isPlatform('android')) {
			this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(result => {
				if (result.hasPermission) {
					this.scandCard()
				} else {
					return this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA).then( res1 => {
						if (!res1.hasPermission) {
							dispatch(showToast(__('You need to give this app permission to use the camera in your phone settings'), 'warning'))
						}
					}).catch(() => {
						dispatch(showToast(__('You need to give this app permission to use the camera in your phone settings'), 'warning'))
					})
				}
			}).catch(() => {
				return this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
			})
		} else {
			//for iOS
			this.scandCard()
		}
	}

	handleInput = (inputName, value) => this.setState({ [inputName]: value })

	setInputFocus = (inputName, flag) => this.setState({ focus: { ...this.state.focus, [inputName]: flag }})

	getInputClass = inputName => {
		const base = 'item-interactive item-input item-has-placeholder item md in-list ion-focusable hydrated masked-input '
		return base + (this.state.focus[inputName] ? 'item-has-focus' : '')
	}

	elementReady = () => this.setState({ numberOfReadyElements: this.state.numberOfReadyElements + 1 })

	setFocusedInput = (inputName = '') => this.setState({ focusedInput: inputName })

	formatSelectedValue = () => {
		let selectedDate = this.state.expiryDate
		if (selectedDate) {
			const arr = selectedDate.split('/')
			const month = parseInt(arr[0], 10) - 1
			const year = parseInt(arr[1], 10)
			selectedDate= new Date()
			selectedDate.setMonth(month)
			selectedDate.setYear(year)
		}
		return selectedDate
	}

	backHandler = () => {
		if (this.props.location && this.props.location.state && this.props.location.state.skipContactDetails) {
			// skip cards list page when we going back from add card form page to account page
			forwardTo('/order-summary', { skipBackToThePreviousPage: true })
		} else if (this.props.location && this.props.location.state && this.props.location.state.addCardFromAccount) {
			forwardTo('/cards', { addCardFromAccount: true })
		} else if (this.props.location.pathname === '/card-add' ) {
			forwardTo('/order')
		} else {
			goBack()
		}
	}

	render () {
		const { __, loading, profile, cards } = this.props
		const { name, formErrors, cardNumber, cvc, numberOfReadyElements, focusedInput } = this.state
		const CardNameInput = <IonItem className={ this.getInputClass('name')}>
			<MaskedInput
				mask={ nameInputMask }
				className="payment-card-input"
				placeholder={ __('E.g. Personal Account') }
				guide={ false }
				onChange={ e => { this.handleInput('name', e.target.value) } }
				onFocus={ () => { this.setInputFocus('name', true) } }
				onBlur={ () => { this.setInputFocus('name', false) } }
				value={ name }
			/>
		</IonItem>
		const inputStyle = { style: { base: { fontSize: '13px' }}}
		const showStripeLoading = numberOfReadyElements < 3 && loading === 0 && Capacitor.platform === 'web'

		const pageContent =
			<Loading transparent>
				<Layout color="white" headerTitle={ __('Add Payment Card')} backHandler={this.backHandler}>
					<form onSubmit={ this.addPaymentCard }>
						<div className="flex-row-wrapper absolute-content">
							<div className="scrollable-y add-card-scroll">
								<Title>{ __('Add Payment Card') }</Title>
								<SmallText>{ __('Enter your payment card details') }</SmallText>
								<Spacer size={ 3 }/>

								{ showStripeLoading ? <Loading additionalLoadingCondition={ showStripeLoading } transparent transparentForce><span/></Loading> : null }
								<IonList className= "card-list">
									{ Capacitor.platform !== 'web' ?
										<>
											<IonItem className={ this.getInputClass('cardNumber') }>
												<MaskedInput
													mask={ [/\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/] }
													className="payment-card-input"
													placeholder={ __('Card Number') }
													guide={ false }
													onChange={ e => { this.handleInput('cardNumber', e.target.value) } }
													onFocus={ () => { this.setInputFocus('cardNumber', true) } }
													onBlur={ () => { this.setInputFocus('cardNumber', false) } }
													value={ cardNumber }
													type= "tel"
												/>
											</IonItem>
											{ formErrors.cardNumber ? <FieldError className="field-error" value={ __(formErrors.cardNumber) } />: null }
											<div className="flex-col-wrapper">
												<IonItem>
													<DatePicker
														className="data-picker-input"
														display="bottom"
														setText={__('Done')}
														cancelText = {__('Cancel')}
														value={ this.formatSelectedValue() }
														onSet={(e, a) => this.handleInput('expiryDate', a.element.value)}
														min = { moment() }
														placeholder={ __('Expiry date') }
														inputStyle="box"
														dateFormat="mm/yyyy"
														dateWheels = "mm-MMyyyy"
														lang = {profile.locale}
													/>
												</IonItem>
												<div className="flex-spacer"/>
												<div>
													<IonItem className={ this.getInputClass('cvc') }>
														<MaskedInput
															mask={ [/\d/, /\d/, /\d/, /\d/] }
															className="payment-card-input"
															placeholder={ __('CVV') }
															guide={ false }
															onChange={ e => { this.handleInput('cvc', e.target.value) } }
															onFocus={ () => { this.setInputFocus('cvc', true) } }
															onBlur={ () => { this.setInputFocus('cvc', false) } }
															value={ cvc }
															type= "tel"
														/>
													</IonItem>
													{ formErrors.cvc ? <FieldError className="field-error" value={ __(formErrors.cvc) } />: null }
												</div>
											</div>
											{ CardNameInput }
										</>
										:
										<>
											<div style={{ display: numberOfReadyElements >= 3 ? 'block' : 'none' }}>
												<CardNumberElement
													className={ 'web-stripe-input ' + (focusedInput === 'cardNumber' ? 'web-stripe-input-active' : '') }
													options={{ ...inputStyle }}
													onReady={ this.elementReady }
													onFocus={ () => this.setFocusedInput('cardNumber') }
													onBlur={ () => this.setFocusedInput() }
												/>
												<div className="flex-col-wrapper">
													<CardExpiryElement
														className={ 'web-stripe-input ' + (focusedInput === 'expiry' ? 'web-stripe-input-active' : '') }
														options={{ ...inputStyle }}
														onReady={ this.elementReady }
														onFocus={ () => this.setFocusedInput('expiry') }
														onBlur={ () => this.setFocusedInput() }
													/>
													<div className="flex-spacer"/>
													<CardCvcElement
														className={ 'web-stripe-input ' + (focusedInput === 'cvc' ? 'web-stripe-input-active' : '') }
														options={{ ...inputStyle }}
														onReady={ this.elementReady }
														onFocus={ () => this.setFocusedInput('cvc') }
														onBlur={ () => this.setFocusedInput() }
													/>
												</div>
												{ CardNameInput }
											</div>
										</>
									}
								</IonList>
							</div>
							<div className="flex-min">
								<IonButton onClick={ this.handleScanCard } expand="block" fill="outline" color="dark">
									<IonIcon slot="start" icon={ camera } />{ __('Scan Card') }
								</IonButton>
								<IonButton type="submit" expand="block">{ cards && cards.length > 1 ? __('Pay') : __('Continue') }</IonButton>
							</div>
						</div>
					</form>
				</Layout>
			</Loading>

		return Capacitor.platform === 'web' ?
			<Elements stripe={ Stripe.getStripeInstance() } options={{ locale: getLocale(this.props.profile) }}>
				<ElementsConsumer>
					{({ elements, stripe }) => {
						this.elements = elements
						this.stripe = stripe
						return pageContent
					}}
				</ElementsConsumer>
			</Elements> : pageContent
	}
}

const mapStateToProps = store => {
	return {
		profile: store.profile.profile,
		loading: store.common.loading,
		cards: store.orders.cards || []
	}
}

export default connect(mapStateToProps)(withTranslation(Cards))
