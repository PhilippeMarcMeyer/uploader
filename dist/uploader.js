/*!
 * Uploader v0.0.1
 * https://github.com/fengyuanchen/uploader
 *
 * Copyright 2014 Fengyuan Chen
 * Released under the MIT license
 */

(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as anonymous module.
        define(["jquery"], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
}(function($) {

    "use strict";

    function Uploader(fileInput, options) {
        this.$fileInput = $(fileInput);
        this.defaults = $.extend({}, Uploader.defaults, this.$fileInput.data(), options);
        this.init();
    }

    Uploader.prototype = {
        constructor: Uploader,

        support: {
            fileInput: !$("<input type=\"file\">").prop("disabled"),
            fileList: !!$("<input type=\"file\">").prop("files"),
            fileReader: !!window.FileReader,
            formData: !!window.FormData
        },

        init: function() {
            var name = this.$fileInput.attr("name"),
                type = this.$fileInput.attr("type");

            if (!this.support.fileInput) {
                throw new Error(Uploader.messages.input);
            }

            if (type !== "file") {
                throw new Error(Uploader.messages.type);
            }

            if (name && !this.defaults.name) {
                this.defaults.name = name;
            }

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
            if (this.enabled) {
                return;
            }

            this.enabled = true;
            this.$fileInput.on("change", $.proxy(this.serialize, this));
        },

        disabled: true,

        disable: function() {
            if (this.disabled) {
                return;
            }

            this.disabled = true;
            this.$fileInput.off("change");
        },

        serialize: function() {
            var files,
                length,
                file,
                i;

            this.i = 0;
            this.length = 0;
            this.files = {};

            if (this.support.fileList) {
                files = this.$fileInput.prop("files");
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
                    this.$fileInput.val("");
                }

            } else {
                this.length = 1;
                this.defaults.beforeUpload(null);
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
                this.defaults.error(Uploader.messages.length.replace("<%= length %>", length));
            }

            return length;
        },

        isValidFile: function(file) {
            var type = Uploader.fn.parseType(this.defaults.fileType),
                maxSize = Uploader.fn.parseSize(this.defaults.maxSize),
                formated = Uploader.fn.formatSize(maxSize);

            if (!(type.regex.test(file.name) || type.regex.test(file.type))) {
                this.defaults.error(Uploader.messages.fileType.replace("<%= type %>", type.value));
                return false;
            }

            if (maxSize > 0 && maxSize < file.size) {
                this.defaults.error(Uploader.messages.size.replace("<%= name %>", file.name).replace("<%= size %>", formated));
                return false;
            }

            return true;
        },

        start: function() {
            if (!this.length || this.length === 0) {
                this.defaults.error(Uploader.messages.unselected);
                return;
            }

            this.i = 0;
            this.upload();
            this.$fileInput.prop("disabled", true);
        },

        next: function() {
            this.i++;

            if (this.i < this.length) {
                this.upload();
            } else {
                this.stop();
            }
        },

        stop: function() {
            this.$fileInput.prop("disabled", false);
            this.$fileInput.val("");
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

                success: function(data) {
                    that.defaults.success(data);
                    that.next();
                },

                error: function() {
                    that.defaults.error(Uploader.messages.error);
                    that.next();
                }
            });
        },

        initUploader: function() {
            var id = Math.random().toString().replace("0.", ""),
                uploader = [
                    "<div id=\"uploader-" + id + "\" style=\"display:inline;\">",
                    "<form id=\"uploader-form-" + id + "\" method=\"post\" action=\"" + this.defaults.url + "\" enctype=\"multipart/form-data\" target=\"uploader-iframe-" + id + "\" style=\"display:inline;\">",
                    Uploader.fn.template(this.defaults.data),
                    "<button type=\"submit\" style=\"display:none;\">Upload</button>",
                    "</form>",
                    "<iframe name=\"uploader-iframe-" + id + "\" style=\"display:none;\"></iframe>",
                    "</div>"
                ].join(""),
                $uploader = $(uploader),
                firstLoad = true;
                that = this;

            this.$uploader = $uploader;
            this.$fileInput.after($uploader);
            this.$uploader.find("form").append(this.$fileInput);
            this.$button = $uploader.find("button");
            this.$iframe = $uploader.find("iframe");

            this.$iframe.on("load", function() {
                var data,
                    win,
                    doc;

                try {
                    win = this.contentWindow;
                    doc = this.contentDocument;

                    doc = doc ? doc : win.document;
                    data = doc ? doc.body.innerText : null;
                } catch (e) {
                    console.log(e.message + ":" + Uploader.messages.crossOrigin);
                    // throw new Error(Uploader.messages.crossOrigin);
                }

                if (data) {
                    try {
                        data = $.parseJSON(data);
                    } catch (e) {
                        console.log(e.message);
                    }

                    that.defaults.success(data);
                } else {
                    if (firstLoad) {
                        firstLoad = false;
                    } else {
                        that.defaults.error(Uploader.messages.error);
                    }
                }

                that.stop();
            });
        }
    };

    // The static properties & methods
    Uploader.fn = {
        kilobyte: 1024,
        megabyte: Math.pow(1024, 2),
        gigabyte: Math.pow(1024, 3),

        template: function(data) {
            var inputs = [];

            $.each(data, function(name, value) {
                inputs.push("<input type=\"hidden\" name=\"" + name + "\" value=\"" + value + "\">");
            });

            return inputs.join("");
        },

        parseType: function(type) {
            var parts = {
                value: type,
                regex: /\.\w+$/
            };

            if (type instanceof RegExp) {
                parts.regex = type;
            }

            if ($.isArray(type) && type.length > 0) {
                parts.value = type.join(", ");

                if (type.length > 1) {
                    type = $.map(type, function(n) {
                        return "(" + n + ")";
                    });
                }

                parts.regex = new RegExp("(" + type.join("|") + ")+$", "i");
            }

            return parts;
        },

        parseSize: function(size) {
            var parts;

            if (typeof size === "string") {
                parts = size.match(/(\d*)(\w*)/);
                size = parseInt(parts[1], 10) || 0;

                switch (parts[2].toUpperCase()) {
                    case "K":
                    case "KB":
                        size *= this.kilobyte;
                        break;

                    case "M":
                    case "MB":
                        size *= this.megabyte;
                        break;

                    case "G":
                    case "GB":
                        size *= this.gigabyte;
                        break;

                        // No default
                }
            }

            return typeof size === "number" ? size : -1;
        },

        formatSize: function(size) {
            size = parseInt(size, 10) || 0;

            return size > this.gigabyte ? Math.floor(size / this.gigabyte) + "GB" :
                size > this.megabyte ? Math.floor(size / this.megabyte) + "MB" :
                size > this.kilobyte ? Math.floor(size / this.kilobyte) + "KB" :
                size + "B";

        }
    };

    Uploader.defaults = {
        autoUpload: true, // boolean
        url: undefined, // string
        dataType: "json", // string
        data: {}, // object
        fileType: undefined, //regexp/array: /image\/\w+/ or /\.(jpg|jpeg|png|gif)+$/ or ["image/jpeg", "text/html", "gif" ...]
        singleUploads: true, // boolean
        maxLength: undefined, // number
        maxSize: undefined, // 1024 or "1K" or "1KB"

        beforeUpload: function(file) {
            console.log(file);
        },

        success: function() {
            console.log(Uploader.messages.success);
        },

        error: function(message) {
            console.log(message || Uploader.messages.error);
        }
    };

    Uploader.setDefaults = function(options) {
        $.extend(Uploader.defaults, options);
    };

    Uploader.messages = {
        input: "The current borwser doesn\'t support file input.",
        type: "The type of the input element must be \"file\".",
        fileType: "The type of the file must be <%= type %>.",
        length: "The number of selected files is exceeded the limit of <%= length %>.",
        size: "The size of file \"<%= name %>\" is exceeded the limit of <%= size %>.",
        unselected: "Please select files.",
        success: "Upload Done.",
        error: "Upload Error.",
        crossOrigin: "The current borwser doesn\'t support cross origin upload."
    };

    Uploader.setMessages = function(options) {
        $.extend(Uploader.messages, options);
    };

    // Register as jQuery plugin
    $.fn.uploader = function(options) {
        return this.each(function() {
            $(this).data("uploader", new Uploader(this, options));
        });
    };

    $.fn.uploader.Constructor = Uploader;
    $.fn.uploader.setDefaults = Uploader.setDefaults;
    $.fn.uploader.setMessages = Uploader.setMessages;

    $(function() {
        $(":file[uploader]").uploader();
    });
}));
