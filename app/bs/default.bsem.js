//Requires and declares
var gulp = require('gulp'),
    gutil = require('gulp-util'),
    path = require('path'),
    rollup = require('gulp-rollup'),
    rollupmep = require('gulp-rollup-mep'),
    debug = require('gulp-debug'),
    uglifyjs = require('gulp-uglify'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rename = require("gulp-rename"),
    minifyCss = require('gulp-cssnano'),
    del = require('del'),
    fs = require('fs'),
    browserSync = require('browser-sync'),
    nodemon = require('gulp-nodemon'),
    typescript = require('gulp-typescript'),
    pug = require('gulp-pug'),
    bundling = require('../../config/bundling.json'),
    jade = require('gulp-jade'),
    traceur = require('gulp-traceur'),
    env = require('../../config/environments.json'),
    typescriptMainConfig = typescript.createProject('tsconfig.json'),
    typescriptMultipleConfig = typescript.createProject('tsconfig.json'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    exec = require('child_process').exec,
    cssnano = require('cssnano');



exports.before = (mod, ...args) => {
    mod.settings = {};
};

exports.lex = {
    for: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.environment = args[0];
        }
    },
    only: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.spec = args[0];
        }
    },
    language: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.language = args[0];
        }
    },
    build: {
        length: 0,
        handler: (mod, ...args) => {
            mod.task = "build";
            if(mod.settings.spec){
                mod.task += "-"+mod.settings.spec;
            }
        }
    },
    module: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.module = args[0];
        }
    },
    task: {
        length: 1,
        handler: (mod, ...args) => {
            mod.task = args[0];
        }
    },
    watch: {
        length: 0,
        handler: (mod, ...args) => {
            mod.task = "watch";
            if(mod.settings.spec){
                mod.task += "-"+mod.settings.spec;
            }
        }
    },
    serve: {
        length: 0,
        handler: (mod, ...args) => {
            mod.task = "serve";
        }
    },
    called: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.name = args[0];
        }
    },
    path: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.path = args[0];
        }
    },
    from: {
        length: 1,
        handler: (mod, ...args) => {
            mod.settings.source = args[0];
        }
    },
    generate: {
        length: 1,
        handler: (mod, ...args) => {
            if(mod.settings.name){
                switch (args[0]) {
                    case "router":
                        writeToFile("./sources/routers/" + (mod.settings.path || mod.settings.name+".gen.router.js"), `function ${mod.settings.name}Router(){
    let router = new RadixRouter;
    let plug = radix.dapis.useful.ehgs.plug;

    router.onGet("/", plug("Hello world"));

    return router;
};
                        `).then(data => console.log(`Router ${mod.settings.name} generated!`))
                        break;
                    case "model":
                        writeToFile("./sources/models/" + (mod.settings.path || mod.settings.name+".gen.model.js"), `function ${mod.settings.name}Model(){
    const mongoose = getDependency('mongoose');
    const Schema = mongoose.Schema;
    const conv = radix.dapis.wizards.standards.ehgf13Arg;

    let structure = {
        foo: {type: String, required: true},
        bar: {type: String, required: true}
    };

    var schema = new Schema(structure);

    let model = mongoose.model("${mod.settings.name}", schema);

    model.fcs = {
        create: function* create(leanInstance){
            return yield (new model(leanInstance)).save();
        },
        byId: function(id) {
            return {
                get: function* get(){
                    return yield model.findById(id);
                },
                delete: function* (){
                    return yield model.findByIdAndRemove(id);
                },
                update: function* update(leanInstance){
                    return yield model.findByIdAndUpdate(id, leanInstance, {new: true});
                }
            }
        },
        get: function* get(page, length){
            return yield model.find().skip(page*length).limit(length).lean();
        }
    };

    model.ehgs = {
        create(leanInstance){
            return function*(request, response, next){
                return response.send(yield* model.fcs.create(
                    conv(leanInstance, request, false)
                ));
            }
        },
        get(page, length){
            return function*(request, response, next){
                return response.send(yield* model.fcs.get(
                    conv(page, request, false),
                    conv(length, request, false)
                ));
            }
        },
        byId(id){
            return {
                get(){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.byId(
                            conv(id, request, false)
                        ).get());
                    }
                },
                delete(){
                    return function*(request, response, next){
                        return yield* model.fcs.byId(
                            conv(id, request, false)
                        ).delete();
                    }
                },
                update(leanInstance){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.byId(
                            conv(id, request, false)
                        ).update(
                            conv(leanInstance, request, false)
                        ));
                    }
                }
            }
        },
    };

    return model;
}
                        `).then(data => console.log(`Model ${mod.settings.name} generated!`))
                        break;
                    case "component/style":
                        let rootPath = "./sources/assets/stylesheets/";
                        if(mod.settings.language != "scss" && mod.settings.language != "sass"){
                            console.log("Component does not support this language");
                            break;
                        }
                        let sassMod = `@import _global
/* Extra Small Devices, Phones */
@media only screen and (max-width : 480px)
  @import _mobile



/* Small Devices, Tablets */
@media only screen and (max-width : 768px) and (min-width: 481px)
  @import _tablet


/* Medium Devices, Desktops */
@media only screen and (max-width : 1024px) and (min-width: 769px)
  @import _desktop

/* Large Devices, Wide Screens */
@media only screen and (min-width: 1025px)
  @import _wide
`;
                        let scssMod = `@import "_global";

/* Extra Small Devices, Phones */
@media only screen and (max-width : 480px) {
  @import "_mobile";
}


/* Small Devices, Tablets */
@media only screen and (max-width : 768px) and (min-width: 481px) {
  @import "_tablet";
}


/* Medium Devices, Desktops */
@media only screen and (max-width : 1024px) and (min-width: 769px)  {
  @import "_desktop";
}

/* Large Devices, Wide Screens */
@media only screen and (min-width: 1025px)  {
  @import "_wide";
}`;
                        if(mod.settings.path){
                            rootPath = path.join(rootPath, mod.settings.path);
                        }
                        let basePath = path.join(rootPath, mod.settings.name);
                        mdir(basePath);
                        let extension = mod.settings.language || "scss";
                        Promise.all([
                            writeToFile(path.join(basePath, "_desktop." + extension), ""),
                            writeToFile(path.join(basePath, "_global." + extension), ""),
                            writeToFile(path.join(basePath, "_mobile." + extension), ""),
                            writeToFile(path.join(basePath, "_tablet." + extension), ""),
                            writeToFile(path.join(basePath, "_wide." + extension), ""),
                            writeToFile(path.join(basePath, "main."+extension), (mod.settings.language == "sass" ? sassMod : scssMod))
                        ]).then(_ => {
                            console.log("Component generated");
                        }).catch(error => {
                            console.log(error);
                        });
                        break;
                    default:
                        console.log("Can not generate this kind of ressource")
                }
            } else {
                switch (args[0]) {
                    case "crud":
                        if(mod.settings.source){
                            const mongoose = require('mongoose');
                            const Schema = mongoose.Schema;
                            const basePath = "../../sources/schemas/";

                            let test;
                            try {
                                test = require(path.join(basePath, mod.settings.source));
                            } catch (all){
                                console.log("A problem occured oppening " + path.join("[PSD]/schemas/", mod.settings.path));
                                break;
                            }
                            let object = {};
                            let populateFields = [];
                            let identifiers = [];
                            let mIdentifiers = [];
                            if(!test.$$name){
                                console.log("Error no name for schema");
                                break;
                            }
                            for(let i in test){
                                if(i.substr(0,2) == "$$") continue;
                                let a = object[i] = {};
                                for(let key in test[i]){
                                    switch (key) {
                                        case "ref":
                                            a.ref = test[i][key];
                                            a.type = Schema.ObjectId;
                                            if(test[i]["populate"]){
                                                populateFields.push({path: i, select: test[i]["populate"].join(" ")});
                                            }
                                            break;
                                        case "identifier":
                                            if(test[i]["unique"]){
                                                identifiers.push(i);
                                            } else {
                                                mIdentifiers.push(i);
                                            }
                                        case "populate":
                                            break;
                                        default:
                                            a[key] = test[i][key];
                                    }
                                }
                            }
                            let content = "";
                            content += `function ${test.$$name}Model(){
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    let structure = ${formatSchema(object)};

    let schema = new Schema(structure);
    let model = mongoose.model("${test.$$name}", schema);
    let popQuery = [${populateFields.map(e => `{path: '${e.path}', select: '${e.select}'}`).join(", ")}];

    model.fcs = {
        create: function* create(leanInstance){
            let ins = yield (new model(leanInstance)).save();
			return yield model.populate(ins, popQuery);
        },
        byId: function(id) {
            return {
                get: function* get(){
                    return yield model.findById(id).populate(popQuery);
                },
                delete: function* (){
                    return yield model.findByIdAndRemove(id);
                },
                update: function* update(leanInstance){
                    return yield model.findByIdAndUpdate(id, leanInstance, {new: true});
                }
            }
        },${generateFcs(identifiers, mIdentifiers)}
        get: function* get(page, length){
            return yield model.find().skip(page*length).limit(length).lean();
        }
    };

    model.ehgs = {
        create(leanInstance){
            return function*(request, response, next){
                return response.send(yield* model.fcs.create(
                    conv(leanInstance, request, false)
                ));
            }
        },
        byId(id){
            return {
                get(){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.byId(
                            conv(id, request, false)
                        ).get());
                    }
                },
                delete(){
                    return function*(request, response, next){
                        return yield* model.fcs.byId(
                            conv(id, request, false)
                        ).delete();
                    }
                },
                update(leanInstance){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.byId(
                            conv(id, request, false)
                        ).update(
                            conv(leanInstance, request, false)
                        ));
                    }
                }
            }
        },${generateEhgs(identifiers, mIdentifiers)}
        get(page, length){
            return function*(request, response, next){
                return response.send(yield* model.fcs.get(
                    conv(page, request, false),
                    conv(length, request, false)
                ));
            }
        }
    };

    return model;
}`;
                            let file = path.join("./sources/models/", mod.settings.path || (test.$$name + ".gen.model.js"));
                            writeToFile(file, content)
                                .then(data => {
                                    console.log(`${file} was generated`);
                                    console.log(`Remember to rename file and register it in the model hook`);
                                })
                                .catch(error => {
                                    console.log("Something went wrong");
                                    console.log(error);
                                })

                        } else {
                            console.log("No source specified");
                        }
                        break;
                    default:
                        console.log("Can not generate this kind of ressource")
                }
            }
        }
    }
}

