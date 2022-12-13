/**
 * `modules/analytics-4` data store: webdatastreams tests.
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
import pick from 'lodash/pick';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 webdatastreams', () => {
	let registry;

	const createWebDataStreamsEndpoint =
		/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/create-webdatastream/;
	const webDataStreamsEndpoint =
		/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/webdatastreams/;
	const webDataStreamsBatchEndpoint =
		/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/webdatastreams-batch/;
	const webDataStreamDotCom = {
		name: 'properties/1000/dataStreams/2000',
		webStreamData: {
			measurementId: '1A2BCD345E', // eslint-disable-line sitekit/acronym-case
			defaultUri: 'http://example.com', // eslint-disable-line sitekit/acronym-case
		},
		createTime: '2014-10-02T15:01:23Z',
		updateTime: '2014-10-02T15:01:23Z',
		displayName: 'Test GA4 WebDataStream',
	};

	const webDataStreamDotOrg = {
		name: 'properties/1000/dataStreams/2001',
		webStreamData: {
			measurementId: '1A2BCD346E', // eslint-disable-line sitekit/acronym-case
			defaultUri: 'http://example.org', // eslint-disable-line sitekit/acronym-case
		},
		createTime: '2014-10-03T15:01:23Z',
		updateTime: '2014-10-03T15:01:23Z',
		displayName: 'Another datastream',
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'createWebDataStream', () => {
			it( 'should create a web datastream and add it to the store', async () => {
				const propertyID = '12345';

				fetchMock.post( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createWebDataStream( propertyID );
				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: {
								propertyID,
							},
						},
					}
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( webdatastreams ).toMatchObject( [
					fixtures.createWebDataStream,
				] );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const propertyID = '12345';
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( createWebDataStreamsEndpoint, {
					body: response,
					status: 500,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createWebDataStream( propertyID );

				const error = registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForAction( 'createWebDataStream', [ propertyID ] );
				expect( error ).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received webdatastreams
				// taken from `response.webDataStreams` are required to be an array.
				freezeFetch( webDataStreamsEndpoint );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				// No webdatastreams should have been added yet, as the property creation failed.
				expect( webdatastreams ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'matchWebDataStream', () => {
			const propertyID = '1234';

			beforeEach( () => {
				provideSiteInfo( registry );
			} );

			it( 'should return NULL if no matching web data stream is found', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( [ webDataStreamDotOrg ], {
						propertyID,
					} );

				const webDataStream = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchWebDataStream( propertyID );
				expect( webDataStream ).toBeNull();
			} );

			it( 'should return a web data stream if we find a matching one', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams(
						[ webDataStreamDotCom, webDataStreamDotOrg ],
						{ propertyID }
					);

				const webDataStream = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchWebDataStream( propertyID );
				expect( webDataStream ).toMatchObject( webDataStreamDotCom );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWebDataStreams', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( webDataStreamsEndpoint, {
					body: fixtures.webDataStreams,
					status: 200,
				} );

				const propertyID = '12345';
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( initialDataStreams ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreams( propertyID );
				expect( fetchMock ).toHaveFetched( webDataStreamsEndpoint, {
					query: { propertyID },
				} );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( webdatastreams ).toEqual( fixtures.webDataStreams );
				expect( webdatastreams ).toHaveLength(
					fixtures.webDataStreams.length
				);
			} );

			it( 'should not make a network request if webdatastreams for this account are already present', () => {
				const testPropertyID = '12345';
				const propertyID = testPropertyID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( testPropertyID );
				expect( webdatastreams ).toEqual( fixtures.webDataStreams );
				expect( webdatastreams ).toHaveLength(
					fixtures.webDataStreams.length
				);
				expect( fetchMock ).not.toHaveFetched( webDataStreamsEndpoint );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( webDataStreamsEndpoint, {
					body: response,
					status: 500,
				} );

				const fakePropertyID = '777888999';
				registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( fakePropertyID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreams( fakePropertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( fakePropertyID );
				expect( webdatastreams ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getMatchingWebDataStream', () => {
			const webDataStreams = [ webDataStreamDotCom, webDataStreamDotOrg ];
			const propertyID = '12345';

			it( 'should return undefined if web data streams arent loaded yet', () => {
				freezeFetch( webDataStreamsEndpoint );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStream( propertyID );
				expect( datastream ).toBeUndefined();
			} );

			it( 'should return NULL when no datastreams are matched', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.net',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, { propertyID } );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStream( propertyID );
				expect( datastream ).toBeNull();
			} );

			it( 'should return the correct datastream when reference site URL matches exactly', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, { propertyID } );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStream( propertyID );
				expect( datastream ).toEqual( webDataStreamDotCom );
			} );

			it.each( [
				[ 'protocol differences', 'https://example.org' ],
				[ '"www." prefix', 'http://www.example.org' ],
				[ 'trailing slash', 'https://www.example.org/' ],
			] )(
				'should return the correct datastream ignoring %s',
				( _, referenceSiteURL ) => {
					provideSiteInfo( registry, { referenceSiteURL } );
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetWebDataStreams( webDataStreams, {
							propertyID,
						} );

					const datastream = registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStream( propertyID );
					expect( datastream ).toEqual( webDataStreamDotOrg );
				}
			);
		} );

		describe( 'getWebDataStreamsBatch', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( webDataStreamsBatchEndpoint, {
					body: fixtures.webDataStreamsBatch,
					status: 200,
				} );

				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual( {} );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( webdatastreams ).toEqual(
					fixtures.webDataStreamsBatch
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should make a network request with property IDs that are not loaded yet', async () => {
				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );

				fetchMock.get( webDataStreamsBatchEndpoint, {
					body: pick(
						fixtures.webDataStreamsBatch,
						propertyIDs.slice( 1 )
					),
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams(
						fixtures.webDataStreamsBatch[ propertyIDs[ 0 ] ],
						{
							propertyID: propertyIDs[ 0 ],
						}
					);

				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual(
					pick(
						fixtures.webDataStreamsBatch,
						propertyIDs.slice( 0, 1 )
					)
				);

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( webdatastreams ).toEqual(
					fixtures.webDataStreamsBatch
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if webdatastreams for the selected properties are already present', () => {
				for ( const [ propertyID, webdatastreams ] of Object.entries(
					fixtures.webDataStreamsBatch
				) ) {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetWebDataStreams( webdatastreams, {
							propertyID,
						} );
				}

				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual(
					fixtures.webDataStreamsBatch
				);
				expect( fetchMock ).not.toHaveFetched(
					webDataStreamsBatchEndpoint
				);
			} );

			it( 'should send multiple request if propertyIDs array has more than 10 items', async () => {
				const propertyIDs = [];
				const allDataStreams = {};
				const firstBatch = {};
				const secondBatch = {};

				for ( let i = 0; i < 15; i++ ) {
					const propertyID = `${ 1000 + i }`;
					const datastream = {
						_id: `${ 2000 + i }`,
						_propertyID: propertyID,
					};

					propertyIDs.push( propertyID );

					allDataStreams[ propertyID ] = datastream;
					if ( i < 10 ) {
						firstBatch[ propertyID ] = datastream;
					} else {
						secondBatch[ propertyID ] = datastream;
					}
				}

				const responses = [ firstBatch, secondBatch ];
				fetchMock.get( webDataStreamsBatchEndpoint, () => {
					return { body: responses.pop() };
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getWebDataStreamsBatch( propertyIDs )
				).toEqual( {} );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getWebDataStreamsBatch( propertyIDs )
				).toEqual( allDataStreams );

				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );
		} );

		describe( 'getMatchedMeasurementIDsByPropertyIDs', () => {
			it( 'should return null if the properties are empty', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchedMeasurementIDsByPropertyIDs( [] )
				).toBeNull();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchedMeasurementIDsByPropertyIDs( null )
				).toBeNull();
			} );

			it( 'should return an empty object if the properties are not matched', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: fixtures.properties.map(
								( { _id } ) => _id
							),
						}
					);

				const matchedProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchedMeasurementIDsByPropertyIDs( [
						{
							_id: '1100',
							_accountID: '100',
							name: 'properties/1100',
						},
					] );
				expect( matchedProperties ).toEqual( {} );
			} );

			it( 'should return an object with matched property id as the key and measurement id as the value', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: fixtures.properties.map(
								( { _id } ) => _id
							),
						}
					);

				const matchedProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchedMeasurementIDsByPropertyIDs(
						fixtures.properties
					);
				expect( matchedProperties ).toEqual( {
					1000: '1A2BCD345E',
					1001: '155BC2366E',
				} );
			} );

			it( 'should skip matching if the property id is not found in the property object', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: fixtures.properties.map(
								( { _id } ) => _id
							),
						}
					);

				const matchedProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchedMeasurementIDsByPropertyIDs( [
						...fixtures.properties,
						// Add an object that does not have the _id property.
						// Hence, it should be skipped from the matching.
						{
							_accountID: '100',
							name: 'properties/1100',
						},
					] );
				expect( matchedProperties ).toEqual( {
					1000: '1A2BCD345E',
					1001: '155BC2366E',
				} );
			} );
		} );
	} );
} );
