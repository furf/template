var Template = function (template) {
  this.parse(template);
};

Template.tagDefinitions = {

  'var': {
    search: /^(.*)$/,
    replace: 'var $1;'
  },

  'if': {
    search: /^\((.*)\)$/,
    replace: 'if($1){'
  },

  'elseif': {
    search: /^\((.*)\)$/,
    replace: '}else if($1){'
  },

  'else': {
    search: '',
    replace: '}else{'
  },

  '/if': {
    search: '',
    replace: '}'
  },

  'for': {
    search: /^\((.*)\)$/,
    replace: 'for($1){'
  },

  '/for': {
    search: '',
    replace: '}'
  },

  'foreach': {
    search: /^\((?:(.*) as (.*))\)$/,
    replace: 'var $2,$2__prop,$2_index=-1;for($2__prop in $1){if(!$1.hasOwnProperty($2__prop)){continue;}$2=$1[$2__prop];$2_index++;'
  },

  '/foreach': {
    search: '',
    replace: '}'
  },

  'sub': {
    search: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*)\)$/,
    replace: 'var $1=bind(function($2){var html="";'
  },

  '/sub': {
    search: '',
    replace: 'return html;},this);'
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

Template.bind = function(f, o) {
  return function() {
    return f.apply(o, arguments);
  };
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
        htmlClose = '";',
        htmlOpen = 'html+="';

    /**
     * Replace token
     */
    if (token) {
      src = 'html+=' + token + ';';

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

    tpl = tpl
      .replace(/<!--(.*?)-->/g, '')                 // strip comments
      .replace(/\s+/g, ' ')                         // reduce whitespace
      .replace(/"/g, '\\"')                         // escape quotes
      .replace(this.tagRegExp, this.replace)        // replace tokens/tags
      .replace(/html\+="";/g, '');                  // remove empty strings

    this.src = 'var bind=Template.bind,html="' + tpl + '";return html;';

    this._render = new Function(this.src);          // render function
  },

  render: function (data) {
    return this._render.call(data);                 // scoped render function
  }
};
