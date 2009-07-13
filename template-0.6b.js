var Template = function (template) {
  this.parse(template);
};

Template.addCustomDefinition = function(tag, definition) {
  
};

Template.tagDefinitions = {

  'var': {
    search: /^(.*)$/,
    replace: 'var $1;'
  },

  'if': {
    search: /^\((.*)\)$/,
    replace: 'if ($1) {'
  },

  'elseif': {
    search: /^\((.*)\)$/,
    replace: '} else if ($1) {'
  },

  'else': {
    search: '',
    replace: '} else {'
  },

  '/if': {
    search: '',
    replace: '}'
  },

  'for': {
    search: /^\((.*)\)$/,
    replace: 'for ($1) {'
  },

  '/for': {
    search: '',
    replace: '}'
  },

  'foreach': {
    search: /^\((?:(.*) as (.*))\)$/,
    replace: 'var $2, _prop;\nfor (_prop in $1) {\n$2 = $1[_prop];'
  },

  '/foreach': {
    search: '',
    replace: '}'
  },

  // Old subroutines didn't support binding of this
  
  // 'sub': {
  //   search: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*)\)$/,
  //   replace: 'var $1 = function ($2) {\nvar html = "";'
  // },
  // 
  // '/sub': {
  //   search: '',
  //   replace: 'return html;\n};'
  // },

  'sub': {
    search: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*)\)$/,
    replace: 'var $1 = (function(fn, scope) {\nreturn function() {\nreturn fn.apply(scope, arguments);\n};\n})(function ($2) {\nvar html = "";'
  },

  '/sub': {
    search: '',
    replace: 'return html;\n}, this);'
  },

  'script': {
    search: '',
    replace: ''
  },
  
  '/script': {
    search: '',
    replace: ''
  },
  
  'log': {
    search: /^\((.*)\)$/,
    replace: 'console.log($1);'
  },
  
  'dir': {
    search: /^\((.*)\)$/,
    replace: 'console.dir($1);'
  }
};


Template.prototype = {


  tagRegExp: (function () {

    var tags = [],
        defs = Template.tagDefinitions,
        tag;

    for (tag in defs) {
      tags.push(tag.replace('/', '\\/'));
    }

    return new RegExp('(?:\\$\\{(.*?)\\})|(?:\\{(' + tags.join('|') + ')(?:\\s+(.*?))?\\})', 'g');

  }()),


  replace: function (match, token, tag, condition, offset) {

    var src, def, defs = Template.tagDefinitions,
        htmlClose = '";\n',
        htmlOpen = '\nhtml += "';

    /**
     * Replace token
     */
    if (token) {
      src = 'html += ' + token + ';';

    /**
     * Replace tag
     */
    } else if (tag in defs) {
      def = defs[tag];
      src = (condition || '')                       // undefined in Safari
        .replace(/\\"/g, '"')
        .replace(def.search, def.replace);

      if (tag === 'script') {
        htmlOpen = '';
      } else if (tag === '/script') {
        htmlClose = '';
      }
    }

    return htmlClose + src + htmlOpen;
  },


  parse: function (tpl) {

    var src = 'var html = "";\nhtml += "' +         // open source code
      tpl.replace(/\s*[\n\r]+\s*/g, ' ')            // strip linebreaks
        .replace(/"/g, '\\"')                       // escape quotes
        .replace(this.tagRegExp, this.replace)      // replace tokens/tags
        // @TODO: Empty string removal not working
        .replace('html += "";\n', '') +             // remove empty strings
      '";\nreturn html;';                           // close source code

    // console.log(src);

    this._render = new Function(src);               // render function
  },


  render: function (data) {
    return this._render.call(data);                 // scoped render function
  }
};
