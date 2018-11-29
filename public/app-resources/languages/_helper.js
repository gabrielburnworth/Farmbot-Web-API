var HelperNamespace = (function () {
  /**
   * @desc Build a list of all the files that are children of a directory
   * @param {string} dir The directory to search
   * @param {list} filelist The list of the directories/files already detected
   * @param {string} ext The extension to filter for the files
   */
  function walkSync(dir, filelist, ext) {
    var path = path || require('path');
    var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        filelist = walkSync(path.join(dir, file), filelist, ext);
      }
      else {
        if (file.indexOf(ext) > 0)
          filelist.push(path.join(dir, file));
      }
    });
    return filelist;
  };

  /**
   * @desc search in the file in parameter to detect the tags
   */
  function searchInFile(path, regex) {
    var fs = fs || require('fs')
    // load the file
    var fileContent = fs.readFileSync(path, 'utf8');
    var strArray = [];
    // match all the groups
    var match = regex.exec(fileContent);
    while (match != null) {
      strArray.push(match[1].replace(/\s+/g, " "))
      match = regex.exec(fileContent);
    }
    return strArray;
  }

  // Locale-aware sort
  function localeSort(a, b) { return a.localeCompare(b); }

  // '.t("")' or '{t("")' or ' t("")' or '(t("")' or
  // '.t(``)' or '{t(``)' or ' t(``)' or '(t(``)'
  var T_REGEX = /[.{(\s]t\(["`]([\w\s{}().,:'\-=\\?\/%!]*)["`].*\)/g;

  // '``'
  var C_REGEX = /[`]([\w\s{}().,:'\-=\\?"+!]*)[`].*/g;

  /**
   * Get all the tags in the files with extension .ts of the current project
   */
  function getAllTags() {
    const srcPath = __dirname + '/../../../webpack';

    var listFilteredFiles = walkSync(srcPath, [], '.ts');
    var allTags = listFilteredFiles.map(function (x) {
      return searchInFile(x, T_REGEX)
    });
    var constantsTags = searchInFile(srcPath + '/constants.ts', C_REGEX);
    const DIAG_MESSAGE_FILE = '/devices/connectivity/diagnostic_messages.ts';
    var diagnosticTags = searchInFile(srcPath + DIAG_MESSAGE_FILE, C_REGEX);

    // flatten list of list in a simple list
    var flatAllTags = [].concat.apply([], allTags);
    var flatConstantsTags = [].concat.apply([], constantsTags);
    var flatDiagnosticTags = [].concat.apply([], diagnosticTags);
    var flatExtraTags = [].concat.apply([],
      ["Fun", "Warn", "Controls", "Device", "Farm Designer", "on",
        "Map Points"]);
    var flattenedTags = [].concat.apply([],
      [flatAllTags, flatConstantsTags, flatDiagnosticTags, flatExtraTags]);

    // distinct
    var uniq = Array.from(new Set(flattenedTags));

    var sorted = uniq.sort(localeSort);

    return sorted;
  }

  /**
   * For debugging
   */
  function logAllTags() {
    console.dir(getAllTags());
  }

  /**
   * Create the translation file or update it with new tags
   * The tags are in the following order:
   * 1. New tags in English that need to be translated (ASC)
   * 2. Tags already translated that match an existing tag in src (ASC)
   * 3. Tags already in the file before but not found at the moment in src (ASC)
   * @param {string} lang The short name of the language.
   */
  function createOrUpdateTranslationFile(lang) {
    lang = lang || 'en';

    // check current file entry
    const langFilePath = __dirname + '/' + lang + '.js';
    var fs = fs || require('fs')

    try {
      var columnsResult = HelperNamespace.getAllTags();

      var jsonCurrentTagData = {};
      columnsResult.forEach(function (column) {
        jsonCurrentTagData[column] = column;
      });

      var ordered = {};
      var fileContent;
      try {
        // check the file can be opened
        var stats = fs.statSync(langFilePath);

        // load the file
        var fileContent = fs.readFileSync(langFilePath, 'utf8');
        if (lang == "en") {
          console.log(`Current file (${lang}.js) content: `);
          console.log(fileContent);
          console.log("Try entering a language code.");
          console.log("For example: `node _helper.js en`");
          return;
        }
      }
      catch (e) { // do this
        console.log("we will create the file: " + langFilePath);
        // If there is no current file, we will create it
      };

      try {
        if (fileContent != undefined) {
          var jsonContent = fileContent
            .replace("module.exports = ", "")
            // regex to delete all comments // and :* in the JSON file
            .replace(/(\/\*(\n|\r|.)*\*\/)|(\/\/.*(\n|\r))/g, "");

          var jsonParsed = JSON.parse(jsonContent);
          const count = Object.keys(jsonParsed).length;
          console.log(`Loaded file ${lang}.js with ${count} items.`);

          Object.keys(jsonParsed).sort().forEach(function (key) {
            ordered[key] = jsonParsed[key];
          });
        }
      } catch (e) {
        console.log("file: " + langFilePath + " contains an error: " + e);
        // If there is an error with the current file content, abort
        return;
      }

      // For debugging
      const debug = process.argv[3];

      // merge new tags with existing translation
      var result = {};
      var unexistingTag = {};
      let existing = 0;
      // all current tags in English
      Object.keys(jsonCurrentTagData).sort(localeSort).map(key => {
        result[key] = jsonCurrentTagData[key];
        if (debug) { result[key] = debug[0].repeat(key.length) }
      })
      for (var key in ordered) {
        // replace current tag with an existing translation
        if (result.hasOwnProperty(key)) {
          delete result[key];
          result[key] = ordered[key];
          if (debug) { result[key] = debug[0].repeat(key.length) }
          existing++;
        }
        // if the tag doesn't exist but a translation exists,
        // put the key/value at the end of the json
        else {
          unexistingTag[key] = ordered[key];
        }
      }
      for (var key in unexistingTag) result[key] = unexistingTag[key];

      // File tag update summary
      const current = Object.keys(jsonCurrentTagData).length;
      const orphans = Object.keys(unexistingTag).length;
      const total = Object.keys(result).length;
      console.log(`${current} strings found.`);
      console.log(`  ${existing} existing translations.`);
      console.log(`  ${current - existing} added.`);
      console.log(`${orphans} unused or outdated translations.`);
      console.log(`Updated file (${lang}.js) with ${total} items.`);

      var stringJson = JSON.stringify(result, null, "    ");
      var newFileContent = "module.exports = " + stringJson;

      fs.writeFileSync(langFilePath, newFileContent);
    } catch (e) {
      console.log("file: " + langFilePath + ". error append: " + e);
    }
  }

  // public functions
  return {
    logAllTags: logAllTags,
    getAllTags: getAllTags,
    createOrUpdateTranslationFile: createOrUpdateTranslationFile
  };
})();

// Need to run this cmd in this folder: node _helper.js
var language = process.argv[2];
HelperNamespace.createOrUpdateTranslationFile(language)
