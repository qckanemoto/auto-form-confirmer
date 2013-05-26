/**
 * auto-form-confirmer v1.0.0 - 2013-05-16
 * (c) 2013 Takashi Kanemoto https://github.com/qckanemoto
 * license: http://www.opensource.org/licenses/mit-license.php
 */

$(function() {

	//---------------------------------------------------------------------------------------------
	// optional settings. >>>
	//---------------------------------------------------------------------------------------------

	// special "mark" for label for required item. (can use html tags)
	var requiredMark = "<span>*</span>";

	// relative positioin of require-mark from label itself. (null for not setting)
	var requiredMarkPosition = {
		top:	null,
		bottom:	null,
		left:	null,
		right:	"10px"
	};

	// validation error messages.
	var errorMessage = {
		required:	"this item is required.",
		email:		"invalid email address."
	};

	// speed of fade to confirm view. (msec)
	var fadeSpeed = 500;

	// on confirm view, print label's text instead of value of checkbox and radio.
	var willPrintLabelText = true;

	// on confirm view, print text of <option> tag instead of value of <option> tag.
	var willPrintOptionText = true;

	//---------------------------------------------------------------------------------------------
	// >>> optional settings.
	//---------------------------------------------------------------------------------------------

	// first, clear url hash.
	if ((location.href + "").match("#")) {
		location.href = (location.href + "").replace(/#/g, "");
	}

	var $form = $(".auto-form-confirmer");
	var confirms = ($form.find(".button-confirm").length !== 0);

	// hide items for only confirm view.
	if (confirms) {
		$form.find(".on-neutral").show();
		$form.find(".on-confirm").hide();
		$form.find(".button-confirm").show();
		$form.find(".button-back").hide();
		$form.find(".button-submit").hide();
	}

	// add required mark.
	$form.find(".required-label").each(function() {
		if ($(this).css("position").toLowerCase() === "static") {
			$(this).css("position", "relative");
		}
		var $mark = $(requiredMark)
			.css("position", "absolute")
			.css("top", requiredMarkPosition.top)
			.css("bottom", requiredMarkPosition.bottom)
			.css("left", requiredMarkPosition.left)
			.css("right", requiredMarkPosition.right);
		$(this).append($mark);
	});

	// on neutral view, remap submit event to button click event.
	$form.on("submit", function() {
		if (!confirms) {
			if (!validate()) {
				return false;
			}
		} else {
			if (!$(this).hasClass("confirm")) {
				$form.find(".button-confirm").click();
				return false;
			} else {
				return true;
			}
		}
	});

	// on click buttons.
	$form.find(".button-confirm, .button-back").on("click", function() {
		if (validate()) {

			switchView();

			// add history via api.
			if (!!history.pushState) {
				if ($form.hasClass("confirm")) {
					history.pushState("confirm", null, (location.href + "").replace(/#/g, "") + "#");
				} else {
					history.pushState(null, null, (location.href + "").replace(/#/g, ""));
				}
			}
		}
		return false;
	});

	// on browser back or forward button.
	if (confirms) {
		onpopstate = function(e) {
			if (e.state === "confirm") {
				$form.removeClass("confirm");
			} else {
			 	$form.addClass("confirm");
			}
			switchView();
		}
	}

	// view switcher.
	function switchView() {

		// go to confirm view from neutral view.
		if (!$form.hasClass("confirm")) {
			// hide all input items and print values instead.
			$form.find("input:not(:submit), select, textarea, label, .fadeout, .on-neutral").hide();
			$form.find(".on-neutral").hide();
			$form.find(".on-confirm").fadeIn(fadeSpeed);
			$form.find(".button-confirm").hide();
			$form.find(".button-back").fadeIn(fadeSpeed);
			$form.find(".button-submit").fadeIn(fadeSpeed);
			setTimeout(printConfirms, fadeSpeed);
			$form.addClass("confirm");
		}
		// back to neutral view from confirm view.
		else {
			// show all input items and remove printed values.
			$form.find("button, input, select, textarea, label, .fadeout, .on-neutral").fadeIn(fadeSpeed);
			$form.find(".on-neutral").fadeIn(fadeSpeed);
			$form.find(".on-confirm").hide();
			$form.find(".button-confirm").fadeIn(fadeSpeed);
			$form.find(".button-back").hide();
			$form.find(".button-submit").hide();
			$form.find(".confirm-print").remove();
			$form.removeClass("confirm");
		}

		// print values on confirm view.
		function printConfirms() {

			var val;			// temporary value buffer.
			var processed = "";	// list of "name" of processed checkboxes and radios.

			$form.find("input:not(:submit), select, textarea").each(function() {
				var type = $(this).get(0).tagName.toLowerCase();
				if (type === "input") {
					type = $(this).attr("type").toLowerCase();
				} else if (type === "select" && $(this).attr("multiple")) {
					type = "list";
				}
				var $print = $("<p/>").addClass("confirm-print");

				switch (type) {
				case "password":
					$p = $print.clone(true).text($(this).val().replace(/./g, "*"));
					$(this).after($p);
					break;

				case "text":
				case "textarea":
					val = nl2br(escapeHTML($(this).val()));
					$p = $print.clone(true).html(val);
					$(this).after($p);
					break;

				case "select":
				case "list":
					val = [];
					$(this).find("option:selected").each(function() {
						if (willPrintOptionText) {
							val.push($(this).text());
						} else {
							val.push($(this).val());
						}
					});
					$p = $print.clone(true).text(val.join(", "));
					$(this).after($p);
					break;

				case "checkbox":
				case "radio":
					val = [];
					var name = $(this).attr("name");
					if (processed.indexOf(name) === -1) {
						processed += (name + "/");
						$form.find("[name='" + name + "']:checked").each(function() {

							// get the corresponding label.
							$innerLabel = $(this).parents("label").first();
							$outerLabel = $(this).parents("label").last();
							if ($innerLabel.length === 0) {
								$innerLabel = $form.find("label[for='" + $(this).attr("id") + "']").last();
							}

							if (willPrintLabelText && $innerLabel.length !== 0) {
								val.push($innerLabel.text());
							} else {
								val.push($(this).val());
							}
						});
						$p = $print.clone(true).text(val.join(", "));
						if ($outerLabel.length !== 0) {
							$outerLabel.after($p);
						} else {
							$(this).after($p);
						}
						break;
					}

				default:
					break;
				}
			});
		}

		// utilities.
		function escapeHTML(str) {
			return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
		function nl2br(str) {
			return (str + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1<br>$2");
		}
	}

	// validator.
	function validate() {

		// reset first.
		var isInvalid = false;
		var $errortip = $("<div/>").addClass("errortip");
		$form.find(".errored").removeClass("errored");
		$form.find("div.errortip").remove();

		// required.
		$form.find(".required").each(function() {
			var type = $(this).get(0).tagName.toLowerCase();
			if (type === "input") {
				type = $(this).attr("type").toLowerCase();
			} else if (type === "select" && $(this).attr("multiple")) {
				type = "list";
			}

			var flg = null;
			switch (type) {
			case "text":
			case "password":
			case "textarea":
				if (!$(this).val()) {
					isInvalid = setError($(this));
				}
				break;
			case "select":
			case "list":
				if ($(this).find("option:selected").length === 0) {
					isInvalid = setError($(this));
				} else {
					flg = true;
					$(this).find("option:selected").each(function() {
						if ($(this).val() !== "") {
							flg = false;
							return false;
						}
					});
					if (flg) {
						isInvalid = setError($(this));
					}
				}
				break;
			case "checkbox":
			case "radio":
				$group = $form.find("[name='" + $(this).attr("name") + "']");
				$group.each(function() {
					flg = true;
					if ($(this).is(":checked")) {
						flg = false;
						return false;
					}
				});
				if (flg) {
					isInvalid = setError($group);
				}
				break;
			default:
				break;
			}
			function setError($obj, type) {
				$obj.addClass("errored");
				$obj.last().after($errortip.clone(true).text(errorMessage.required));
				return true;
			}
		});

		// email.
		$form.find(".email").each(function() {
			var email = $(this).val();
			if (email && !email.match(/^[a-zA-Z0-9][a-zA-Z0-9\._-]*@[a-zA-Z0-9_-]+\.[a-zA-Z0-9\._-]*[a-zA-Z0-9]$/)) {
				$(this).addClass("errored");
				$(this).after($errortip.clone(true).text(errorMessage.email));
				isInvalid = true;
			}
		});

		// fade out error messages several seconds after.
		$form.find(".errortip").delay(2000).fadeOut(500);

		return !isInvalid;
	}
});
