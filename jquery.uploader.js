/*!
 * jQuery Uploader Plugin v0.1.0
 * https://github.com/fengyuanchen/uploader
 *
 * Copyright 2014 Fenngyuan Chen
 * Released under the MIT license
 */
 
(function (fn, undefined) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as anonymous module.
		define(["jquery"], fn);
	} else {
		// Browser globals.
		fn(window.jQuery);
	}
}(function($) {
	
	"use strict";
	
	function Uploader(fileInput, options) {
		this.id = "uploader-" + (new Date()).valueOf().toString() + Math.random().toString().replace(".", "");
		this.$fileInput = $(fileInput);
		this.init(options);
	}
	
	Uploader.defaults = {
		autoUpload: true,
		url: undefined,
		dataType: "json", // or "jsonp"
		data: {},
		name: undefined,
		multiple: false,
		singleUploads: true,
		maxLength: undefined,
		maxSize: undefined,
		
		messages: {
			input: "The current borwser doesn\'t support file input.",
			type: "The type of the input element must be \"file\".",
			length: "The number of selected files is exceeded the limit of <%= length %>.",
			size: "The size of file \"<%= name %>\" is exceeded the limit of <%= size %>.",
			unselected: "Please select files.",
			success: "Upload Done.",
			error: "Upload Error."
		},
		
		beforeUpload: function(file) {
			console.log(file);
		},
		
		success: function() {
			console.log(this.messages.success);
		},
		
		error: function(message) {
			console.log(message || this.messages.error);
		}
	};
	
	Uploader.prototype = {
		constructor: Uploader,
		
		support: {
			fileInput: !$('<input type="file">').prop("disabled"),
			fileList: !$('<input type="file">').prop("files"),
			fileReader: !window.FileReader,
			formData: !window.FormData
		},
		
		init: function(options) {
			var settings = this.$fileInput.data(),
				name = this.$fileInput.attr("name"),
				type = this.$fileInput.attr("type");
			
			console.log(this);
			if (!this.support.fileInput) {
				throw new Error(this.defaults.messages.input);
			}
			
			if (type !== "file") {
				throw new Error(this.defaults.messages.type);
			}
			
			if (name && !settings.name) {
				settings.name = name;
			}
			
			settings.multiple = this.$fileInput.prop("multipple");
			
			this.defaults = $.extend({}, Uploader.defaults, settings, options);
			
			if (this.support.formData) {
				this.xhrUpload = true;
			} else {
				this.xhrUpload = false;
				this.initUploader();
			}
			
			this.enable();
		},
		
		enabled: false,
		
		enable: function() {
			var that = this;
			
			if (this.enabled) {
				return;
			}
			
			this.enabled = true;
			
			if (this.xhrUpload) {
				this.$trigger = this.$fileInput;
			} else {
				this.$trigger = this.$fileInputClone;
				
				this.$fileInput.on("click", function(e) {
					e.preventDefault();
					e.stopPropagation();
					that.$fileInputClone.trigger("click");
					return false;
				});
				
				this.$fileInput.on("keydown", function(e) {
					e.preventDefault();
					e.stopPropagation();
					
					if (e.keyCode === 13) {
						that.$fileInputClone.trigger("click");
					}
					
					return false;
				});
			}
			
			this.$trigger.on("change", $.proxy(this.serialize, this));
		},
		
		disabled: true,
		
		disable: function() {
			var that = this;
			
			if (this.disabled) {
				return;
			}
			
			this.disabled = true;
			
			if (!this.xhrUpload) {
				this.$fileInput.off("click");
				this.$fileInput.off("keyup");
				
				this.$iframe.off("load");
				this.$uploader.empty().remove();
			}
			
			this.$trigger.off("change");
		},
		
		serialize: function() {
			var files,
				length,
				maxLength,
				maxSize,
				formated,
				file,
				i;
			
			this.i = 0;
			this.length = 0;
			this.files = {};
			
			if (this.support.fileList) {
				files = this.$trigger.prop("files");
				length = this.checkLength(files.length);
				
				for (i = 0; i < length; i++) {
					file = files[i];
					
					if (this.isValidFile(file)) {
						this.files[this.i++] = file;
						this.read(file);
					}
				}
				
				this.length = this.i;
				
				if (this.length === 0) {
					this.$trigger.val("");
				}
				
			} else {
				this.length = 1;
				this.defaults.beforeUpload({});
			}
			
			if (this.defaults.autoUpload) {
				this.start();
			}
		},
		
		read: function(file) {
			var that = this,
				fileReader = null,
				fileData = {
					name: file.name,
					type: file.type,
					extension: file.name.match(/([^\.]\w+)$/)[1],
					size: Uploader.fn.formatSize(file.size)
				};
			
			if (this.support.fileReader) {
				fileReader = new FileReader();
				fileReader.readAsDataURL(file);
				
				fileReader.onload = function() {
					fileData.url = this.result;
				};
				
				fileReader.onloadend = function() {
					that.defaults.beforeUpload(fileData);
				};
			} else {
				this.defaults.beforeUpload(fileData);
			}
		},
		
		checkLength: function(length) {
			var maxLength = this.defaults.maxLength;
			
			if (maxLength && maxLength < length) {
				length = maxLength;
				this.defaults.error(this.defaults.messages.length.replace("<%= length %>", length));
			}
			
			return length;
		},
		
		isValidFile: function(file) {
			var maxSize = Uploader.fn.parseSize(this.defaults.maxSize),
				formated = Uploader.fn.formatSize(maxSize);
			
			if (maxSize > 0 && maxSize < file.size) {
				this.defaults.error(this.defaults.messages.size.replace("<%= name %>", file.name).replace("<%= size %>", formated));
				return false;
			}
			
			return true;
		},
		
		start: function() {
			if (!this.length || this.length === 0) {
				this.defaults.error(this.defaults.messages.unselected);
				return;
			}
			
			console.log("Start:");
			console.log(this);
			this.$fileInput.prop("disabled", true);
			this.i = 0;
			this.upload();
		},
		
		next: function() {
			console.log("Next:");
			console.log(this);
			this.i++;
			
			if (this.i < this.length) {
				this.upload();
			} else {
				this.stop();
			}
		},
		
		stop: function() {
			console.log("Stop:");
			console.log(this);
			this.$fileInput.prop("disabled", false);
			this.$trigger.val("");
			this.length = 0;
			this.files = null;
		},
		
		upload: function() {
			var data = {},
				that = this;
			
			if (!this.xhrUpload) {
				this.$button.click();
				return;
			}
			
			if (this.support.fileList) {
				data = new FormData();
				
				$.each(this.defaults.data, function(name, value) {
					data.append(name, value);
				});
				
				if (this.defaults.singleUploads) {
					data.append(this.defaults.name, this.files[this.i]);
				} else {
					this.i = this.length;
					data.append(this.defaults.name, this.files);
				}
			} else {
				data = new FormData(this.$uploader.find("form")[0]);
			}
			
			$.ajax({
				type: "post",
				url: this.defaults.url,
				data: data,
				dataType: this.defaults.dataType,
				processData: false, // 告诉jQuery不要去处理发送的数据
				contentType: false, // 告诉jQuery不要去设置Content-Type请求头
				
				success: function(data, textStatus, jqXHR) {
					console.log("File " + that.i + " status:" + textStatus);
					console.log("File " + that.i + " url:" + data.result);
					that.defaults.success(data);
					that.next();
				},
				
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					console.log("File " + that.i + " status:" + textStatus + errorThrown);
					that.defaults.error();
					that.next();
				}
			});
		},
		
		initUploader: function() {
			var uploader = [
					'<div id="' + this.id + '" stype="display:8none;">',
						'<form method="post" action="' + this.defaults.url + '" enctype="multipart/form-data" target="uploader-iframe">',
							'<div>' + Uploader.fn.template(this.defaults.data) + '</div>',
							'<button type="submit">Upload</button>',
							'<input type="file" name="' + this.defaults.name + '"' + (this.defaults.multiple ? ' multiplle' : '') + '>',
						'</form>',
						'<iframe name="uploader-iframe"></iframe>',
					'</div>'
				].join(""),
				$uploader = $(uploader),
				that = this;
			
			$uploader.appendTo("body");
			this.$uploader = $uploader;
			this.$fileInputClone = $uploader.find("input[type='file']");
			this.$button = $uploader.find("button");
			this.$iframe = $uploader.find("iframe");
			
			this.$iframe.on("load", function() {
				var win = this.contentWindow,
					doc = this.contentDocument,
					data;
				
				doc = doc ? doc : win.document;
				data = doc ? doc.body.innerText : null;
				
				if (data) {
					data = typeof data === "string" ? $.parseJSON(data) : data;
					that.defaults.success(data);
				} else {
					that.defaults.error();
				}
				
				that.stop();
			});
		}
	};
	
	// static properties & methods
	Uploader.fn = {
		SIZE_NUMBER_KB: 1024,
		SIZE_NUMBER_MB: Math.pow(1024, 2),
		SIZE_NUMBER_GB: Math.pow(1024, 3),
		
		template: function(data) {
			var inputs = [];
			
			$.each(data, function(name, value) {
				inputs.push('<input type="hidden" name="' + name + '" value="' + value + '">');
			});
			
			return inputs.join("");
		},
		
		parseSize: function(size) {
			var parts;
			
			if (typeof size === "string") {
				parts = size.match(/(\d*)(\w*)/);
				size = parseInt(parts[1], 10) || 0;
				console.log(parts[1]);
				console.log(parts[2]);
				
				switch(parts[2].toUpperCase()) {
					case "K":
					case "KB":
						size *= this.SIZE_NUMBER_KB;
						break;
					
					case "M":
					case "MB":
						size *= this.SIZE_NUMBER_MB;
						break;
					
					case "G":
					case "GB":
						size *= this.SIZE_NUMBER_GB;
						break;
					
					// No default
				}
			}
			
			return typeof size === "number" ? size : -1;
		},
		
		formatSize: function(size) {
			size = parseInt(size, 10) || 0;
			
			return size > this.SIZE_NUMBER_GB ? Math.floor(size / this.SIZE_NUMBER_GB) + "GB" : 
					size > this.SIZE_NUMBER_MB ? Math.floor(size / this.SIZE_NUMBER_MB) + "MB" : 
					size > this.SIZE_NUMBER_KB ? Math.floor(size / this.SIZE_NUMBER_KB) + "KB" : 
					size + "B";
			
		}
	};
	
	// define as a jquery method
	$.fn.uploader = function(options) {
		return this.each(function() {
			$(this).data("uploader", new Uploader(this, options));
		});
	};
	
	$.fn.uploader.Constructor = Uploader;
	
	// auto init
	$(function() {
		$("*[data-uploader]").uploader();
	});

}));
