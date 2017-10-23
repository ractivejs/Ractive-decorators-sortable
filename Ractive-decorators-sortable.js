/*

	Ractive-decorators-sortable
	===========================

	Version 0.2.1.

	This plugin adds a 'sortable' decorator to Ractive, which enables
	elements that correspond to array members to be re-ordered using
	the HTML5 drag and drop API. Doing so will update the order
	of the array.

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'Ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive-decorators-sortable.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'Ractive-decorators-sortable' );

	Then use the decorator like so:

	    <!-- template -->
	    <ul>
	      {{#list}}
	        <li decorator='sortable'>{{.}}</li>
	      {{/list}}
	    </ul>

	    var ractive = new Ractive({
	      el: myContainer,
	      template: myTemplate,
	      data: { list: [ 'Firefox', 'Chrome', 'Internet Explorer', 'Opera', 'Safari', 'Maxthon' ] }
	    });

	When the user drags the source element over a target element, the
	target element will have a class name added to it. This allows you
	to render the target differently (e.g. hide the text, add a dashed
	border, whatever). By default this class name is 'droptarget'.

	You can configure the class name like so:

	    Ractive.decorators.sortable.targetClass = 'aDifferentClassName';

	PS for an entertaining rant about the drag and drop API, visit
	http://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html

*/

var sortableDecorator = (function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'Ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'Ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive-decorators-sortable plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

	var sortable,
		ractive,
		sourceKeypath,
		sourceArray,
		dragstartHandler,
		dragenterHandler,
		removeTargetClass,
		preventDefault,
		errorMessage;

	sortable = function ( node ) {
		node.draggable = true;

		node.addEventListener( 'dragstart', dragstartHandler, false );
		node.addEventListener( 'dragenter', dragenterHandler, false );
		node.addEventListener( 'dragleave', removeTargetClass, false );
		node.addEventListener( 'drop', removeTargetClass, false );

		// necessary to prevent animation where ghost element returns
		// to its (old) home
		node.addEventListener( 'dragover', preventDefault, false );

		return {
			teardown: function () {
				node.removeEventListener( 'dragstart', dragstartHandler, false );
				node.removeEventListener( 'dragenter', dragenterHandler, false );
				node.removeEventListener( 'dragleave', removeTargetClass, false );
				node.removeEventListener( 'drop', removeTargetClass, false );
				node.removeEventListener( 'dragover', preventDefault, false );
			}
		};
	};

	sortable.targetClass = 'droptarget';

	errorMessage = 'The sortable decorator only works with elements that correspond to array members';

	dragstartHandler = function ( event ) {
		var context = Ractive.getContext(this);

		sourceKeypath = context.resolve();
		sourceArray = context.resolve('../');

		if ( !Array.isArray(context.get('../')) ) {
			throw new Error( errorMessage );
		}

		event.dataTransfer.setData( 'foo', true ); // enables dragging in FF. go figure

		// keep a reference to the Ractive instance that 'owns' this data and this element
		ractive = context.ractive;
	};

	dragenterHandler = function () {
		var targetKeypath, targetArray, array, source, context;

		context = Ractive.getContext(this);

		// If we strayed into someone else's territory, abort
		if ( context.ractive !== ractive ) {
			return;
		}

		targetKeypath = context.resolve();
		targetArray = context.resolve('../');

		// if we're dealing with a different array, abort
		if ( targetArray !== sourceArray ) {
			return;
		}

		// if it's the same index, add droptarget class then abort
		if ( targetKeypath === sourceKeypath ) {
			this.classList.add( sortable.targetClass );
			return;
		}

		// remove source from array
		source = ractive.get(sourceKeypath);
		array = Ractive.splitKeypath(sourceKeypath);

		ractive.splice( targetArray, array[ array.length - 1 ], 1 );

		// the target index is now the source index...
		sourceKeypath = targetKeypath;

		array = Ractive.splitKeypath(sourceKeypath);

		// add source back to array in new location
		ractive.splice( targetArray, array[ array.length - 1 ], 0, source );
	};

	removeTargetClass = function () {
		this.classList.remove( sortable.targetClass );
	};

	preventDefault = function ( event ) { event.preventDefault(); };

	Ractive.decorators.sortable = sortable;

	return sortable;
}));

// Common JS (i.e. browserify) environment
if ( typeof module !== 'undefined' && module.exports) {
	module.exports = sortableDecorator;
}
