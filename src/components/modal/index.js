import React from 'react'
import { IonModal, IonButton } from '@ionic/react'
import './index.css'

export default class Modal extends React.Component {
	render () {
		const { children, title, action, actionLabel, className, scrollable, ...rest } = this.props
		const { onDidDismiss } = rest

		return (
			<IonModal className={ 'modal-classic' + (className ? ' ' + className : '')} { ...rest }>
				<div className={ 'modal-classic-wrapper' + (scrollable ? ' scrollable-y' : '')}>
					{ onDidDismiss ?
						<div className="modal-classic-closer" onClick={ onDidDismiss }>
							<ion-icon name="close"/>
						</div>
						: null }
					{ title ?
						<div className="modal-classic-header">
							<h3>{ title }</h3>
						</div>
						: null }
					<div className="modal-classic-content">
						{ children }
					</div>
					{ action ?
						<div className="modal-classic-action">
							<IonButton expand="block" color="primary" onClick={ action }>{ actionLabel || '--' }</IonButton>
						</div>
						: null }
				</div>
			</IonModal>
		)
	}
}
