import React from 'react'
import { withRouter } from 'react-router'
import { IonButton, IonIcon } from '@ionic/react'
import { arrowBack } from 'ionicons/icons'
import { forwardTo } from '../../lib/utils'

const BackButton = props => {
	const { history, path, style, className, backHandler } = props
	return (
		<IonButton color='dark' className={ className ? className : null } button clear onClick={() => backHandler ? backHandler() : path ? forwardTo(path) : history.goBack()} style={ style ? { ...style } : {} }>
			<IonIcon slot="icon-only" icon={ arrowBack }/>
		</IonButton>
	)
}

export default withRouter(BackButton)
