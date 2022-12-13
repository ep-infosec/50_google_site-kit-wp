/**
 * CoreSiteBannerNotifications Component Stories.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const Template = ( { setupRegistry } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<CoreSiteBannerNotifications />
	</WithRegistrySetup>
);

const delay = 1000; // Needed for fonts to render properly.

const notification1 = {
	id: 'test-notification',
	title: 'Google Analytics 5 Beta',
	content: 'Upgrade to the latest and greatest version of Analytics!',
	ctaURL: '#ga5-upgrade',
	ctaLabel: 'Upgrade to GA5!',
	ctaTarget: '_blank',
	learnMoreURL: '#learn-more',
	learnMoreLabel: 'Learn more',
	dismissible: true,
	dismissLabel: 'Dismiss this message',
};

/**
 * Mocks the response for the notifications endpoint.
 *
 * @since 1.88.0
 *
 * @param {Array} body Notifications response body.
 *
 */
const mockEndpoint = ( body = [] ) => {
	fetchMock.reset();
	fetchMock.getOnce(
		/^\/google-site-kit\/v1\/core\/site\/data\/notifications/,
		{
			body,
			status: 200,
		}
	);
};

/**
 * DashboardCoreSiteAlerts renders notifications after a five second timeout
 * and only if there has been no survey available in that time period.
 *
 * We have several seemingly similar stories and backstop scenarios to catch
 * potential regressions in our render logic.
 *
 * The title 'Not Displayed' in the story indicates the component won't be
 * rendered. For the ones that are 'Displayed', the component renders only AFTER
 * the five second timeout has passed.
 */

export const NotificationCTA = Template.bind( {} );
NotificationCTA.storyName = 'Has Notifications - Displayed';
NotificationCTA.args = {
	setupRegistry: ( registry ) => {
		mockEndpoint( [ notification1 ] );
		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
	},
};
NotificationCTA.scenario = {
	label: 'Global/CoreSiteBannerNotifications1',
	readySelector: '.googlesitekit-publisher-win',
	delay,
};

export const NoNotifications = Template.bind( {} );
NoNotifications.storyName = 'Has No Notifications - Not Displayed';
NoNotifications.args = {
	setupRegistry: ( registry ) => {
		mockEndpoint( [] );
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [], {} );
	},
};
NoNotifications.scenario = {
	label: 'Global/CoreSiteBannerNotifications2',
	delay,
};

export const NotificationCTAWithSurvey = Template.bind( {} );
NotificationCTAWithSurvey.storyName =
	'Has Notifications, and Survey - Not Displayed';
NotificationCTAWithSurvey.args = {
	setupRegistry: ( registry ) => {
		mockEndpoint( [ notification1 ] );
		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
		registry
			.dispatch( CORE_USER )
			.receiveTriggerSurvey(
				{ survey_payload: { ab2: true }, session: {} },
				{ triggerID: 'storybook' }
			);
	},
};
NotificationCTAWithSurvey.scenario = {
	label: 'Global/CoreSiteBannerNotifications3',
	delay,
};

export const NotificationCTAWithSurveyShortDelay = Template.bind( {} );
NotificationCTAWithSurveyShortDelay.storyName =
	'Has Notifications, with Survey in three seconds - Not Displayed';
NotificationCTAWithSurveyShortDelay.args = {
	setupRegistry: ( registry ) => {
		mockEndpoint( [ notification1 ] );
		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
		setTimeout( () => {
			// Remote triggered survey arrives in three seconds, so the notification WILL NOT be displayed.
			registry
				.dispatch( CORE_USER )
				.receiveTriggerSurvey(
					{ survey_payload: { ab2: true }, session: {} },
					{ triggerID: 'storybook' }
				);
		}, 3 * 1000 );
	},
};
NotificationCTAWithSurveyShortDelay.scenario = {
	label: 'Global/CoreSiteBannerNotifications4',
	delay,
};

export const NotificationCTAWithSurveyLongerDelay = Template.bind( {} );
NotificationCTAWithSurveyLongerDelay.storyName =
	'Has Notifications, with Survey in six seconds - Displayed';
NotificationCTAWithSurveyLongerDelay.args = {
	setupRegistry: ( registry ) => {
		mockEndpoint( [ notification1 ] );
		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
		setTimeout( () => {
			// Remote triggered survey arrives after the five second window, so the notification WILL be displayed.
			registry
				.dispatch( CORE_USER )
				.receiveTriggerSurvey(
					{ survey_payload: { ab2: true }, session: {} },
					{ triggerID: 'storybook' }
				);
		}, 6 * 1000 );
	},
};
NotificationCTAWithSurveyLongerDelay.scenario = {
	label: 'Global/CoreSiteBannerNotifications5',
	readySelector: '.googlesitekit-publisher-win',
	delay,
};

export default {
	title: 'Components/CoreSiteBannerNotifications',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
