const fs = require('fs');
const glob = require('glob');
const yaml = require('js-yaml');
const path = require('path');
const watch = require('watch');
const _ = require('lodash');

function IgnoringWatchFileSystem(wfs, ignorePaths) {
    this.wfs = wfs;
    this.ignorePaths = this.resolvePaths(ignorePaths);
}

// resolve and normalize all paths or let RegExp
IgnoringWatchFileSystem.prototype.resolvePaths = function (paths) {
    return _.map(paths, (p) => {
        if (p instanceof RegExp) return p;

        const resolvedPath = path.posix.resolve(p);
        const normalizedPath = path.normalize(resolvedPath);

        return normalizedPath;
    });
};

IgnoringWatchFileSystem.prototype.watch = function (files, dirs, missing, startTime, options, callback, callbackUndelayed) {
    const isIgnored = (actPath) => (this.ignorePaths.some((p) => {
        if (p instanceof RegExp) {
            return p.test(actPath);
        }

        return actPath.indexOf(p) === 0;
    }));
    const isNotIgnored = (actPath) => (!isIgnored(actPath));

    const ignoredFiles = files.filter(isIgnored);
    const ignoredDirs = dirs.filter(isIgnored);
    const notIgnoredFiles = files.filter(isNotIgnored);
    const notIgnoredDirs = dirs.filter(isNotIgnored);

    const watchCallback = (err, filesModified, dirsModified, missingModified, fileTimestamps, dirTimestamps) => {
        if (err) return callback(err);

        ignoredFiles.forEach((actPath) => {
            // eslint-disable-next-line no-param-reassign
            fileTimestamps[actPath] = 1;
        });

        ignoredDirs.forEach((actPath) => {
            // eslint-disable-next-line no-param-reassign
            dirTimestamps[actPath] = 1;
        });

        return callback(err, filesModified, dirsModified, missingModified, fileTimestamps, dirTimestamps);
    };

    this.wfs.watch(notIgnoredFiles, notIgnoredDirs, missing, startTime, options, watchCallback, callbackUndelayed);
};

function TranslationPlugin(options) {
    // Default options
    this.options = _.extend({
        root: 'src',
        localeDir: 'locales',
        languages: [],
        output: '.',
        jsonSpacing: 4,
        watchLocales: false,
    }, options);
}

TranslationPlugin.prototype.apply = function (compiler) {
    const self = this;

    // ignore generated folder / files
    compiler.plugin('after-environment', () => {
        // eslint-disable-next-line no-param-reassign
        compiler.watchFileSystem = new IgnoringWatchFileSystem(compiler.watchFileSystem, [self.options.output]);
    });

    // add translation files to watch (not generated!)
    if (self.options.watchLocales) {
        compiler.plugin('watch-run', (compilation, callback) => {
            const root = path.posix.resolve(self.options.root);
            const files = glob.sync(`${self.options.root}/**/${self.options.localeDir}/*.yml`);
            const paths = _.map(files, (f) => (path.normalize(path.posix.resolve(f))));

            const onChange = () => {
                compiler.run((error) => {
                    if (error) throw new Error(error);
                });
            };

            watch.createMonitor(root, {
                filter: (file) => {
                    if (fs.lstatSync(file).isDirectory()) return true;

                    return paths.includes(file);
                },
            }, (monitor) => {
                monitor.on('created', onChange);
                monitor.on('changed', onChange);
                monitor.on('removed', onChange);

                callback();
            });
        });
    }

    compiler.plugin('this-compilation', () => {
        // eslint-disable-next-line no-console
        console.log('Creating translations...');

        _.each(self.options.languages, (language) => {
            const files = glob.sync(`${self.options.root}/**/${self.options.localeDir}/${language}.yml`);

            const mergeFilesObject = _.reduce(files, (acc, file) => {
                const pathObject = path.posix.parse(file);
                const pathArray = pathObject.dir.split(path.posix.sep);
                // remove first and last item (root and localeDir)
                const pathKeys = _.slice(pathArray, 1, pathArray.length - 1);

                const fileObject = self.loadFile(file);
                const enhanceKeysObject = _.mapKeys(fileObject, (value, key) => (`${_.join(pathKeys, '.')}.${key}`));

                return _.merge(acc, enhanceKeysObject);
            }, {});

            self.saveFile(language, mergeFilesObject);
        });

        self.saveIndexFile();
    });
};

TranslationPlugin.prototype.loadFile = function (file) {
    try {
        return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        throw new Error(`Wrong YAML format ${file} - ${error}`);
    }
};

TranslationPlugin.prototype.saveFile = function (language, jsonData) {
    const self = this;
    const outputPath = self.options.output;
    const jsonSpacing = self.options.jsonSpacing;

    try {
        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

        const stringifyData = JSON.stringify(jsonData, null, jsonSpacing);
        const comment = '/* eslint-disable */\n// Generated by TranslationPlugin - DO NOT EDIT!!!\n\n';
        const exportFileString = `${comment}export default ${stringifyData};`;

        // save file fo export in application
        fs.writeFile(`${outputPath}/${language}.js`, exportFileString, (err) => {
            if (err) throw err;
        });

        // save json file for human translations
        fs.writeFile(`${outputPath}/${language}.json`, stringifyData, (err) => {
            if (err) throw err;
        });
    } catch (error) {
        throw new Error(`Error during file saving - ${error}`);
    }
};

TranslationPlugin.prototype.saveIndexFile = function () {
    const self = this;
    const outputPath = self.options.output;
    const languages = self.options.languages;
    const jsonSpacing = self.options.jsonSpacing;

    const comment = '// Generated by TranslationPlugin - DO NOT EDIT!!!\n\n';
    const importString = _.reduce(languages, (acc, language) => (`${acc}import ${language} from './${language}';\n`), '');
    const exportString = `export default {\n${_.reduce(languages, (acc, language) => (`${acc}${_.repeat(' ', jsonSpacing)}${language},\n`), '')}};`;

    try {
        fs.writeFile(`${outputPath}/index.js`, `${comment}${importString}\n${exportString}\n`, (err) => {
            if (err) throw err;
        });
    } catch (error) {
        throw new Error(`Error during file saving - ${error}`);
    }
};

module.exports = TranslationPlugin;
