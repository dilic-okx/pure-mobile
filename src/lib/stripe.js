import { Plugins, Capacitor } from '@capacitor/core'
import appConfig from '../appConfig'
import { loadStripe } from '@stripe/stripe-js'
import Basket from './basket'
import { isEmptyObject } from './utils'
import { getConfig } from '../appConfig'

const isWeb = () => Capacitor.platform === 'web'

// docs: https://github.com/stripe/react-stripe-elements
class Stripe {
	constructor() {
		this.stripe = null
	}

	getStripeInstance = () => this.stripe

	setStripePublishableKey = token => {
		if (token) {
			if (isWeb()) {
				return loadStripe(token).then(stripeInstance => {
					this.stripe = stripeInstance
					return
				})
			} else {
				this.stripe = Plugins.Stripe
				return this.stripe.setPublishableKey({ key: token || appConfig.services.stripe_key })
			}
		}
	}

	confirmPaymentIntent = (clientSecret, options = {}) => {
		if (isWeb()) {
			return this.stripe.confirmCardPayment(clientSecret, { payment_method: options.paymentMethodId }).then(res => {
				return this.checkIntentResult(res)
			})
		} else {
			// this is used to confirm regular card and google pay payment intent
			return this.stripe.confirmPaymentIntent({ clientSecret, ...options }).then(res => {
				if (isEmptyObject(res)) {
					res.status = 'succeeded'
				}
				return this.checkIntentResult(res)
			})
		}
	}

	checkIntentResult = intent => {
		const intentResult = intent.paymentIntent || intent
		const retObj = {
			intentResult,
			isValid: false,
			message: 'Payment status - failed'
		}

		if (intentResult && intentResult.status && intentResult.status === 'succeeded') {
			retObj.message = 'Payment created successfully'
			retObj.isValid = true
		} else {
			if (intentResult.error && intentResult.error.message) {
				retObj.message += ' ' + intentResult.error.message
			}
		}
		return retObj
	}

	payWithGooglePay = (clientSecret, total = 0) => {
		if (!isWeb()) {
			return this.stripe.payWithGooglePay({
				clientSecret: clientSecret,
				googlePayOptions: {
					currencyCode: Basket.getSelectedCurrency().toUpperCase(),
					totalPrice: total,
					totalPriceStatus: 'FINAL',
					allowedAuthMethods: [ 'PAN_ONLY', 'CRYPTOGRAM_3DS' ],
					allowedCardNetworks: [ 'AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA' ]
				}
			})
		} else {
			return null
		}
	}

	// this is used only to confirm apple pay payment intent
	// IMPORTANT:
	// 		Stripe.confirmPaymentIntent will trigger credit card picket on apple phone,
	// 		also
	// 		Stripe.payWithApplePay will trigger credit card picket on apple phone.
	// 		So only ONE call must be present.
	payWithApplePay = (clientSecret, profile) => {
		if (!isWeb()) {
			return this.stripe.isApplePayAvailable().then(result => {
				if (result.available) {
					return this.stripe.confirmPaymentIntent({
						clientSecret,
						applePayOptions: {
							merchantIdentifier: getConfig().services.merchantIdentifier, // apple merchantIdentifier
							items: Basket.getItemsForApplePay(profile),
							currency: Basket.getSelectedCurrency().toUpperCase(), // currency code (iso3)
							country: Basket.getCountry().toUpperCase() // 2 letter country code (iso2)
						}
					}).then((res) => {
						// console.log('res', res)
						// if (res && res.payment_method && res.payment_method.id) {
						// 	Basket.changeSelectedCard(res.payment_method.id)
						// }
						return this.stripe.finalizeApplePayTransaction({ success: true }).then(() => {
							return res
						})
					}).catch(() => {
						return this.stripe.finalizeApplePayTransaction({ success: false })
					})
				} else {
					return Promise.reject('Apple pay not available')
				}
			})
		} else {
			return null
		}
	}
}

export default new Stripe()
