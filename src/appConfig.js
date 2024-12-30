import { getEnv } from './lib/env.js'

let appConfig = {
	theme: {
		nav: {
			label: 'Pure.'
		},
		showHeaderOnAuthRoutes: true,
		showInputIconsOnLogin: false,
		routesWithoutStaticHeader: [ '/item-details' ]
	},
	services: {
		google_maps: {
			google_api_key: getEnv('GOOGLE_API_KEY')
		}
		// stripe_key: 'pk_test_SfLlfP41LhHVIG2vrA95ZrFt' //Kole
	},
	api: {
		baseURL: 'https://pure-uk.herokuapp.com',
		// baseURL: 'https://hybrid-master.herokuapp.com'
		// baseURL: 'http://192.168.0.242:8000', //preda
		wordPressBaseURL: 'https://hybridapp.co.uk'
	},
	general: {
		clientName: 'Pure.',
		appExitRoutes: [ '/', '/home', '/dashboard' ],
		authRoutes: [ '/login', '/register', '/reset-password' ],
		isReduxDevToolsOn: true,
		isWebPlatform: false,
		basketTime: -5
	},
	appType: {
		hasOrdering: true,
		hasLoyalty: true,
		hasEmailValidationEnabled: true
	},
	delivery: [
		{
			id: 'collection',
			label: 'Click & Collect',
			route: '/click-and-collect'
		},
		{
			id: 'delivery',
			label: 'Delivery Order',
			route: '/delivery'
		},
		{
			id: 'pick-up-point',
			label: 'Pure Drop Point',
			route: '/pick-up-point'
		}
	],
	configS3: {
		imageNamePrefix: 'pure_profile_image_',
		bucketName: 'hybrid-apps-profile-images',
		region: 'eu-west-1',
		accessKeyId: getEnv('S3_ACCESS_KEY_ID'),
		secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY')
	},
	firebaseConfig: {
		apiKey: getEnv('FIREBASE_API_KEY'),
		authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
		databaseURL: getEnv('FIREBASE_DATABASE_URL'),
		projectId: getEnv('FIREBASE_PROJECT_ID'),
		storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
		messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
		appId: getEnv('FIREBASE_APP_ID'),
		measurementId: getEnv('FIREBASE_MEASUREMENT_ID')
	},
	payment: 'stripe'
}

export const updateConfig = newConfig => appConfig = newConfig

export const getConfig = () => appConfig

export default appConfig
