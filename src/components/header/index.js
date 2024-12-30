import React from 'react'
import { IonTitle, IonToolbar, IonButtons } from '@ionic/react'
import BackButton from '../backButton'
import './index.css'

const Header = ({ title, hideBack, backHandler }) => {
	return (
		<IonToolbar className="dynamic-header">
			{ !hideBack ?
				<IonButtons slot="start">
					<BackButton backHandler={ backHandler }/>
				</IonButtons>
				: null }
			<IonTitle className="ion-text-center" style={{ visibility: 'hidden' }}>{ title }</IonTitle>
			{ !hideBack ?
				<IonButtons slot="end">
					<BackButton style={{ visibility: 'hidden' }} backHandler={ backHandler }/>
				</IonButtons>
				: null }
		</IonToolbar>
	)
}

export default Header
