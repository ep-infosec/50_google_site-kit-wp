/**
 * Tag Manager Settings Edit component.
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
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER, ACCOUNT_CREATE } from '../../datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import useGAPropertyIDEffect from '../../hooks/useGAPropertyIDEffect';
import { AccountCreate } from '../common';
import SettingsForm from './SettingsForm';
const { useSelect } = Data;

export default function SettingsEdit() {
	const accounts =
		useSelect( ( select ) => select( MODULES_TAGMANAGER ).getAccounts() ) ||
		[];
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasExistingTag()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).isDoingSubmitChanges()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getAccounts' )
	);
	const loggedInUserID = useSelect( ( select ) =>
		select( CORE_USER ).getID()
	);
	const hasResolvedUser = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getUser' )
	);
	const hasModuleAccess = useSelect( ( select ) => {
		const moduleOwnerID = select( MODULES_TAGMANAGER ).getOwnerID();

		if ( moduleOwnerID === undefined || loggedInUserID === undefined ) {
			return undefined;
		}

		if ( moduleOwnerID === loggedInUserID ) {
			return true;
		}
		return select( CORE_MODULES ).hasModuleAccess( 'tagmanager' );
	} );
	const isLoadingModuleAccess = useSelect( ( select ) => {
		const hasResolvedModuleOwner =
			select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getSettings' );

		const isResolvingModuleAccess = select( CORE_MODULES ).isResolving(
			'hasModuleAccess',
			[ 'tagmanager' ]
		);

		return (
			! hasResolvedModuleOwner ||
			! hasResolvedUser ||
			isResolvingModuleAccess
		);
	} );
	const isCreateAccount = ACCOUNT_CREATE === accountID;

	// Set useSnippet to `false` if there is an existing tag and it is the same as the selected container ID.
	useExistingTagEffect();
	// Synchronize the gaPropertyID setting with the singular GA property ID in selected containers.
	useGAPropertyIDEffect();

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if (
		isDoingSubmitChanges ||
		! hasResolvedAccounts ||
		isLoadingModuleAccess ||
		hasExistingTag === undefined
	) {
		viewComponent = <ProgressBar />;
	} else if ( isCreateAccount || ! accounts?.length ) {
		viewComponent = <AccountCreate />;
	} else {
		viewComponent = <SettingsForm hasModuleAccess={ hasModuleAccess } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--tagmanager">
			{ viewComponent }
		</div>
	);
}