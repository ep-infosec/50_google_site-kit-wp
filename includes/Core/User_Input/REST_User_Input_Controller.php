<?php
/**
 * Class Google\Site_Kit\Core\User_Input\REST_User_Input_Controller
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Class for handling User Input settings rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_User_Input_Controller {

	/**
	 * User_Input instance.
	 *
	 * @since n.e.x.t
	 * @var User_Input
	 */
	protected $user_input;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Input $user_input User_Input instance.
	 */
	public function __construct( User_Input $user_input ) {
		$this->user_input = $user_input;
	}

	/**
	 * Registers functionality.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		return array(
			new REST_Route(
				'core/user/data/user-input-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							return rest_ensure_response( $this->user_input->get_answers() );
						},
						'permission_callback' => $can_authenticate,
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = $request->get_param( 'data' );

							if ( ! isset( $data['settings'] ) || ! is_array( $data['settings'] ) ) {
								return new WP_Error(
									'rest_missing_callback_param',
									__( 'Missing settings data.', 'google-site-kit' ),
									array( 'status' => 400 )
								);
							}

							return rest_ensure_response(
								$this->user_input->set_answers(
									$data['settings']
								)
							);
						},
						'permission_callback' => $can_authenticate,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'      => 'object',
										'required'  => true,
										'questions' => array_fill_keys(
											array_keys( User_Input::get_questions() ),
											array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											)
										),
									),
								),
							),
						),
					),
				)
			),
		);
	}
}
