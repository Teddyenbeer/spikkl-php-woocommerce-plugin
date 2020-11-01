/* global spikkl_params */
/* global woocommerce_params */
/* global spikkl_billing_fields */
/* global spikkl_shipping_fields */
jQuery( function ( $ ) {

    if ( typeof spikkl_params === 'undefined' ) {
        return false;
    }

    const DUTCH_POSTCODE_REGEX = new RegExp('');
    const DUTCH_STREET_NUMBER_REGEX = new RegExp('');
    const DUTCH_STREET_NUMBER_SUFFIX_REGEX = new RegExp('');

    const LookupHandler = function ( fields ) {
        this.cache = {};
        this.lookupTimeout = null;

        this.prefix = fields.prefix;

		this.$countryField = $( fields.country + '_field' );
		this.$stateField = $( fields.state + '_field' );
		this.$cityField = $( fields.city + '_field' );
		this.$streetField = $( fields.street + '_field' );
		this.$postcodeField = $( fields.postcode + '_field' );
		this.$streetNumberField = $( fields.street_number + '_field' );
		this.$streetNumberSuffixField = $( fields.street_number_suffix + '_field' );

        this.$country = this.$countryField.find( ':input' );
        this.$state = this.$stateField.find( ':input' );
        this.$city = this.$cityField.find( ':input' );
        this.$street = this.$streetField.find( ':input' );
        this.$postcode = this.$postcodeField.find( ':input' );
        this.$streetNumber = this.$streetNumberField.find( ':input' );
        this.$streetNumberSuffix = this.$streetNumberSuffixField.find( ':input' );

        this.setHelperElements();

        this.$country.on( 'change', () => {

            let selectedCountryCode = this.getSelectedCountryCode();

            this.reorderFields( selectedCountryCode );
            this.listen( selectedCountryCode );
        });

        this.$country.trigger( 'change' );
    };

    LookupHandler.prototype.listen = function ( selectedCountryCode ) {
        const interactionElements = [ this.$postcode, this.$streetNumber, this.$streetNumberSuffix ];

        if ( this.isCountryEligibleForLookup( selectedCountryCode ) ) {
            $.each( interactionElements, ( index, el ) => {

                $( el ).on( 'keyup', this.delayedLookup.bind(this) );
                $( el ).on( 'blur', this.performLookup.bind(this) );

            });

			this.applyFieldsLock();

        } else {
            $.each( interactionElements, ( index, el ) => {
                el.off( 'keyup' );
                el.off( 'blur' );
            });

            this.hardResetFields();
            this.releaseFieldsLock();
        }
    };

    LookupHandler.prototype.applyFieldsLock = function () {
        this.$postcode.attr( 'autocomplete', 'off' );
        this.$postcode.attr( 'maxlength', 7 );

        this.$street.attr( 'readonly', true );
        this.$city.attr( 'readonly', true );
        this.$state.attr( 'readonly', true );

        this.$stateField.addClass( 'spikkl-hidden' );
    };

    LookupHandler.prototype.releaseFieldsLock = function () {
        this.$postcode.removeAttr( 'autocomplete' );
        this.$postcode.removeAttr( 'maxlength' );

        this.$street.removeAttr( 'readonly' );
        this.$city.removeAttr( 'readonly'  );
        this.$state.removeAttr( 'readonly' );

		this.$stateField.removeClass( 'spikkl-hidden' );
    };

    LookupHandler.prototype.softResetFields = function () {
        this.$street.val( '' );
        this.$city.val( '' );
        this.$state.val( '' ).trigger( 'change' );

        if ( typeof this.$spinner !== 'undefined' ) {
            this.$spinner.hide();
        }
    };

    LookupHandler.prototype.hardResetFields = function () {
        this.$postcode.val( '' );
        this.$streetNumber.val( '' );
        this.$streetNumberSuffix.val( '' );

        if ( typeof this.$message !== 'undefined' ) {
            this.$message.hide();
        }

        this.softResetFields();
    };

    LookupHandler.prototype.delayedLookup = function () {
        clearTimeout( this.lookupTimeout );

        this.lookupTimeout = setTimeout( () => {
            this.performLookup();
        }, 350);
    };

    LookupHandler.prototype.performLookup = function () {
        const postcode = this.$postcode.val();
        const streetNumber = this.$streetNumber.val();
        const streetNumberSuffix = this.$streetNumberSuffix.val();

        if ( ! this.isValidPostcode() || ! this.isValidStreetNumber() || ! this.isValidStreetNumberSuffix() ) {
            this.softResetFields();
        } else {
            this.$spinner.show();
            this.$message.hide();

            const params = {
                action: spikkl_params.action,
                postal_code: encodeURIComponent( postcode ),
                street_number: encodeURIComponent( streetNumber ),
                street_number_suffix: encodeURIComponent( streetNumberSuffix ),
            };

            this.cachedGet( params );
        }
    };

    LookupHandler.prototype.cachedGet = function ( params ) {

        const cacheKey = spikkl_params.url + JSON.stringify( Object.values( params ) );

        if ( this.cache.hasOwnProperty( cacheKey ) ) {
            this.fillFields( this.cache[ cacheKey ] );
        } else {
            $.ajax({
                crossDomain: true,
                type: 'GET',
                dataType: 'json',
                timeout: 5 * 1000,
                url: spikkl_params.url,
                data: params,

                success: ( data, textStatus ) => {
                    if ( ! data || textStatus !== 'success' ) {
                        this.fillFields( {
                            status: 'failed',
                            status_code: 'UNAVAILABLE'
                        } );

                        this.releaseFieldsLock();
                        return;
                    }

                    this.cache[ cacheKey ] = data;

                    this.fillFields( data );
                }
            });
        }
    };

    LookupHandler.prototype.fillFields = function ( json ) {
        this.$spinner.hide();

        if ( json.status === 'ok' && json.results.length >= 1) {
            this.$street.val( json.results[0].street_name );
            this.$city.val( json.results[0].city );

            this.$state.val( json.results[0].administrative_areas[0].abbreviation ).trigger('change');
        } else {
            let translatedMessage;

            if ( json.status_code === 'ZERO_RESULTS') {
                translatedMessage = spikkl_params.errors.invalid_address;
            }

            if ( json.status_code === 'INVALID_REQUEST' ) {
                translatedMessage = spikkl_params.errors.invalid_postal_code_or_street_number;
            }

            if ( json.status_code === 'UNAVAILABLE' || json.status_code === 'ACCESS_RESTRICTED' ) {
                translatedMessage = spikkl_params.errors.unknown_error;

                this.releaseFieldsLock();
            }

            this.softResetFields();

            this.$message.empty().append( '<li>' + translatedMessage + '</li>' );
            this.$message.show();
        }
    };

    LookupHandler.prototype.isValidPostcode = function () {
        const postcode = this.$postcode.val();

        if ( postcode === null || postcode === '' ) {
            return false;
        }

        if ( DUTCH_POSTCODE_REGEX.test( postcode ) ) {
            return true;
        } else {
            this.$message.empty().append( '<li>' + spikkl_params.errors.invalid_postal_code + '</li>' );
            this.$message.show();
        }

        return false;
    };

    LookupHandler.prototype.isValidStreetNumber = function () {
        const streetNumber = this.$streetNumber.val();

        if ( streetNumber === null || streetNumber === '' ) {
            return false;
        }

        if ( DUTCH_STREET_NUMBER_REGEX.test( streetNumber ) ) {
            return true;
        } else {
            this.$message.empty().append( '<li>' + spikkl_params.errors.invalid_street_number + '</li>' );
            this.$message.show();
        }

        return false;
    };

    LookupHandler.prototype.isValidStreetNumberSuffix = function () {
        const streetNumberSuffix = this.$streetNumberSuffix.val();


        if ( DUTCH_STREET_NUMBER_SUFFIX_REGEX.test( streetNumberSuffix ) ) {
            return true;
        } else {
            this.$message.empty().append( '<li>' + spikkl_params.errors.invalid_street_number_suffix + '</li>' );
            this.$message.show();
        }

        return false;
    };

    LookupHandler.prototype.setHelperElements = function () {
        this.$spinner = $( '<div>', {
            id: 'spikkl-' + this.prefix + '-spinner',
            class: 'spikkl-loader',
            style: 'display:none;'
        });

        this.$message = $( '<ul>', {
            id: 'spikkl-' + this.prefix + '-message',
            class: 'woocommerce-error',
            style: 'display:none;'
        });

        this.$postcode.after( this.$spinner );
        this.$postcode.before( this.$message );
    };

    LookupHandler.prototype.reorderFields = function ( selectedCountryCode ) {
        const $streetNumberContainer = this.$streetNumber.closest( 'p.form-row' );
        const $streetNumberSuffixContainer = this.$streetNumberSuffix.closest( 'p.form-row' );

        if ( this.isCountryEligibleForLookup( selectedCountryCode ) ) {

            this.createStreetNumberLabel();

            $streetNumberContainer
                .removeClass( 'form-row-wide' )
                .addClass( 'form-row-first' );

            $streetNumberSuffixContainer.show();
        } else {
            $streetNumberContainer
                .removeClass( 'form-row-first' )
                .addClass( 'form-row-wide' );

            $streetNumberSuffixContainer.hide();

            $streetNumberContainer.find( 'label' ).remove();
        }
    };

    LookupHandler.prototype.createStreetNumberLabel = function () {
        const id = this.$streetNumber.attr('id');
        const required = woocommerce_params.i18n_required_text !== 'undefined' ? woocommerce_params.i18n_required_text : 'required';
        const tip = '<abbr title="' + required + '" class="required"> * </abbr>';

        const $label = $( 'label[for="' + id + '"]' );

        if ( ! $label.length ) {
            this.$streetNumber.before( '<label for="' + id + '">' + spikkl_params.street_number_label + tip + '</label>' );
        } else if ( ! $( 'label[for="' + id  + '"] > abbr' ).length ) {
            $label.append( tip );
        }
    };

    LookupHandler.prototype.getSelectedCountryCode = function () {
        return $( this.$country.selector + ' :selected' ).val().trim();
    };

    LookupHandler.prototype.isCountryEligibleForLookup = function ( selectedCountryCode ) {
        selectedCountryCode = selectedCountryCode || this.getSelectedCountryCode();

        return spikkl_params.supported_countries.indexOf( selectedCountryCode ) >= 0;
    };


	$( document.body ).bind('wc_address_i18n_ready', function () {
		/**
		 * Init LookupHandler when billing fields are set.
		 */
		if ( typeof spikkl_billing_fields !== 'undefined' ) {
			new LookupHandler( spikkl_billing_fields );
		}

		/**
		 * Init LookupHandler when billing fields are set.
		 */
		if ( typeof spikkl_shipping_fields !== 'undefined' ) {
			new LookupHandler( spikkl_shipping_fields );
		}
	});

});