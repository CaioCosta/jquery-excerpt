(function($) {

	/*
	 * Ensures an element's text is cut off at a certain maximum number of lines.
	 *
	 * The element must have a nonzero width when empty. (Most commonly a block
	 * element, such as a <p>, will fit this criterion.) The contained, HTML-free
	 * text will be truncated to fit the width along with an "end", e.g., '…'.
	 * Truncation will only occur along whitespace.
	 *
	 * Assumptions:
	 * - The element is empty or contains only a single text node.
	 *
	 * Guarantees:
	 * - The displayed text will never surpass the requested number of lines.
	 * - If truncation occurs and the end string fits within the width of the
	 *   element, the end string will be displayed.
	 * - As many words in the element's text will be displayed as possible.
	 *
	 * Options:
	 *   end: (default '…') String to append to the end when truncating. May also
	 *                      be a DOM node.
	 *   always_end: String or DOM node which must always be appended, whether or
	 *               not we truncate. (This may actually cause truncation which
	 *               would otherwise not occur.)
	 *	 lines: (default 1) Number of lines of text to display.
	 *
	 * --
	 * Bodacity JavaScript Utilities
	 * http://adamhooper.com/bodacity
	 * Public Domain (no licensing restrictions)
	 */
	function Excerpt(element, options) {
		var that = this;

		this.$element = $(element);
		this.options = $.extend({
			end: '…',
			always_end: undefined,
			lines: 1
		}, options);

		this.original_text = this.$element.text();

		if (typeof(this.options.end) != 'string') {
			// Assume it's a DOM element or jQuery object
			this.$end_node = $(this.options.end);
			this.end_string = this.$end_node.text();
		} else {
			this.end_string = this.options.end;
			this.$end_node = $(document.createTextNode(this.end_string));
		}

		if (this.options.always_end) {
			if (typeof(this.options.always_end) != 'string') {
				this.$always_end_node = $(this.options.always_end);
				this.always_end_string = this.$always_end_node.text();
			} else {
				this.always_end_string = this.options.always_end;
				this.$always_end_node = $(document.createTextNode(this.always_end_string));
			}
		}

		this.$element.data('excerpt', this);

		this.refresh();

		$(window).on('resize.excerpt', function () {
			if (typeof that.deferRefresh != 'undefined') {
				clearTimeout(that.deferRefresh);
			}

			that.deferRefresh = setTimeout(function(){
				that.refresh();
			}, 100);
		});

		if ($('html.ie9').length > 0) {
			$(window).on('load.excerpt', function () {
				setTimeout(function () {
					that.refresh();
				}, 100);
			});
		}
	}

	$.extend(Excerpt.prototype, {
		/*
		 * Resets the element based on its original text, such that it only the
		 * desired number of lines are shown and there is no overflow.
		 */
		refresh: function() {
			if (!this.$element[0].firstChild) return; // It's already empty

			var wh = this.calculateWidthAndHeight();
			var w = wh[0];
			var h = wh[1];

			var s = this.original_text.replace(/\s+/, ' ');

			var spaces = []; // Array of indices to space characters
			spaces.push(0);
			for (var i = 1; i < s.length; i++) {
				if (s.charAt(i) == ' ') {
					spaces.push(i);
				}
			}
			spaces.push(s.length);

			var lbound = 0;
			var rbound = spaces.length - 1;

			var cur = 0;
			var cutoff = 100;
			while (lbound < rbound && cutoff) {
				cur = Math.floor(lbound + (rbound - lbound) / 2);
				if (cur == lbound) cur += 1;

				var sub = this.substring(s, spaces[cur]);
				if (this.isStringSmallEnough(sub, w, h)) {
					lbound = cur;
				} else {
					rbound = cur - 1;
				}
				cutoff -= 1;
			}

			this.$element[0].firstChild.nodeValue = this.substring(s, spaces[lbound], true);

			if (s.length != spaces[lbound]) {
				this.$element.append(this.$end_node.clone());
			}
			if (this.$always_end_node) {
				this.$element.append(this.$always_end_node.clone());
			}
		},

		substring: function(s, length, exclude_end_string) {
			if (length == s.length) return s;
			var substr = s.substr(0, length);
			if (exclude_end_string) {
				return substr;
			} else {
				return substr + this.end_string + (this.always_end_string || '');
			}
		},

		isStringSmallEnough: function(s, w, h) {
			var node = this.$element[0];

			node.firstChild.nodeValue = s;
			return node.offsetHeight <= h && node.offsetWidth <= w;
		},

		/*
		 * Returns the desired [width, height] in px.
		 *
		 * Modifies this.$element contents as a side-effect.
		 */
		calculateWidthAndHeight: function() {
			var node = this.$element[0];

			var s = '&nbsp;';
			for (var i = 0; i < this.options.lines - 1; i++) {
				s += "<br />&nbsp;";
			}

			node.innerHTML = s;

			var w = node.offsetWidth;
			var h = node.offsetHeight;

			node.innerHTML = '&nbsp;'; // anything non-empty

			return [w, h];
		}
	});

	$.fn.excerpt = function(options) {

		return $(this).each(function() {
			new Excerpt(this, options);
		});
	};

	$('[data-excerpt-lines]').each(function () {
		$(this).excerpt({
			'lines': $(this).data('excerpt-lines'),
			'end': $(this).data('excerpt-end'),
			'always_end': $(this).data('excerpt-always-end')
		});
	});

})(window.jQuery);
