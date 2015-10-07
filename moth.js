/*:
	@module-license:
		The MIT License (MIT)

		Copyright (c) 2014 Richeve Siodina Bebedor

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.
	@end-module-license

	@module-configuration:
		{
			"packageName": "moth",
			"fileName": "moth.js",
			"moduleName": "moth",
			"className": "Moth",
			"authorName": "Richeve S. Bebedor",
			"authorEMail": "richeve.bebedor@gmail.com",
			"repository": "git@github.com:volkovasystems/moth.git",
			"testCase": "moth-test.js",
			"isGlobal": true
		}
	@end-module-configuration

	@module-documentation:

	@end-module-documentation
*/

if( typeof window == "undefined" ){
	var harden = require( "harden" );
	var _ = require( "lodash" );
	var heredito = require( "heredito" );
	var util = require( "util" );
}

if( typeof window != "undefined" && 
	!( "harden" in window ) )
{
	throw new Error( "harden is not defined" ); 
}

if( typeof window != "undefined" && 
	!( "_" in window ) )
{
	throw new Error( "lodash is not defined" ); 
}

if( typeof window != "undefined" && 
	!( "heredito" in window ) )
{
	throw new Error( "heredito is not defined" ); 
}

//: This is the default stack trace limit for Moth.
if( "stackTraceLimit" in Error ){
	Error.stackTraceLimit = 100;
}

var Moth = function Moth( error, states ){
	/*:
		@meta-configuration:
			{
				"error": [ "string", "object", Error ],
				"states": [ "...", "string", "object", "function", "*" ]	
			}
		@end-meta-configuration
	*/
	states = _( arguments )
		.toArray( )
		.rest( )
		.map( function onEachState( state ){
			if( typeof state == "object" ){
				if( typeof util != "undefined" ){
					return util.inspect( state, { "depth": null } );
				}

				try{
					return JSON.stringify( state );
				
				}catch( error ){
					return _.map( state,
						function onEachProperty( value, key ){
							return [ key, value.toString( ) ].join( ":" );
						} )
						.join( "," );
				}
			
			}else if( typeof state == "function" ){
				return state.toString( );
			
			}else{
				return state.toString( );
			}
		} )
		.value( );

	this.states = states;

	if( error instanceof Error ){
		this.parent.call( error );

		this.state = error.message;

	}else if( typeof error == "object" ){
		if( typeof util != "undefined" ){
			this.state = util.inspect( error, { "depth": null } );

		}else{
			this.state = _.map( error,
				function onEachProperty( value, key ){
					return [ key, value ].join( ":" );
				} )
				.join( "," );	
		}
		
		this.parent.call( this, this.state );

	}else if( typeof error == "string" ){
		this.state = error;

		this.parent.call( this, error );
	
	}else{
		this.state = error.toString( );

		this.parent.call( this, this.state );
	}

	this.traces = _( this.stack.split( /\n\t?/m ) )
		.rest( )
		.map( function onEachTrace( trace ){
			return _( trace.split( "\s" ) )
				.rest( )
				.compact( )
				.value( );
		} )
		.map( function onEachTrace( trace ){
			if( trace.length == 2 ){
				var caller = trace[ 0 ].trim( );

				trace[ 1 ] = trace[ 1 ].replace( /\(|\)/g, "" );
				var traceTokens = trace[ 1 ].split( ":" );

				var file = traceTokens[ 0 ].trim( );
				var line = traceTokens[ 1 ].trim( );
				var index = traceTokens[ 2 ].trim( );

				return {
					"caller": caller,
					"file": file,
					"line": line,
					"index": index,
					"log": trace.join( " " )
				};

			}else if( trace.length == 1 ){
				trace[ 0 ] = trace[ 0 ].replace( /\(|\)/g, "" );
				var traceTokens = trace[ 0 ].split( ":" );

				var file = traceTokens[ 0 ].trim( );
				var line = traceTokens[ 1 ].trim( );
				var index = traceTokens[ 2 ].trim( );

				return {
					"file": file,
					"line": line,
					"index": index,
					"log": trace.join( " " )
				};

			}else{
				return {
					"log": trace.join( " " )
				};
			}
		} );

	this.timestamp = new Date( ).toISOString( );
};

heredito( Moth, Error );

Moth.prototype.getIssue = function getIssue( ){
	var state = this.state;
	var states = this.states;
	var traces = this.traces;
	var timestamp = this.timestamp;

	return {
		"state": state,
		"states": states,
		"traces": traces,
		"timestamp": timestamp
	};
};

harden.bind( Moth )
	( "setStackTraceLimit", 
		function setStackTraceLimit( limit ){
			if( "stackTraceLimit" in Error ){
				Error.stackTraceLimit = limit;
			}
		} );

if( typeof module != "undefined" ){ 
	module.exports = Moth; 
}

if( typeof global != "undefined" ){
	harden
		.bind( Moth )( "globalize", 
			function globalize( ){
				harden.bind( global )( "Moth", Moth );
			} );
}