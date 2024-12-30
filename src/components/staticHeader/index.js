import React from 'react'
import { withRouter } from 'react-router'
import { IonHeader, IonToolbar, IonMenuButton, IonButtons, IonButton, IonIcon, IonBadge } from '@ionic/react'
import { scan, basket } from 'ionicons/icons'
import { connect } from 'react-redux'
import Basket from '../../lib/basket'
import Icon from '../icon'
import BackButton from '../backButton'
import { forwardTo, getRouteClassName } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import { getConfig } from '../../appConfig'
import './index.css'

const StaticHeader = ({ __, history, backHandler }) => {
	const currentPath = history.location.pathname
	const authPages = getConfig().general.authRoutes.indexOf(currentPath) !== -1
	const hideStaticHeader = getConfig().theme.routesWithoutStaticHeader.indexOf(currentPath) !== -1
	const routeClassName = getRouteClassName(currentPath)

	return (
		<>
			{ hideStaticHeader ? null : getConfig().theme.showHeaderOnAuthRoutes || !authPages ?
				<IonHeader className={ 'static ' + routeClassName }>
					<IonToolbar className="primary-toolbar">
						<IonButtons slot="start">
							{ !authPages ?
								<IonMenuButton />
								:
								<>
								<BackButton backHandler={ backHandler }/>
								</>
							}
						</IonButtons>
						<IonButtons color="primary">
							<IonButton className='image-button' color="primary-shade" onClick={ () => forwardTo('/dashboard') }/>
						</IonButtons>
						<IonButtons slot="end">
							{
								Basket.getOrderType() !== '' ?
									<IonButton color='dark' className='basket-button' onClick={ () => forwardTo('/order-summary') } size={ 24 }>
										<div>
											<div className='basket-icon-wrapper'>
												<IonBadge slot="end" color='primary' className={ Basket.itemsCount() >= 10 ? 'badge' : 'badge-small'}>{ Basket.itemsCount() }</IonBadge>
												<Icon icon={ basket } classname='icon' />
											</div>
											<div>
												{/* <SmallText color="gray">
													{ Basket._getTotal() }
												</SmallText> */}
											</div>
										</div>
									</IonButton> :
									!authPages ?
										<IonButton color='dark' button clear onClick={ () => forwardTo('/loyalty', { tab: 'scan' }) }><IonIcon slot="icon-only" icon={ scan }/></IonButton>
										: null
							}
						</IonButtons>
					</IonToolbar>
					<IonToolbar color="transparent"/>
				</IonHeader>
				: null }
		</>
	)
}

const stateToProps = store => {
	const { orders } = store
	return {
		basketUpdated: orders.basketUpdated
	}
}

export default connect(stateToProps)(withRouter(withTranslation(StaticHeader)))
