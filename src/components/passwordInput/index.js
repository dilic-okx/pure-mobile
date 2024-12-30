import React from 'react'
import { IonIcon, IonInput, IonButton, IonLabel } from '@ionic/react'
import { eye, eyeOff } from 'ionicons/icons'
import './index.css'

class PasswordInput extends React.Component {
	state = {
		value: this.props.value || '',
		show: false
	}

	togglePass = show => {
		this.setState({ show })
	}

	onChange = e => {
		const { onIonChange } = this.props
		this.setState({ value: e.target.value })
		if (onIonChange) {
			onIonChange(e)
		}
	}

	render () {
		const { show, value } = this.state
		const { label, labelColor, ...rest } = this.props
		return (
			<div className="okx-password-wrapper">
				<div className="okx-password-holder">
					{ label ?
						<IonLabel position="floating" color={ labelColor }>{ label }</IonLabel>
						: null }
					<IonInput { ...rest } className="okx-password" type={ show ? 'text' : 'password' } pattern="password" autocomplete="current-password" value={ value } onIonChange={ this.onChange } onIonBlur={ this.onChange }></IonInput>
				</div>
				<IonButton color="gray" disabled={ value === '' } fill="clear" size="small" onTouchStart={ () => this.togglePass(true) } onTouchEnd={ () => this.togglePass(false) } onMouseDown={ () => this.togglePass(true) } onMouseUp={ () => this.togglePass(false) }>
					<IonIcon slot="icon-only" icon={ show ? eye : eyeOff }/>
				</IonButton>
			</div>
		)
	}
}

export default PasswordInput
