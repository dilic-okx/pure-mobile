module.exports = {
	"globals": {
		"window": true,
		"document": true,
		"localStorage": true,
		"fetch": false
	},
	"env": {
		"es6": true,
		"jest": true,
		"node": true
	},
	"plugins": [
		"node",
		"react"
	],
	"extends": [
		"eslint:recommended",
		"plugin:react/recommended"
	],
	"parserOptions": {
		"ecmaVersion": 2019,
		"ecmaFeatures": {
			"jsx": true
		},
		"sourceType": "module"
	},
	"settings": {
		"react": {
			"version": "detect"
		}
	},
	"parser": "babel-eslint",
	"rules": {
		'no-console': [ "error" ],
		"indent": [ "error", "tab" ],
		"linebreak-style": [ "error", "unix" ],
		"quotes": [ "error", "single" ],
		"semi": [ "error", "never" ],
		"no-extra-parens": [ "error" ],
		"no-multi-spaces": [ "error" ],
		"no-multiple-empty-lines": [ "error" ],
		"key-spacing": [
			"error",
			{
				"beforeColon": false,
				"afterColon": true
			}
		],
		"keyword-spacing": [ "error" ],
		"no-trailing-spaces": [ "error" ],
		"comma-dangle": [ "error", "never" ],
		"eol-last": [ "error" ],
		"curly": [ "error" ],
		"dot-notation": [ "error" ],
		"dot-location": [ "error", "object" ],
		"react/prop-types": "off",
		"react/jsx-filename-extension": "off",
		"react/display-name": "off",
		"node/no-unsupported-features/es-syntax": "off",
		"object-curly-spacing": ["error", "always", {
			"arraysInObjects": true,
			"arraysInObjects": false,
			"objectsInObjects": false,
			"objectsInObjects": false,
		}],
		"space-before-blocks": [ "error", "always" ],
		"arrow-spacing": [ "error", { "before": true, "after": true } ],
		"comma-spacing": [ "error", { "before": false, "after": true } ],
		"keyword-spacing": [2, { "before": true, "after": true }]
	}
}
