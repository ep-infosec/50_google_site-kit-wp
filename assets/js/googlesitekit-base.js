/**
 * Admin utilities.
 *
 * This JavaScript loads on every admin page. Reserved for later.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import { clearWebStorage } from './util/standalone';

let wpLogout = document.querySelector( '#wp-admin-bar-logout a' );

// Support for WordPress.com signout button.
if ( ! wpLogout ) {
	wpLogout = document.querySelector( '.sidebar__me-signout button' );
}

if ( wpLogout ) {
	wpLogout.addEventListener( 'click', () => {
		clearWebStorage();
	} );
}
