import React from 'react'
import { withRouter } from 'react-router'
import { IonContent, useIonViewDidEnter, useIonViewDidLeave, useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react'
import { getConfig } from '../../appConfig'
import Header from '../../components/header'
import { getRouteClassName } from '../../lib/utils'
import './index.css'

const defaultHeaderTitle = getConfig().general.clientName

const Layout = ({ history, children, headerTitle, hideSecondToolbar, hideBack, color, poster, blank, noPadding, contentClassName, scrollY, backHandler }) => {
	useIonViewWillEnter(() => {
		// eslint-disable-next-line no-console
		console.log('1. WillEnter event fired')
	})
	useIonViewDidEnter(() => {
		// eslint-disable-next-line no-console
		console.log('2. DidEnter event fired')
	})
	useIonViewWillLeave((a, b, c) => {
		// eslint-disable-next-line no-console
		console.log('3. WillLeave event fired', a, b, c)
	})
	useIonViewDidLeave((a, b, c) => {
		// eslint-disable-next-line no-console
		console.log('4. DidLeave event fired', a, b, c)
	})
	const routeClassName = getRouteClassName(history.location.pathname)
	return (
		<>
			{ blank ? null :
				<>
					{ hideSecondToolbar ? null :
						<Header title={ headerTitle || defaultHeaderTitle } hideBack={ hideBack } backHandler={ backHandler }/>
					}
				</>
			}
			<IonContent scrollY={ scrollY !== undefined ? scrollY : true } color={ color || 'white' } className={ routeClassName + (contentClassName ? ' ' + contentClassName : '') }>
				{ poster ? <div className={ 'poster ' + poster }/> : null }
				<div className={ noPadding ? 'no-padding' : 'ion-padding' }>{ children }</div>
			</IonContent>
		</>
	)
}

export default withRouter(Layout)
