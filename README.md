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
	autoUpload: true,
	url: undefined, // path to upload, e.g. "upload.php"
	dataType: "json", // or "jsonp" for cross origin upload if the browser support
	data: {}, // params of upload
	name: undefined, // name for file input
	multiple: false, // select multiple files if the browser support
	singleUploads: true, // upload one by one if the browser support
	maxLength: undefined, // the max length number of files one upload
	maxSize: undefined, // the max size number of each file
	
	messages: {
		input: "The current borwser doesn\'t support file input.",
		type: "The type of the input element must be \"file\".",
		length: "The number of selected files is exceeded the limit of <%= length %>.",
		size: "The size of file \"<%= name %>\" is exceeded the limit of <%= size %>.",
		unselected: "Please select files.",
		success: "Upload Done.",
		error: "Upload Error."
	},
	
	beforeUpload: function(file) { // output the local file data if the browser support
		console.log(file);
	},
	
	success: function() {
		console.log(this.messages.success);
	},
	
	error: function(message) {
		console.log(message || this.messages.error);
	}
});
```