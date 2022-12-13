/**
 * ErrorHandler Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import ErrorHandler from './';

const ErrorComponent = () => {
	throw new Error(
		'Something bad happened. 💣 (On purpose; ErrorComponent was used to simulate an error.)'
	);
};

const Template = () => (
	<ErrorHandler>
		<ErrorComponent />
	</ErrorHandler>
);

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Global/ErrorHandler',
};

export default {
	title: 'Components/ErrorHandler',
	component: ErrorHandler,
};
