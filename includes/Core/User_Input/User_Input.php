<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Input
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_Error;
use WP_User;

/**
 * Class for handling User Input settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Input {

	/**
	 * Site_Specific_Answers instance.
	 *
	 * @since n.e.x.t
	 * @var Site_Specific_Answers
	 */
	protected $site_specific_answers;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * User_Specific_Answers instance.
	 *
	 * @since n.e.x.t
	 * @var User_Specific_Answers
	 */
	protected $user_specific_answers;

	/**
	 * REST_User_Input_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_User_Input_Controller
	 */
	protected $rest_controller;

	/**
	 * User Input questions.
	 *
	 * @since n.e.x.t
	 * @var array|ArrayAccess
	 */
	private static $questions = array(
		'purpose'       => array(
			'scope' => 'site',
		),
		'postFrequency' => array(
			'scope' => 'user',
		),
		'goals'         => array(
			'scope' => 'user',
		),
	);

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context         Plugin context.
	 * @param Options      $options         Optional. Options instance. Default a new instance.
	 * @param User_Options $user_options    Optional. User_Options instance. Default a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null
	) {
		$this->site_specific_answers = new Site_Specific_Answers( $options ?: new Options( $context ) );
		$this->user_options          = $user_options ?: new User_Options( $context );
		$this->user_specific_answers = new User_Specific_Answers( $this->user_options );
		$this->rest_controller       = new REST_User_Input_Controller( $this );
	}

	/**
	 * Registers functionality.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->site_specific_answers->register();
		$this->user_specific_answers->register();
		$this->rest_controller->register();
	}

	/**
	 * Gets the set of user input questions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The user input questions.
	 */
	public static function get_questions() {
		return static::$questions;
	}

	/**
	 * Gets user input answers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|WP_Error User input answers.
	 */
	public function get_answers() {
		$questions = static::$questions;
		$settings  = array_merge(
			$this->site_specific_answers->get(),
			$this->user_specific_answers->get()
		);

		// If there are no settings, return default empty values.
		if ( empty( $settings ) ) {
			array_walk(
				$questions,
				function ( &$question ) {
					$question['values'] = array();
				}
			);

			return $questions;
		}

		foreach ( $settings as &$setting ) {
			if ( ! isset( $setting['answeredBy'] ) ) {
				continue;
			}

			$answered_by = intval( $setting['answeredBy'] );
			unset( $setting['answeredBy'] );

			if ( ! $answered_by || $answered_by === $this->user_options->get_user_id() ) {
				continue;
			}

			$setting['author'] = array(
				'photo' => get_avatar_url( $answered_by ),
				'login' => ( new WP_User( $answered_by ) )->user_login,
			);
		}

		// If there are un-answered questions, return default empty values for them.
		foreach ( $questions as $question_key => $question_value ) {
			if ( ! isset( $settings[ $question_key ] ) ) {
				$settings[ $question_key ]           = $question_value;
				$settings[ $question_key ]['values'] = array();
			}
		}

		return $settings;
	}

	/**
	 * Determines whether the current user input settings have empty values or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The settings to check.
	 * @return boolean|null TRUE if at least one of the settings has empty values, otherwise FALSE.
	 */
	public function are_settings_empty( $settings = array() ) {
		if ( empty( $settings ) ) {
			$settings = $this->get_answers();

			if ( is_wp_error( $settings ) ) {
				return null;
			}
		}

		foreach ( $settings as $setting ) {
			if ( empty( $setting['values'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets user input answers.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings User settings.
	 * @return array|WP_Error User input answers.
	 */
	public function set_answers( $settings ) {
		$site_settings = array();
		$user_settings = array();

		foreach ( $settings as $setting_key => $answers ) {
			$setting_data           = array();
			$setting_data['values'] = $answers;
			$setting_data['scope']  = static::$questions[ $setting_key ]['scope'];

			if ( 'site' === $setting_data['scope'] ) {
				$setting_data['answeredBy']    = $this->user_options->get_user_id();
				$site_settings[ $setting_key ] = $setting_data;
			} elseif ( 'user' === $setting_data['scope'] ) {
				$user_settings[ $setting_key ] = $setting_data;
			}
		}

		$this->site_specific_answers->set( $site_settings );
		$this->user_specific_answers->set( $user_settings );

		$updated_settings = $this->get_answers();
		$is_empty         = $this->are_settings_empty( $updated_settings );

		/**
		 * Fires when the User Input answers are set.
		 *
		 * @since n.e.x.t
		 *
		 * @param bool $is_empty If at least one of the answers has empty values.
		 */
		do_action( 'googlesitekit_user_input_set', $is_empty );

		return $updated_settings;
	}
}
