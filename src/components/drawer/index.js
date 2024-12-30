import React from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Plugins, Capacitor } from '@capacitor/core'
import { IonMenu, IonHeader, IonToolbar, IonContent, IonList, IonItem, IonMenuToggle, IonButtons, IonButton, IonIcon, IonLabel, IonFooter, IonAlert, IonItemGroup, IonAvatar } from '@ionic/react'
import navConfig from '../../navConfig.js'
import { logout } from '../../store/actions'
import { getDefaultRoute, forwardTo, padNumber, isWebConfig } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import { Spacer, Hr, Subtitle, SmallText, NormalText } from '../../components/common'
import { version as packageJsonVersion } from '../../../package.json'
import SmallDrawer from './smallDrawer'
import { chevronBack, chevronDown, chevronUp } from 'ionicons/icons'
import defaultImg from '../../assets/images/gray-avatar.png'
import './index.css'

const openExternalLink = url => window.open(url, '_system', 'location=yes')

const loginIcon = require('../../assets/images/login-icon-dark.svg')
const avatarIcon = require('../../assets/images/avatar-new.png')

const { Device } = Plugins
const NavItem = withRouter(({ history, item, hideIcon, handleLogout, className, __ }) => {
	const selected = history.location.pathname === item.path
	return (
		<IonMenuToggle key={ item.path } auto-hide="false">
			<IonItem className={ 'nav-item' + (selected ? ' okx-nav-selected' : '') + (className ? ' ' + className : '')} button onClick={() => item.fn === 'logout' ? handleLogout() : item.isLink ? openExternalLink(item.path) : forwardTo(item.path, item.state)}>
				{ hideIcon ? null : <IonIcon className="nav-icon" slot="start" icon={ item.icon }/> }
				<IonLabel className="nav-label">{__(item.label)}</IonLabel>
			</IonItem>
		</IonMenuToggle>
	)
})

