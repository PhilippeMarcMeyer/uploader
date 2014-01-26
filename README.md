A simple, lightweight jQuery plugin for upload files.

## Installation

Include files:

```html
<script src="/path/to/jquery.js"></script><!-- jQuery is required -->
<script src="/path/to/jquery.uploader.js"></script>
```

## Usage

File input:

```html
<input id="file" type="file">
```
Init with options:

```javascript
$("#file").uploader({
	autoUpload: true, // boolean
	url: undefined, // string
	dataType: "json", // string: "jsonp"
	data: {}, // object
	fileType: undefined, //regexp/array: /image\/\w+/ or /\.(jpg|jpeg|png|gif)+$/ or ["image/jpeg", "text/html", "gif" ...]
	singleUploads: true, // boolean: upload one by one if the browser support
	maxLength: undefined, // number: the max length number of files one upload
	maxSize: undefined, // number/string: the max size number of each file, e.g. 1024 or "1K" or "1KB"

	beforeUpload: function(file) {
		// output the local file data if the browser support
		console.log(file);
	},

	success: function() {
		console.log(Uploader.messages.success);
	},

	error: function(message) {
		console.log(message || Uploader.messages.error);
	}
});
```

Or

```javascript
$.uploader(("#file"), {
	autoUpload: true, // boolean
	url: undefined, // string
	dataType: "json", // string: "jsonp"
	data: {}, // object
	fileType: undefined, //regexp/array: /image\/\w+/ or /\.(jpg|jpeg|png|gif)+$/ or ["image/jpeg", "text/html", "gif" ...]
	singleUploads: true, // boolean: upload one by one if the browser support
	maxLength: undefined, // number: the max length number of files one upload
	maxSize: undefined, // number/string: the max size number of each file, e.g. 1024 or "1K" or "1KB"

	beforeUpload: function(file) {
		// output the local file data if the browser support
		console.log(file);
	},

	success: function() {
		console.log(Uploader.messages.success);
	},

	error: function(message) {
		console.log(message || Uploader.messages.error);
	}
});
```

## Messages

```javascript
$.uploader.setMessages({
	input: "The current borwser doesn\'t support file input.",
	type: "The type of the input element must be \"file\".",
	fileType: "The type of the file must be <%= type %>.",
	length: "The number of selected files is exceeded the limit of <%= length %>.",
	size: "The size of file \"<%= name %>\" is exceeded the limit of <%= size %>.",
	unselected: "Please select files.",
	success: "Upload Done.",
	error: "Upload Error.",
	crossOrigin: "The current borwser doesn\'t support cross origin upload."
});
```