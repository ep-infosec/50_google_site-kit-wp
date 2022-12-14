const fs = require( 'fs' );

module.exports = async ( page, scenario ) => {
	let cookies = [];
	const cookiePath = scenario.cookiePath;

	// READ COOKIES FROM FILE IF EXISTS
	if ( fs.existsSync( cookiePath ) ) {
		cookies = JSON.parse( fs.readFileSync( cookiePath ) );
	}

	// MUNGE COOKIE DOMAIN
	cookies = cookies.map( ( cookie ) => {
		cookie.url = 'https://' + cookie.domain;
		delete cookie.domain;
		return cookie;
	} );

	// SET COOKIES
	const setCookies = () => {
		return Promise.all(
			cookies.map( async ( cookie ) => {
				await page.setCookie( cookie );
			} )
		);
	};
	await setCookies();
	// eslint-disable-next-line no-console
	console.log(
		'Cookie state restored with:',
		JSON.stringify( cookies, null, 2 )
	);
};