class Drawer extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			appDeviceVersion: '',
			showPopup: false,
			menuVisible: true,
			logBoxOpen: false,
			profile_image_url: this.props.profile.profile_image_url || defaultImg
		}
		this.handleLogout = this.handleLogout.bind(this)
		this.handleModal = this.handleModal.bind(this)
	}

	handleLogout() {
		this.props.dispatch(logout())
		const defaultRoute = getDefaultRoute()
		forwardTo(defaultRoute.path)
	}

	handleModal(val) {
		this.setState({ showPopup: val })
	}

	async componentDidMount () {
		const info = await Device.getInfo()
		const appDeviceVersion = info.appVersion
		this.setState({ appDeviceVersion: appDeviceVersion }, () => {
			this.checkVerison()
		})
	}

	addZeros = (arr = []) => arr.map((i, index) => {
		// e.g. 1.23.8
		// skip first number (app version) (e.g. 1)
		// add zeros only to patch (e.g. 23) or minor (e.g. 8)
		if (index !== 0) {
			return padNumber(i, 3)
		}
		return i
	})

	isAppVersionValid = (apiVersion = '', appVersion = '') => {
		let ret = true
		if (apiVersion && appVersion && apiVersion !== '' && appVersion !== '') {
			const apiVersionInt = parseInt(this.addZeros(apiVersion.split('.')).join(''), 10)
			const appVersionInt = parseInt(this.addZeros(appVersion.split('.')).join(''), 10)
			ret = appVersionInt >= apiVersionInt
			// eslint-disable-next-line no-console
			console.log(
				'APP VERSION:' +
				'\n    isValid:    ' + ret +
				'\n    platform:   ' + (Capacitor.platform !== 'web' ? 'MOBILE' : 'WEB') +
				'\n    device:     (' + typeof appVersion + ')-> ' + appVersion + ' (int: ' + appVersionInt + ')' +
				'\n    apiversion: (' + typeof apiVersion + ')-> ' + apiVersion + ' (int: ' + apiVersionInt + ')')
		} else {
			// eslint-disable-next-line no-console
			console.error('Skip version checking.')
		}
		return ret
	}

	checkVerison = () => {
		const { appDeviceVersion } = this.state
		if (Capacitor.platform !== 'web') {
			if (!this.isAppVersionValid(this.props.appVersion, appDeviceVersion) && appDeviceVersion !== '') {
				this.handleModal(true)
			}
		} else {
			// web version checking
			if (!this.isAppVersionValid(this.props.appVersion, packageJsonVersion)) {
				this.handleModal(true)
			}
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.appVersion !== prevProps.appVersion) {
			this.checkVerison()
		}

		if (this.props.profile.profile_image_url !== prevProps.profile.profile_image_url) {
			if (this.props.profile.profile_image_url) {
				this.setState({ profile_image_url: this.props.profile.profile_image_url })
			} else {
				this.setState({ profile_image_url: defaultImg })
			}
		}
	}

	toggleMenu = () => {
		this.setState({ menuVisible: !this.state.menuVisible }, () => {
			let drawer = this.state.menuVisible ? '--okx-drawer-max-width' : '--okx-small-drawer-max-width'
			document.documentElement.style.setProperty('--okx-drawer-width', `var(${drawer})`)
		})
	}

	toggleLogBox = () => {
		const { auth } = this.props
		const { loggedIn } = auth
		if (loggedIn) {
			this.setState({ logBoxOpen: !this.state.logBoxOpen })
		} else {
			forwardTo('/login')
		}
	}

	render () {
		const { auth, __, profile } = this.props
		const { showPopup, appDeviceVersion, menuVisible, logBoxOpen, profile_image_url } = this.state
		const { loggedIn } = auth
		const defaultRoute = getDefaultRoute()
		return (
			<IonMenu className="drawer-menu" side="start" type="overlay" contentId="main">
				{
					menuVisible ?
						<>
							<IonHeader>
								<IonToolbar color="tertiary">
									{/*<IonTitle>{ getConfig().theme.nav.label }</IonTitle>*/}
									<div className="nav-logo" onClick={() => forwardTo(defaultRoute.path)}></div>
									<IonIcon icon={chevronBack} className="collapse-drawer-icon" onClick={() => this.toggleMenu()} />
									<IonButtons slot="end">
										<IonMenuToggle>
											<IonButton button clear>
												<IonIcon slot="icon-only" icon="close"/>
											</IonButton>
										</IonMenuToggle>
									</IonButtons>
								</IonToolbar>
							</IonHeader>
							<IonContent>
								<IonList lines="none">
									{ navConfig.routes.filter(route => !!route.path && !route.notInDrawer).map(item =>
										<NavItem __={__} key={ item.path } item={ item }/>
									)}
								</IonList>
								{
									isWebConfig() ? null :
										<IonList lines="none">
											<NavItem __={__} handleLogout={ this.handleLogout } item={ navConfig.authRoutes.find(item => item.fn === (loggedIn ? 'logout' : 'login'))}/>
										</IonList>
								}
								{ isWebConfig() ? (
									<Hr thickness="1px" color="white" margin="10px 0px 10px 32px"/>
								) : (
									<Spacer/>
								)}
								<IonList lines="none">
									{ navConfig.additionalRoutes.filter(route => !!route.path).map(item =>
										<NavItem className="small-text" __={__} key={ item.path } item={ item }/>
									)}
								</IonList>
								<Spacer size={ 2 } />
							</IonContent>
							<IonContent scrollY={false} className="log-status">
								<IonItemGroup className="log-status-wrap">
									<IonItem lines="none" button onClick={() => this.toggleLogBox()}>
										<IonAvatar slot="start">
											{ loggedIn && (profile.profile_image_url || profile_image_url) ?
												<img alt="" src={ profile_image_url + (profile_image_url.indexOf('http') !== -1 ? '?' + Date.now() : '') } />
												: <img src={avatarIcon} alt="Avatar placeholder" /> }
										</IonAvatar>
										<div className="log-status-content">
											{
												loggedIn ?
													<>
														<Subtitle className="ellipsis">{profile.first_name} {profile.last_name}</Subtitle>
														<SmallText className="ellipsis">{profile.email}</SmallText>
													</>
													:
													<Subtitle><strong>{__('Hi') + '!' + ' ' + __('Please login')}</strong></Subtitle>
											}
										</div>
										{ loggedIn ? <IonIcon icon={logBoxOpen ? chevronDown : chevronUp} mode="ios" slot="end" /> : null }
									</IonItem>
									{
										loggedIn ?
											<IonItem className={`logout-box ${logBoxOpen ? 'visible' : ''}`} lines="none" button onClick={() => this.handleLogout()}>
												<IonLabel>
													<IonIcon icon={loginIcon} />
													<NormalText>Log out</NormalText>
												</IonLabel>
											</IonItem>
											: null
									}
								</IonItemGroup>
							</IonContent>
							<IonFooter className="small-text">
								<IonLabel size="small" slot="start" color="white">
									v{ Capacitor.platform !== 'web' && appDeviceVersion !== '' ? appDeviceVersion : packageJsonVersion }
								</IonLabel>
								<div className="logo-5l"><div/></div>
							</IonFooter>
						</>
						:
						<SmallDrawer toggleMenu={this.toggleMenu} />
				}
				<IonAlert
					isOpen={ showPopup }
					onDidDismiss={ () => this.handleModal(false)}
					header={ __('App version')}
					message={ __('Your app is out of date. Please update.')}
					buttons={[
						{
							text: __('OK'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => this.handleModal(false)
						}
					]}
				/>
			</IonMenu>
		)
	}
}

const stateToProps = state => {
	const { auth, profile } = state.profile
	const { appVersion } = state.common
	return {
		auth,
		appVersion,
		profile
	}
}

export default connect(stateToProps)(withRouter(withTranslation(Drawer)))
