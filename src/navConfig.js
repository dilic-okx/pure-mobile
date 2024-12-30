import { isWebConfig } from './lib/utils'
import Dashboard from './screens/dashboard'
import Loyalty from './screens/loyalty'
import Account from './screens/account'
import Feedback from './screens/feedback'
import ReferAFriend from './screens/refer-a-friend'
import History from './screens/history'
import HistoryDetails from './screens/historyDetails'
import Locations from './screens/locations'
import Social from './screens/social'
import Login from './screens/login'
import Register from './screens/register'
import ResetPassword from './screens/resetPassword'
import Terms from './screens/terms'
import Privacy from './screens/privacy'
import Faq from './screens/faq'
import ItemDetails from './screens/itemDetails'
import DeliveryOptions from './screens/delivery-options'
import Delivery from './screens/delivery'
import DeliveryAddressCheck from './screens/delivery-address-check'
import DeliveryAddressAdd from './screens/delivery-address-add'
import DeliveryTime from './screens/delivery-time'
import PickUpPoint from './screens/pick-up-point'
import PickUpPointCheck from './screens/pick-up-point-check'
import ClickAndCollect from './screens/clickAndCollect'
import Cards from './screens/cards'
import CardAdd from './screens/cardAdd'
import OrderSummary from './screens/orderSummary'
import ApplyPoints from './screens/applyPoints'
import Checkout from './screens/checkout'
import OrderCompleted from './screens/orderCompleted'
import ContactDetails from './screens/contactDetails'
// import AllergensInfo from './screens/allergensInfo'
import { getConfig } from './appConfig'
import { getSingleDeliveryOption } from './lib/utils'


const Order = require('./screens/order' + (isWebConfig() ? 'Web' : '')).default

const home = require('./assets/images/home-icon.svg')
const loyalty = require('./assets/images/loyalty-icon-02.svg')
const myAccount = require('./assets/images/myAccount-icon.svg')
const feedback = require('./assets/images/feedback-icon.svg')
const referAFriend = require('./assets/images/refer-friend-icon.svg')
const history = require('./assets/images/history-icon.svg')
const restaurants = require('./assets/images/location-icon.svg')
const social = require('./assets/images/social-icon.svg')
const login = require('./assets/images/login-icon.svg')
const logout = require('./assets/images/logout-icon.svg')
const settings = require('./assets/images/settings-icon.svg')
const startNewOrder = require('./assets/images/start-new-order.svg')
const menu = require('./assets/images/menu.svg')
const terms = require('./assets/images/terms.svg')
const privacy = require('./assets/images/privacy.svg')
const qm = require('./assets/images/qm.svg')

const { hasOrdering } = getConfig().appType

const singleDeliveryOption = getSingleDeliveryOption()

const navConfig = {
	routes: [
		isWebConfig() ? [] : { label: 'Home', path: '/dashboard', component: Dashboard, icon: home, exact: true, default: true },
		{ label: 'Menu', path: '/order', component: Order, icon: menu, exact: true, default: isWebConfig() },
		...hasOrdering ? [{ label: singleDeliveryOption ? singleDeliveryOption.label : '', path: '/click-and-collect', component: ClickAndCollect, icon: settings, protected: false, notInDrawer: !singleDeliveryOption }] : [],
		...hasOrdering ? [{ label: 'Start New Order', path: '/delivery-options', component: DeliveryOptions, icon: startNewOrder, protected: false, notInDrawer: !!singleDeliveryOption }] : [],
		{ label: 'Loyalty', path: '/loyalty', component: Loyalty, icon: loyalty, protected: true, state: { tab: 'points' }},
		{ label: 'Refer A Friend', path: '/refer-a-friend', component: ReferAFriend, icon: referAFriend, protected: true },
		...hasOrdering ? [{ label: 'Checkout', path: '/checkout', component: Checkout, notInDrawer: true, protected: true }] : [],
		...hasOrdering ? [{ label: 'Apply Points', path: '/apply-points', component: ApplyPoints, notInDrawer: true, protected: true }] : [],
		{ label: 'My Account', path: '/account', component: Account, icon: myAccount, protected: true },
		{ label: 'History', path: '/history', component: History, icon: history, protected: true },
		{ label: 'Leave Feedback', path: '/feedback', component: Feedback, icon: feedback, protected: true },
		{ label: 'Locations', path: '/locations', component: Locations, icon: restaurants, protected: false },
		{ label: 'Social Media', path: '/social', component: Social, icon: social, protected: false },
		{ label: 'Contact Details', path: '/contact-details', component: ContactDetails, protected: true, notInDrawer: true }
	],
	authRoutes: [
		{ label: 'Login', path: '/login', component: Login, icon: login, fn: 'login' },
		{ label: 'Logout', path: '/logout', icon: logout, fn: 'logout' }
	],
	additionalRoutes: [
		{ label: 'T&Cs', path: '/terms', component: Terms, icon: terms },
		{ label: 'Privacy Policy', path: '/privacy', component: Privacy, icon: privacy },
		{ label: 'FAQ & Support', path: '/faq', component: Faq, icon: qm },
		{ label: 'Allergens Info', path: 'https://hybridapp.co.uk/en/allergen-page/pure-uk', icon: qm, exact: true, isLink: true }
		// { label: '', path: '/allergens-info', component: AllergensInfo, icon: qm }
	],
	notInMenuRoutes: [
		{ path: '/register', component: Register },
		{ path: '/reset-password', component: ResetPassword },
		...hasOrdering ? [{ path: '/order', component: Order }] : [],
		...hasOrdering ? [{ path: '/item-details', component: ItemDetails }] : [],
		...hasOrdering ? [{ path: '/cards', component: Cards }] : [],
		...hasOrdering ? [{ path: '/card-add', component: CardAdd }] : [],
		...hasOrdering ? [{ path: '/history-details', component: HistoryDetails }] : [],
		...hasOrdering ? [{ path: '/order-summary', component: OrderSummary }] : [],
		...hasOrdering ? [{ path: '/order-completed', component: OrderCompleted }] : [],
		...hasOrdering ? [{ path: '/delivery', component: Delivery }] : [],
		...hasOrdering ? [{ path: '/delivery-address-check', component: DeliveryAddressCheck }] : [],
		...hasOrdering ? [{ path: '/delivery-address-add', component: DeliveryAddressAdd }] : [],
		...hasOrdering ? [{ path: '/delivery-time', component: DeliveryTime }] : [],
		...hasOrdering ? [{ path: '/pick-up-point', component: PickUpPoint }] : [],
		...hasOrdering ? [{ path: '/pick-up-point-check', component: PickUpPointCheck }] : []
	]
}

export default navConfig
