/**
 * WPDashboardWidgets component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import WPDashboardImpressions from './WPDashboardImpressions';
import WPDashboardClicks from './WPDashboardClicks';
import WPDashboardUniqueVisitors from './WPDashboardUniqueVisitors';
import WPDashboardSessionDuration from './WPDashboardSessionDuration';
import WPDashboardPopularPages from './WPDashboardPopularPages';
import WPDashboardIdeaHub from './WPDashboardIdeaHub';
import WPDashboardActivateAnalyticsCTA from './WPDashboardActivateAnalyticsCTA';
import WPDashboardUniqueVisitorsChartWidget from './WPDashboardUniqueVisitorsChartWidget';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util/get-widget-component-props';
const { useSelect } = Data;

// Widget slugs.
const WIDGET_IMPRESSIONS = 'wpDashboardImpressions';
const WIDGET_CLICKS = 'wpDashboardClicks';
const WIDGET_VISITORS = 'wpDashboardUniqueVisitors';
const WIDGET_SESSION_DURATION = 'wpDashboardSessionDuration';
const WIDGET_POPULAR_PAGES = 'wpDashboardPopularPages';

// Search Console widgets.
const WPDashboardImpressionsWidget = withWidgetComponentProps(
	WIDGET_IMPRESSIONS
)( WPDashboardImpressions );
const WPDashboardClicksWidget =
	withWidgetComponentProps( WIDGET_CLICKS )( WPDashboardClicks );

// Analytics Widgets.
const WPDashboardUniqueVisitorsWidget = withWidgetComponentProps(
	WIDGET_VISITORS
)( WPDashboardUniqueVisitors );
const WPDashboardSessionDurationWidget = withWidgetComponentProps(
	WIDGET_SESSION_DURATION
)( WPDashboardSessionDuration );
const WPDashboardPopularPagesWidget = withWidgetComponentProps(
	WIDGET_POPULAR_PAGES
)( WPDashboardPopularPages );

const WPDashboardWidgets = () => {
	const analyticsModule = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'analytics' )
	);
	const analyticsModuleActive = analyticsModule?.active;
	const analyticsModuleConnected = analyticsModule?.connected;
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	if ( analyticsModule === undefined ) {
		return null;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-wp-dashboard-stats googlesitekit-wp-dashboard-stats--twoup',
				{
					'googlesitekit-wp-dashboard-stats--fourup':
						analyticsModuleActive && analyticsModuleConnected,
				}
			) }
		>
			<WPDashboardIdeaHub />

			{ analyticsModuleActiveAndConnected && (
				<Fragment>
					<WPDashboardUniqueVisitorsWidget />
					<WPDashboardSessionDurationWidget />
				</Fragment>
			) }

			<WPDashboardImpressionsWidget />
			<WPDashboardClicksWidget />

			{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
				<div className="googlesitekit-wp-dashboard-stats__cta">
					<WPDashboardActivateAnalyticsCTA />
				</div>
			) }

			{ analyticsModuleActiveAndConnected && (
				<Fragment>
					<WPDashboardUniqueVisitorsChartWidget />
					<WPDashboardPopularPagesWidget />
				</Fragment>
			) }
		</div>
	);
};

export default WPDashboardWidgets;
