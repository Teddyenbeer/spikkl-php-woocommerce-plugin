<?php

/**
 * Spikkl Address Lookup
 *
 * @package Spikkl Address Lookup
 * @author Spikkl
 */

?>

<div class="wrap">

    <h1><?php echo vsprintf( '<h1>%s</h1>', array( __( 'Spikkl Address Lookup Settings', 'spikkl' ) ) )?></h1>

    <form method="post" action="options.php">
        <?php settings_fields( 'spikkl_settings_group' ); ?>
        <?php echo wp_nonce_field( 'spikkl_submit', 'spikkl_nonce', true, false ); ?>

        <p><?php vprintf( __( 'In order to use the Spikkl Address Lookup service, you must have an account. If you do not have an account already, <a href="%s" target="_blank">signup</a> and copy the API key provided.', 'spikkl' ), array( 'https://www.spikkl.nl/signup' ) ); ?></p>

        <table class="form-table" role="presentation">
            <tbody>

                <tr class="option-lookup-enabled">
                    <th scope="row"><?php _e( 'Default settings', 'spikkl' ); ?></th>
                    <td>
                        <fieldset>
                            <legend class="screen-reader-text">
                                <span><?php _e( 'Default settings', 'spikkl' ); ?></span>
                            </legend>
                            <label for="spikkl_settings_is_enabled">
                                <input name="spikkl_settings[is_enabled]" type="checkbox" id="spikkl_settings_is_enabled" value="1" <?php checked( true, $this->_settings->is_enabled() ); ?> >
                                <span><?php _e( 'Lookup enabled', 'spikkl' ); ?></span>
                            </label>
                            <br/>
                            <p class="description"><?php _e( 'Enable address lookup for billing and checkout address for supported countries.', 'spikkl' ); ?></p>
                        </fieldset>
                    </td>
                </tr>

                <tr>
                    <th scope="row"> </th>
                    <td>
                        <input name="spikkl_settings[api_key]" type="text" id="spikkl_settings_api_key" value="<?php echo esc_attr($this->_settings->get_api_key()); ?>" class="regular-text ltr">
                        <br/>
                        <p class="description">
                            <?php _e( 'The Spikkl API key should be 32 characters long and consist of alpha numeric characters. An API key is required to enable the service.', 'spikkl' ); ?>
                        </p>
                    </td>
                </tr>

            </tbody>
        </table>

        <p class="submit">
            <?php submit_button(); ?>
        </p>
    </form>
</div>