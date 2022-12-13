/**
 * Analytics useExistingTagEffect custom hook.
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
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../datastore/constants';
const { useSelect, useDispatch } = Data;

/**
 * Toggles `useSnippet` depending on whether there is a existing tag matching the selected UA property.
 */
export default function useExistingTagEffect() {
	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS );

	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getExistingTag()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);

	const skipEffect = useRef( true );

	useEffect( () => {
		if ( existingTag && propertyID !== undefined ) {
			if ( propertyID === '' || skipEffect.current ) {
				skipEffect.current = false;
				return;
			}
			if ( propertyID === existingTag ) {
				// Disable the Analytics snippet if there is an existing tag that
				// matches the currently selected property.
				setUseSnippet( false );
			} else {
				// Otherwise enable the Analytics snippet again.
				setUseSnippet( true );
			}
		}
	}, [ setUseSnippet, existingTag, propertyID ] );
}