exports.after = (mod, ...args) => {
    var node_env = mod.settings.environment || "development";
    mod.prefix = "dist/" + node_env;
    mod.environment = env[node_env];
};

io = {
    server: {
        in: [
            'sources/app/**/*.js',
            'sources/routers/**/*.js',
            'sources/models/**/*.js',
            'sources/hooks/**/*.js',
            'app/server/**/*.js'
        ], out: '/'
    },
    independent: {
        in: [
            "package.json",
            "app/bs/ressources/launch.js"
        ],
        out: "./"
    },
    config: {
        in: "config/**/**",
        out: "config/"
    },
    static: {
        in: 'sources/public/**/*',
        out: '/public/'
    },
    stylesheets: {
        in: [
            'sources/assets/stylesheets/**/*.scss',
            'sources/assets/stylesheets/**/*.sass',
            'sources/assets/stylesheets/**/*.css'
        ],
        out: '/assets/stylesheets/',
        root: "sources/"
    },
    views: {
        in: 'sources/views/**/*',
        out: '/views/'
    },
    javascript: {
        in: "sources/assets/javascript/**/**.js",
        out: "/assets/javascript",
        bundles: "sources/assets/javascript/**.esnext.js",
        root: "sources/"
    },
    multiple: {
        in_js: "sources/assets/multiple/**/**.js",
        in_ts: "sources/assets/multiple/**/**.ts",
        in_pug: "sources/assets/multiple/**/**.pug",
        in_css: [
            "sources/assets/multiple/**/**.scss",
            "sources/assets/multiple/**/**.sass"
        ],
        in_static: [
            "sources/assets/multiple/**/**.**",
            "!sources/assets/multiple/**/**.pug",
            "!sources/assets/multiple/**/**.scss",
            "!sources/assets/multiple/**/**.sass",
            "!sources/assets/multiple/**/**.ts",
            "!sources/assets/multiple/**/**.js"
        ],
        out: "/assets/multiple/"
    },
    typescript: {in: "sources/assets/typescript/**/**.ts", out: "/assets/javascript/compiled"}
};

