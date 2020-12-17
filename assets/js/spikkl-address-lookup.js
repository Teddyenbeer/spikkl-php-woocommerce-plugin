/* global spikkl_params */
/* global woocommerce_params */
/* global spikkl_billing_fields */
/* global spikkl_shipping_fields */
jQuery( function ( $ ) {

	if ( typeof spikkl_params === 'undefined' ) {
		return false;
	}

	const DUTCH_POSTCODE_REGEX = new RegExp('^[1-9][0-9]{3}\\s*(?!sa|sd|ss)[a-z]{2}$', 'i');
	const DUTCH_STREET_NUMBER_REGEX = new RegExp('^[0-9]{1,5}$');
	const DUTCH_STREET_NUMBER_SUFFIX_REGEX = new RegExp('^(?:[a-z])?(?:\\s?[a-z0-9]{1,4})?$', 'i');

	const LookupHandler = function ( fields ) {
		this.cache = {};

		this.xhr = null;
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

			this.$postcode.on( 'keyup blur', this.debounce( this.validatePostcode, 250 ) );
			this.$streetNumber.on( 'keyup blur', this.debounce( this.validateStreetNumber, 250 ) );
			this.$streetNumberSuffix.on( 'keyup blur', this.debounce( this.validateStreetNumberSuffix, 250 ) );

			$.each( interactionElements, ( index, el ) => {

				$( el ).on( 'keyup', this.debounce(this.performLookup, 450) );
			});

			this.applyFieldsLock();

		} else {
			$.each( interactionElements, ( index, el ) => {
				el.off( 'keyup' );
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
			this.stopLoading()
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

	LookupHandler.prototype.debounce = function (func, wait = 450) {
		let timeout;
		const context = this;

		return function () {
			const delay = function () {
				timeout = null;
				func.apply(context);
			}

			clearTimeout(timeout);

			timeout = setTimeout(delay, wait);
		};
	};

	LookupHandler.prototype.performLookup = function () {
		if (
			! this.isValidPostcode() ||
			! this.isValidStreetNumber() ||
			! this.isValidStreetNumberSuffix()
		) {
			this.softResetFields();

			return;
		}

		const postcode = this.$postcode.val();
		const streetNumber = this.$streetNumber.val();
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		this.startLoading();

		this.$message.hide();

		const params = {
			action: spikkl_params.action,
			postal_code: encodeURIComponent( postcode ),
			street_number: encodeURIComponent( streetNumber ),
			street_number_suffix: encodeURIComponent( streetNumberSuffix ),
		};

		this.cachedGet( params );
	};

	LookupHandler.prototype.cachedGet = function ( params ) {

		const cacheKey = spikkl_params.url + JSON.stringify( Object.values( params ) );

		if (this.xhr) {
			this.xhr.abort();
		}

		if ( this.cache.hasOwnProperty( cacheKey ) ) {
			this.fillFields( this.cache[ cacheKey ] );
		} else {
			this.xhr = $.ajax({
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

	LookupHandler.prototype.startLoading = function () {
		this.$spinner.show();

		this.$postcode.attr('disabled', true);
		this.$streetNumber.attr('disabled', true);
		this.$streetNumberSuffix.attr('disabled', true);
	}

	LookupHandler.prototype.stopLoading = function () {
		this.$spinner.hide();

		this.$postcode.attr('disabled', false);
		this.$streetNumber.attr('disabled', false);
		this.$streetNumberSuffix.attr('disabled', false);
	}

	LookupHandler.prototype.fillFields = function ( json ) {
		this.stopLoading();

		if ( json.status === 'ok' && json.results.length >= 1) {
			this.$postcode.val( json.results[0].postal_code );
			this.$streetNumber.val( json.results[0].street_number );
			this.$streetNumberSuffix.val( json.results[0].street_number_suffix );

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

	LookupHandler.prototype.validatePostcode = function () {
		const postcode = this.$postcode.val();

		if ( postcode === null || postcode === '' ) {
			return false;
		}

		if ( DUTCH_POSTCODE_REGEX.test( postcode ) ) {
			this.$postcodeField.removeClass('woocommerce-invalid');
		} else {
			this.$postcodeField.addClass('woocommerce-invalid');
		}

		return false;
	}

	LookupHandler.prototype.validateStreetNumber = function () {
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
	}

	LookupHandler.prototype.validateStreetNumberSuffix = function () {
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		if ( DUTCH_STREET_NUMBER_SUFFIX_REGEX.test( streetNumberSuffix ) ) {
			this.$streetNumberSuffixField.removeClass('woocommerce-invalid');
			return true;
		} else {
			this.$streetNumberSuffixField.addClass('woocommerce-invalid');
		}

		return false;
	};

	LookupHandler.prototype.isValidPostcode = function () {
		const postcode = this.$postcode.val();

		return postcode !== null && postcode !== '' && DUTCH_POSTCODE_REGEX.test( postcode );
	};

	LookupHandler.prototype.isValidStreetNumber = function () {
		const streetNumber = this.$streetNumber.val();

		return streetNumber !== null && streetNumber !== '' && DUTCH_STREET_NUMBER_REGEX.test( streetNumber );
	};

	LookupHandler.prototype.isValidStreetNumberSuffix = function () {
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		return DUTCH_STREET_NUMBER_SUFFIX_REGEX.test( streetNumberSuffix );
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
		if ( this.isCountryEligibleForLookup( selectedCountryCode ) ) {
			this.$streetNumberField.show();
			this.$streetNumberSuffixField.show();
		} else {
			this.$streetNumberField.hide();
			this.$streetNumberSuffixField.hide();
		}
	};

	LookupHandler.prototype.getSelectedCountryCode = function () {
		return this.$country.val().trim();
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