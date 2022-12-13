/**
 * User Input Question Wrapper.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Row, Cell } from '../../material-components';
import UserInputQuestionInfo from './UserInputQuestionInfo';
import ErrorNotice from '../ErrorNotice';
import CancelUserInputButton from './CancelUserInputButton';
import Link from '../Link';
const { useSelect } = Data;

export default function UserInputQuestionWrapper( props ) {
	const {
		children,
		slug,
		isActive,
		questionNumber,
		title,
		description,
		next,
		nextLabel,
		back,
		backLabel,
		error,
		allowEmptyValues,
	} = props;

	const values = useSelect(
		( select ) => select( CORE_USER ).getUserInputSetting( slug ) || []
	);
	const scope = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettingScope( slug )
	);
	const author = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettingAuthor( slug )
	);

	// We have two different behaviors for user input settings screens:
	//
	//   1. When a user is on one of the first four screens - we SHOULD disable the Next button
	//      if a user checks the "Other" checkbox and enters nothing into the text field. In other
	//      words we should disable the Next button if the values array contains at least one empty value.
	//
	//   2. When a user is on the last 5th screen (search terms) - we SHOULD NOT disable the next
	//      button if at least one search term is entered. In other words we should disable the next
	//      button only when all values are empty strings.
	//
	const hasInvalidValues = allowEmptyValues
		? // Consider the values array invalid if it contains all values empty.
		  values.filter( ( value ) => value.trim().length > 0 ).length === 0
		: // Consider the values array invalid if it contains at least one value that is empty.
		  values.some( ( value ) => value.trim().length === 0 );

	return (
		<div
			className={ classnames( 'googlesitekit-user-input__question', {
				'googlesitekit-user-input__question--active': isActive,
				'googlesitekit-user-input__question--next': ! isActive,
			} ) }
		>
			<div className="googlesitekit-user-input__question-contents">
				<Row>
					<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
						<Row>
							{ title && (
								<UserInputQuestionInfo
									title={ title }
									description={ description }
									scope={ scope }
									questionNumber={ questionNumber }
									author={ author }
								/>
							) }

							{ children }
						</Row>

						{ error && <ErrorNotice error={ error } /> }
					</Cell>
				</Row>
			</div>
			{ isActive && (
				<div className="googlesitekit-user-input__footer googlesitekit-user-input__buttons">
					<div className="googlesitekit-user-input__footer-nav">
						{ next && (
							<Button
								className="googlesitekit-user-input__buttons--next"
								onClick={ next }
								disabled={
									values.length === 0 || hasInvalidValues
								}
							>
								{ nextLabel || __( 'Next', 'google-site-kit' ) }
							</Button>
						) }
						{ back && (
							<Link
								className="googlesitekit-user-input__buttons--back"
								onClick={ back }
							>
								{ backLabel || __( 'Back', 'google-site-kit' ) }
							</Link>
						) }
					</div>
					<div className="googlesitekit-user-input__footer-cancel">
						<CancelUserInputButton />
					</div>
				</div>
			) }
		</div>
	);
}

UserInputQuestionWrapper.propTypes = {
	slug: PropTypes.string.isRequired,
	questionNumber: PropTypes.number.isRequired,
	children: PropTypes.node,
	isActive: PropTypes.bool,
	title: PropTypes.string,
	description: PropTypes.string,
	next: PropTypes.func,
	nextLabel: PropTypes.string,
	back: PropTypes.func,
	backLabel: PropTypes.string,
	error: PropTypes.object,
	allowEmptyValues: PropTypes.bool,
};

UserInputQuestionWrapper.defaultProps = {
	allowEmptyValues: false,
};