//Create Void infrastructure
var mdir = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        //console.log(e);
    }
};

function execute(command) {
    return new Promise(function (resolve, reject) {
        var pro = exec(command, function (error, stdout, stderr) {
            resolve({
                error,
                stdout,
                stderr
            })
        });
    });
}

var writeToFile = function (filename, contents) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(filename, contents, function (errors) {
            if (errors) {
                reject(errors);
            } else {
                resolve();
            }
        });
    });
};

var readFile = function (path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

let watch = {
    'server': [
        'sources/app/**/*.js',
        'sources/hooks/**/*.js',
        'sources/models/**/*.js',
        'sources/routers/**/*.js'
    ],
    'dev': 'app/server/**/**.*',
    'static': 'sources/public/**/*',
    'stylesheets': [
        'sources/assets/stylesheets/**/**.scss',
        "config/buildSystem.json"
    ],
    'multiple': "sources/assets/multiple/**/**",
    'views': 'sources/views/**/**',
    'javascript': [
        'sources/assets/javascript/**/**.js',
        "config/buildSystem.json"
    ],
    'typescript': 'sources/assets/typescript/**/**.ts',
};

exports.tasks = {
    'build-arch': function (mod) {
        let prefix = mod.prefix;
        mdir("dist");
        mdir(prefix);
        mdir(path.join(prefix, "/uploads"));
        mdir(path.join(prefix, "/suploads"));


        var streamI = gulp.src(io.independent.in)
            .pipe(gulp.dest(path.join(prefix, io.independent.out)));
        var streamC = gulp.src(io.config.in)
            .pipe(gulp.dest(path.join(prefix, io.config.out)));
    },
    'build-js': function (mod) {
        let prefix = mod.prefix;
        let bundles = bundling[mod.settings.environment || "development"] ? bundling[mod.settings.environment || "development"] : bundling.default || {};
        if(bundling.global) {
            bundles.js = bundles.js.concat(bundling.global.js || []);
        }
        let streams = [];
        streams.push(new Promise(function(res, rej){
            gulp.src(io.javascript.in)
                .pipe(debug())
                .pipe(sourcemaps.init())
                //only uglifyjs if gulp is ran with '--type production'
                .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
                .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest(path.join(prefix, io.javascript.out)))
                .on('error', rej)
                .on('end', res)
            ;
        }));

        for (let bundle of (bundles.js || [])) {
            let files = bundle.files.map(file => path.join(io.javascript.root, file));
            if (bundle.async) {
                streams.push(new Promise(function(res, rej){
                    gulp.src(files)
                    .pipe(debug())
                    .pipe(sourcemaps.init())
                    .pipe(rollupmep({
                        format: "amd",
                        sourceMap: true
                    }))
                    .pipe(concat(bundle.output))
                    //only uglifyjs if gulp is ran with '--type production'
                    .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
                    .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
                    .pipe(sourcemaps.write('./'))
                    .pipe(gulp.dest(path.join(prefix, io.javascript.out)))
                    .on('error', rej)
                    .on('end', res)
                }));
            } else {
                streams.push(new Promise(function(res, rej){
                gulp.src(files)
                    .pipe(debug())
                    .pipe(sourcemaps.init())
                    .pipe(concat(bundle.output))
                    .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
                    .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
                    .pipe(sourcemaps.write('./'))
                    .pipe(gulp.dest(path.join(prefix, io.javascript.out)))
                    .on('error', rej)
                    .on('end', res)
                }));
            }
        }

        Promise.all(streams)
            .then(_ => {
                browserSync.reload();
                console.log("Js and bundles built")
            })
            .catch(err => {
                console.log(err);
                gutil.beep();
                console.log("Error building javascript");
            })
        ;

        // stream.on('end', browserSync.reload);
    },
    'build-mjs': function (mod) {
        let prefix = mod.prefix;
        let stream = gulp.src(io.multiple.in_js)
            .pipe(debug())
            .pipe(sourcemaps.init())
            //only uglifyjs if gulp is ran with '--type production'
            .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
            .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(prefix, io.multiple.out)))
            .on('error', err => {
                console.log(err);
                gutil.beep();
                console.log("Error building javascript");
            })
        ;

        stream.on('end', browserSync.reload);
    },
    'build-mts': function (mod) {
        let prefix = mod.prefix;
        var stream = gulp.src(io.multiple.in_ts)
            .pipe(debug())
            .pipe(sourcemaps.init())
            .pipe(typescript(typescriptMultipleConfig))
            //only uglifyjs if gulp is ran with '--type production'
            .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
            .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(prefix, io.multiple.out)));
        stream.on('end', browserSync.reload);

        stream.on('error', err => {
            console.log(err);
            gutil.beep();
            console.log("Error building MultipleTs");
        });
        return stream;
    },
    'build-mviews':  function (mod) {
        let prefix = mod.prefix;
        var stream = gulp.src(io.multiple.in_pug)
            .pipe(debug())
            .pipe(pug())
            .pipe(gulp.dest(path.join(prefix, io.multiple.out)));
        stream.on('end', browserSync.reload);
        stream.on('error', err => {
            console.log(err);
            gutil.beep();
            console.log("Error building pug");
        });
    },
    'build-mstatic': function (mod) {
        let prefix = mod.prefix;
        return gulp.src(io.multiple.in_static)
            .pipe(debug())
            .pipe(gulp.dest(path.join(prefix, io.multiple.out)));
    },
    'build-mcss': function (mod) {
        let prefix = mod.prefix;
        var processors = [
            autoprefixer(),
        ];
        var stream = gulp.src(io.multiple.in_css)
            .pipe(debug())
            .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.init())
            .pipe(sass())
            .pipe(postcss(processors))
            .pipe(gutil.env.type === 'production' ? minifyCss() : gutil.noop())
            .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(prefix, io.multiple.out)))
            .on('error', err => {
                console.log(err);
                gutil.beep();
                console.log("Error building javascript");
            })
        ;

        stream.on('end', browserSync.reload);
    },
    'build-serverPure': function (mod) {
        let prefix = mod.prefix;
        return gulp.src(io.server.in)
            .pipe(debug())
            .pipe(sourcemaps.init())
            .pipe(concat('index.js'))
            // has to be fixed
            // .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
            // //only uglifyjs if gulp is ran with '--type production'
            // .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(prefix, io.server.out)))
            .on('error', err => {
                console.log(err);
                gutil.beep();
                console.log("Error building app");
            });
    },
    'build-css': function (mod) {
        let prefix = mod.prefix;
        let bundles = bundling[mod.settings.environment || "development"] ? bundling[mod.settings.environment || "development"] : bundling.default || {};
        if(bundling.global) {
            bundles.css = bundles.css.concat(bundling.global.css || []);
        }
        var processors = [
            autoprefixer(),
        ];
        let streams = [];
        streams.push(new Promise((res, rej) => {
            gulp.src(io.stylesheets.in)
                .on('error', rej)
                .on('end', res)
                .pipe(debug())
                .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.init())
                .pipe(sass())
                .pipe(postcss(processors))
                .pipe(gutil.env.type === 'production' ? minifyCss() : gutil.noop())
                .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.write('./'))
                .pipe(gulp.dest(path.join(prefix, io.stylesheets.out)))
            }
        ));

        for (let bundle of (bundles.css || [])) {
            let files = bundle.files.map(file => path.join(io.stylesheets.root, file));

            streams.push(new Promise((res, rej) => {
                gulp.src(files)
                    .on('error', rej)
                    .on('end', res)
                    .pipe(debug())
                    .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.init())
                    .pipe(sass())
                    .pipe(concat(bundle.output))
                    .pipe(postcss(processors))
                    .pipe(gutil.env.type === 'production' ? minifyCss() : gutil.noop())
                    .pipe(gutil.env.type === 'production' ? gutil.noop() : sourcemaps.write('./'))
                    .pipe(gulp.dest(path.join(prefix, io.stylesheets.out)))
                ;
            }));
        }

        Promise.all(streams).then(_ => {
            console.log("All css built");
            browserSync.reload()
        }).catch(err => {
            console.log(err);
            gutil.beep();
            console.log("Error building css");
        });
    },
    'build-ts': function (mod) {
        let prefix = mod.prefix;
        var stream = gulp.src(io.typescript.in)
            .pipe(debug())
            .pipe(sourcemaps.init())
            .pipe(typescript(typescriptMainConfig))
            //only uglifyjs if gulp is ran with '--type production'
            .pipe(gutil.env.type === 'production' ? traceur() : gutil.noop())
            .pipe(gutil.env.type === 'production' ? uglifyjs() : gutil.noop())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(path.join(prefix, io.typescript.out)));
        stream.on('end', browserSync.reload);

        stream.on('error', err => {
            console.log(err);
            gutil.beep();
            console.log("Error building typescript");
        });
        return stream;
    },
    'build-views': function (mod) {
        let prefix = mod.prefix;
        var stream = gulp.src(io.views.in)
            .pipe(debug())
            .pipe(gulp.dest(path.join(prefix, io.views.out)));
        stream.on('end', browserSync.reload);
        stream.on('error', err => {
            console.log(err);
            gutil.beep();
            console.log("Error building pug");
        });
    },
    'build-static': function (mod) {
        let prefix = mod.prefix;
        return gulp.src(io.static.in)
            .pipe(debug())
            .pipe(gulp.dest(path.join(prefix, io.static.out)));
    },
    'build-multiple': [
        'build-mjs',
        'build-mts',
        'build-mviews',
        'build-mstatic',
        'build-mcss'
    ],
    'build-server': ['build-arch', 'build-serverPure'],
    'build-front': ['build-arch', 'build-js', 'build-static', 'build-css', 'build-views', 'build-ts'],
    'build-all': ['build-front', 'build-server', 'build-multiple'],

    //watch tasks
    'watch-css':  {
        files: watch.stylesheets,
        tasks: ["build-css"]
    },
    'watch-server': {
        files: watch.server,
        tasks: ['build-server']
    },
    'watch-server-dev': {
        files: [...watch.server, watch.dev],
        tasks: ['build-server']
    },
    'watch-js': {
        files: watch.javascript,
        tasks: ['build-js']
    },
    'watch-ts': {
        files: watch.typescript,
        tasks: ['build-ts']
    },
    'watch-views': {
        files: watch.views,
        tasks: ['build-views']
    },
    'watch-multiple': {
        files: watch.multiple,
        tasks: ['build-multiple']
    },
    'watch-front': ['watch-static', 'watch-views', 'watch-js', 'watch-ts', 'watch-css'],
    'watch-all': ['watch-front', 'watch-server', 'watch-multiple'],
    'watch-dev': ['watch-front', 'watch-server', 'watch-server-dev'],

    //Nodemon
    'nodemonPure': function (mod) {

        var started = false;

        return nodemon({
            script: 'radix.js',
            ext: 'js',
            args: ["launch", mod.settings.environment ? "in " + mod.settings.environment : ""],
            watch: watch.server,
            tasks: ['build-all']
        }).on('start', function () {
            if (!started) {
                started = true;
            }
        }).on('restart', function () {

        });
    },
    'nodemon': ['watch-all', 'nodemonPure'],

    //Nodemon dev
    'nodemonPureDev': function (mod) {

        var started = false;

        return nodemon({
            script: 'radix.js',
            ext: 'js',
            args: ["launch", mod.settings.environment ? "in " + mod.settings.environment : ""],
            watch: [watch.server, watch.dev],
            tasks: ['build-all']
        }).on('start', function () {
            if (!started) {
                started = true;
            }
        }).on('restart', function () {

        });
    },
    'nodemon-dev': ['watch-all', 'nodemonPureDev'],

    //browser_sync
    'browser-sync': function (mod) {
        var env = require('../../config/environments.json');
        var node_env = mod.settings.environment || 'development';

        var _ = env[node_env];

        browserSync.init(null, {
            proxy: (_.https || _.http2 ? "https://localhost:":"http://localhost:") + (_.port.toString()),
            files: ["public/**/*.*"],
            browser: _.browser || "",
            port: _.bsport
        });
    },

    //serve
    'serve-normal': ['build-all', 'nodemon', 'browser-sync'],
    'serve-dev': ['build-all', 'nodemon-dev', 'browser-sync']
};

