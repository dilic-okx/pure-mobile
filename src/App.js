import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux'
import { IonApp, IonSplitPane, IonPage, IonAlert, IonContent } from '@ionic/react'
import { Router } from 'react-router-dom'
import { Plugins, Capacitor } from '@capacitor/core'
import { getConfig } from './appConfig'
import navConfig from './navConfig'
import ProtectedRoute from './components/protectedRoute'
import history from './history'
import { getDefaultRoute, isWebConfig, forwardTo } from './lib/utils'
import { withTranslation } from '../src/lib/translate'
import Basket from './lib/basket'
import { init, changeConnectionStatus, setMyLocation, setCommonModal, updateProfile } from './store/actions'
import ValidateModal from './components/validateModal'
import StaticHeader from './components/staticHeader'
import Drawer from './components/drawer'
import Toast from './components/toast'
import Loading from './components/spinner'
import Alert from './components/alert'
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'
/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
/* Theme */
// require('./theme/' + (isPlatform('mobile') ? 'index' : 'web') + '.css')
require('./theme/' + (isWebConfig() ? 'web' : 'index') + '.css')
const { Network, Geolocation } = Plugins

Plugins.App.addListener('backButton', () => {
	if (history.location && history.location.pathname && getConfig().general.appExitRoutes.indexOf(history.location.pathname) !== -1) {
		Plugins.App.exitApp()
	} else {
		history.goBack()
	}
})

const mapRoutes = (routes, extraProps = {}) => {
	return routes.filter(route => !!route.path && !!route.component).map(item => {
		const { path } = item
		const ActualRoute = item.protected ? ProtectedRoute : Route
		return (
			<ActualRoute exact={ item.exact } path={ path } key={ 'nav-key-' + path } route={ item }
				cmp={ item.component }
				render={ props =>
					item.render ?
						item.render({ ...props, ...extraProps, route: item })
						:
						<item.component { ...props } { ...extraProps } route={ item } />
				}
			/>
		)
	})
}

class App extends React.Component {
	constructor(props) {
		super(props)

		this.defaultRoute = []
		this.routeComponents = []
		this.authRouteComponents = []
		this.additionalRouteComponents = []
		this.notInMenuRouteComponents = []

		this.content = null
	}

	componentDidMount() {
		this.props.dispatch(init())

		Network.addListener('networkStatusChange', conStatus => {
			const status = conStatus.connected
			this.props.dispatch(changeConnectionStatus(status))
		})
		this.getCurrentPosition()
	}

	async getCurrentPosition() {
		const { myLocation, dispatch } = this.props
		if (!myLocation.latitude && !myLocation.longitude) {
			// this.showModal(true)
			try {
				const coordinates = await Geolocation.getCurrentPosition({ timeout: 30000, enableHighAccuracy: false })
				const myLocation = {
					latitude: coordinates.coords.latitude,
					longitude: coordinates.coords.longitude
				}
				dispatch(setMyLocation(myLocation))
			} catch (error) {
				if (JSON.stringify(error).indexOf('kCLErrorDomain') !== -1 && JSON.stringify(error).indexOf('error 0') !== -1 ) {
					this.getCurrentPosition()
				}
			}
		}
	}

	onRemoveValidateModal = () => {
		const { dispatch } = this.props
		dispatch(setCommonModal('isValidationModalOpen', false))
		dispatch(updateProfile({ is_verification_pop_up_shown: true }, true))
	}

	onRemoveBasketResetModal = () => {
		const { dispatch } = this.props
		dispatch(setCommonModal('isBasketResetModalOpen', false))
		dispatch(setCommonModal('hasBaksetResetModalOpen', true))
	}

	generateRoutes = () => {
		this.defaultRoute = getDefaultRoute()
		this.routeComponents = mapRoutes(navConfig.routes)
		this.authRouteComponents = mapRoutes(navConfig.authRoutes)
		this.additionalRouteComponents = mapRoutes(navConfig.additionalRoutes)
		this.notInMenuRouteComponents = mapRoutes(navConfig.notInMenuRoutes)
	}

	clearBasket = () => {
		const { dispatch } = this.props
		Basket.reset()
		dispatch(setCommonModal('isBasketResetWarningModalOpen', false))
	}

	closeAlert = () => {
		const { dispatch } = this.props
		forwardTo('/dashboard')
		dispatch(setCommonModal('isBasketResetWarningModalOpen', false))
	}

	render () {
		const { __, isValidationModalOpen, initLoading, isBasketResetModalOpen, isBasketResetWarningModalOpen } = this.props

		if (Capacitor.platform === 'web') {
			// wait for init saga to finish (reason: we dont have splash screen in web)
			if (!initLoading) {
				this.generateRoutes()
				this.content = null
			} else {
				this.content =
					<IonPage id="main"><IonContent>
						<Loading additionalLoadingCondition/>
					</IonContent></IonPage>
			}
		} else {
			// mobile
			this.generateRoutes()
		}

		return (
			<IonApp className={ isWebConfig() ? 'web' : '' }>
				<Router history={ history }>
					{ this.content ? this.content :
						<IonSplitPane contentId="main">
							<Drawer/>
							<IonPage id="main">
								<StaticHeader/>
								<Switch>
									{ this.routeComponents }
									{ this.authRouteComponents }
									{ this.additionalRouteComponents }
									{ this.notInMenuRouteComponents }
									{ this.defaultRoute ? <Route exact path="/" render={ () => <Redirect to={ this.defaultRoute.path } /> } /> : null }
								</Switch>
								<Toast />
								<ValidateModal/>
								<IonAlert
									isOpen={ isValidationModalOpen }
									onDidDismiss={this.onRemoveValidateModal}
									header={ __('Success') }
									message={ __('The app is now unlocked to redeem your loyalty') }
									buttons={[
										{
											text: __('Close'),
											role: 'cancel',
											cssClass: 'secondary',
											handler: this.onRemoveValidateModal
										}
									]}
								/>
								<IonAlert
									isOpen={ isBasketResetModalOpen }
									onDidDismiss={this.onRemoveBasketResetModal}
									header={ __('Basket') }
									message={ __('Your collection time has now passed, please checkout in the next 5 minutes in order to place your order.')}
									buttons={[
										{
											text: __('OK'),
											role: 'cancel',
											cssClass: 'secondary',
											handler: () => this.onRemoveBasketResetModal
										}
									]}
								/>
								<Alert showAlert={isBasketResetWarningModalOpen} closeAlert={ this.closeAlert } type='select' clearBasket={this.clearBasket} />
							</IonPage>
						</IonSplitPane>
					}
				</Router>
			</IonApp>
		)
	}
}

const stateToProps = store => {
	const { auth, profile } = store.profile
	const { myLocation, initLoading, isValidationModalOpen, isBasketResetModalOpen, hasBaksetResetModalOpen, isBasketResetWarningModalOpen } = store.common
	return {
		auth,
		myLocation,
		profile,
		initLoading,
		isValidationModalOpen,
		isBasketResetModalOpen,
		hasBaksetResetModalOpen,
		isBasketResetWarningModalOpen
	}
}

export default connect(stateToProps)(withTranslation(App))
