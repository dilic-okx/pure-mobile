import React from 'react'
import { IonHeader, IonContent, IonIcon, IonToolbar, IonButtons, IonButton } from '@ionic/react'
import { menuOutline } from 'ionicons/icons'

const SmallDrawer = ({ toggleMenu }) => {
	return (
		<>
			<IonHeader className="small-drawer-header">
				<IonToolbar color="tertiary">
					<IonButtons>
						<IonButton button onClick={() => toggleMenu()}>
							<IonIcon mode="ios" icon={menuOutline} color="dark" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>

			</IonContent>
		</>
	)
}

export default SmallDrawer