exports.build = ['build-all'];
exports.watch = ['watch-all'];
exports.serve = ['serve-normal'];


//local


function formatSchema(object){
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    let str = "{";
    let i = 0;
    for(let key in object){
        i++;
        if(i > 1) str += ",";
        str += "\n        ";
        str += key + ": {";
        let j = 0;
        for(prop in object[key]){
            j++;
            if(j > 1) str += ", ";
            if(prop == "type"){
                str += prop + ": ";
                switch (object[key]["type"]) {
                    case Schema.ObjectId:
                        str += "Schema.ObjectId";
                        break;
                    default:
                        str += object[key]["type"].name;
                }
            } else {
                str += prop + ": '";
                str += object[key][prop].toString();
                str += "'";
            }
        }
        str += "}"
    }
    str += "\n    }";
    return str;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateFcs(identifiers, mIdentifiers){
    let str = "";
    for(let identifier of identifiers){
        str += `
        by${capitalizeFirstLetter(identifier)}: function(${identifier}) {
            return {
                get: function* get(){
                    return yield model.findOne({${identifier}}).populate(popQuery);
                },
                delete: function* (){
                    return yield model.findOneAndRemove({${identifier}});
                },
                update: function* update(leanInstance){
                    return yield model.findOneAndUpdate({${identifier}}, leanInstance, {new: true});
                }
            }
        },`
    }
    for(let identifier of mIdentifiers){
        str += `
        by${capitalizeFirstLetter(identifier)}: function(${identifier}) {
            return {
                get: function* get(){
                    return yield model.find({${identifier}}).populate(popQuery).lean();
                },
                delete: function* (){
                    return yield model.find({${identifier}}).remove();
                },
                update: function* update(leanInstance){
                    return yield model.update({${identifier}}, leanInstance, { multi: true });
                }
            }
        },`
    }
    return str;
}

function generateEhgs(identifiers, mIdentifiers){
    let str = "";
    for(let identifier of identifiers){
        let tap = capitalizeFirstLetter(identifier);
        str += `
        by${tap}(${identifier}){
            return {
                get(){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).get());
                    }
                },
                delete(){
                    return function*(request, response, next){
                        return yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).delete();
                    }
                },
                update(leanInstance){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).update(
                            conv(leanInstance, request, false)
                        ));
                    }
                }
            }
        },`
    }
    for(let identifier of mIdentifiers){
        let tap = capitalizeFirstLetter(identifier);
        str += `
        by${tap}(${identifier}){
            return {
                get(){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).get());
                    }
                },
                delete(){
                    return function*(request, response, next){
                        return yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).delete();
                    }
                },
                update(leanInstance){
                    return function*(request, response, next){
                        return response.send(yield* model.fcs.by${tap}(
                            conv(${identifier}, request, false)
                        ).update(
                            conv(leanInstance, request, false)
                        ));
                    }
                }
            }
        },`
    }
    return str;
}
