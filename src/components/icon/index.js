import React from 'react'
import { IonIcon } from '@ionic/react'

import './index.css'

const Icomoon = props => {
	const { icon } = props

	let content = <div className={'icomoon ico-' + icon} slot="start"></div>
	return content
}

const Icon = props => {
	const { icon, name, iconName } = props
	return (
		<>
			{ icon ? <IonIcon icon={ icon } { ...props } /> :
				iconName ? <Icomoon icon={ iconName } { ...props } /> : <IonIcon name={ name } { ...props } />
			}
		</>
	)
}

export default Icon
