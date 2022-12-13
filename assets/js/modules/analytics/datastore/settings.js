/**
 * `modules/analytics` data store: settings.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import API from 'googlesitekit-api';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE as GA4_PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../analytics-4/datastore/constants';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import {
	isValidAccountID,
	isValidInternalWebPropertyID,
	isValidPropertySelection,
	isValidProfileSelection,
	isValidPropertyID,
	isValidProfileName,
	isValidAdsConversionID,
} from '../util';
import {
	MODULES_ANALYTICS,
	PROPERTY_CREATE,
	PROFILE_CREATE,
	FORM_SETUP,
} from './constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import { isPermissionScopeError } from '../../../util/errors';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';

const { createRegistrySelector } = Data;

// Invariant error messages.
export const INVARIANT_INVALID_ACCOUNT_ID =
	'a valid accountID is required to submit changes';
export const INVARIANT_INVALID_PROPERTY_SELECTION =
	'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_SELECTION =
	'a valid profileID is required to submit changes';
export const INVARIANT_INVALID_CONVERSION_ID =
	'a valid adsConversionID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_NAME =
	'a valid profile name is required to submit changes';
export const INVARIANT_INVALID_INTERNAL_PROPERTY_ID =
	'cannot submit changes with incorrect internal webPropertyID';

async function submitGA4Changes( { select, dispatch } ) {
	if ( ! select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
		return {};
	}

	const { error } = await dispatch( MODULES_ANALYTICS_4 ).submitChanges();
	if ( isPermissionScopeError( error ) ) {
		return { error };
	}

	return {};
}

export async function submitChanges( registry ) {
	const { select, dispatch } = registry;

	let propertyID = select( MODULES_ANALYTICS ).getPropertyID();
	if ( propertyID === PROPERTY_CREATE ) {
		const accountID = select( MODULES_ANALYTICS ).getAccountID();
		const { response: property, error } = await dispatch(
			MODULES_ANALYTICS
		).createProperty( accountID );

		if ( error ) {
			return { error };
		}

		propertyID = property.id;
		dispatch( MODULES_ANALYTICS ).setPropertyID( property.id );
		dispatch( MODULES_ANALYTICS ).setInternalWebPropertyID(
			// eslint-disable-next-line sitekit/acronym-case
			property.internalWebPropertyId
		);
	}

	const profileID = select( MODULES_ANALYTICS ).getProfileID();
	if ( profileID === PROFILE_CREATE ) {
		const profileName = select( CORE_FORMS ).getValue(
			FORM_SETUP,
			'profileName'
		);
		const accountID = select( MODULES_ANALYTICS ).getAccountID();
		const { response: profile, error } = await dispatch(
			MODULES_ANALYTICS
		).createProfile( accountID, propertyID, { profileName } );

		if ( error ) {
			return { error };
		}

		dispatch( MODULES_ANALYTICS ).setProfileID( profile.id );
	}

	const ga4PropertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
	const ga4StreamID = select( MODULES_ANALYTICS_4 ).getWebDataStreamID();

	if (
		ga4PropertyID === GA4_PROPERTY_CREATE ||
		ga4StreamID === WEBDATASTREAM_CREATE
	) {
		const { error } = await submitGA4Changes( registry );
		if ( error ) {
			return { error };
		}
	}

	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( select( MODULES_ANALYTICS ).haveSettingsChanged() ) {
		const { error } = await dispatch( MODULES_ANALYTICS ).saveSettings();

		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'analytics' );

	const { error } = await submitGA4Changes( registry );
	if ( error ) {
		return { error };
	}

	return {};
}

export function rollbackChanges( { select, dispatch } ) {
	dispatch( MODULES_ANALYTICS_4 ).rollbackChanges();

	dispatch( CORE_FORMS ).setValues( FORM_SETUP, { enableGA4: undefined } );

	if ( select( MODULES_ANALYTICS ).haveSettingsChanged() ) {
		dispatch( MODULES_ANALYTICS ).rollbackSettings();
	}
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const {
		getAccountID,
		getAdsConversionID,
		getInternalWebPropertyID,
		getProfileID,
		getPropertyID,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( MODULES_ANALYTICS );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	invariant(
		haveSettingsChanged() ||
			select( MODULES_ANALYTICS_4 ).haveSettingsChanged(),
		INVARIANT_SETTINGS_NOT_CHANGED
	);

	invariant(
		isValidAccountID( getAccountID() ),
		INVARIANT_INVALID_ACCOUNT_ID
	);
	invariant(
		isValidPropertySelection( getPropertyID() ),
		INVARIANT_INVALID_PROPERTY_SELECTION
	);
	invariant(
		isValidProfileSelection( getProfileID() ),
		INVARIANT_INVALID_PROFILE_SELECTION
	);

	if ( getAdsConversionID() ) {
		invariant(
			isValidAdsConversionID( getAdsConversionID() ),
			INVARIANT_INVALID_CONVERSION_ID
		);
	}

	if ( getProfileID() === PROFILE_CREATE ) {
		const profileName = select( CORE_FORMS ).getValue(
			FORM_SETUP,
			'profileName'
		);
		invariant(
			isValidProfileName( profileName ),
			INVARIANT_INVALID_PROFILE_NAME
		);
	}

	// If the property ID is valid (non-create) the internal ID must be valid as well.
	invariant(
		! isValidPropertyID( getPropertyID() ) ||
			isValidInternalWebPropertyID( getInternalWebPropertyID() ),
		INVARIANT_INVALID_INTERNAL_PROPERTY_ID
	);

	if ( select( MODULES_ANALYTICS ).canUseGA4Controls() ) {
		select( MODULES_ANALYTICS_4 ).__dangerousCanSubmitChanges();
	}
}

/**
 * Gets the value of canUseSnippet based on the gaPropertyID of tagmanager module and propertyID.
 *
 * @since 1.75.0
 *
 * @return {boolean|undefined} Computed value of canUseSnippet. `undefined` if not loaded.
 */
export const getCanUseSnippet = createRegistrySelector( ( select ) => () => {
	const analyticsSettings = select( MODULES_ANALYTICS ).getSettings();

	if ( ! analyticsSettings ) {
		return undefined;
	}

	const isTagManagerAvailable =
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' );
	const isTagManagerConnected =
		isTagManagerAvailable &&
		select( CORE_MODULES ).isModuleConnected( 'tagmanager' );

	if ( ! isTagManagerConnected || ! select( MODULES_TAGMANAGER ) ) {
		return analyticsSettings.canUseSnippet;
	}

	const tagManagerUseSnippet = select( MODULES_TAGMANAGER ).getUseSnippet();

	if ( ! tagManagerUseSnippet ) {
		return analyticsSettings.canUseSnippet;
	}

	const gtmGAPropertyID = select( MODULES_TAGMANAGER ).getGAPropertyID();

	if ( isValidPropertyID( gtmGAPropertyID ) ) {
		return gtmGAPropertyID !== analyticsSettings.propertyID;
	}

	return analyticsSettings.canUseSnippet;
} );
