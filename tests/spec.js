var Parser = require('../src/parser');
var parse = new Parser();

describe('simple queries', function () {

  describe('one argument', function () {

    it('should parse empty argument', function () {
      parse('').should.eql([]);
    });

    it('should parse undefined argument', function () {
      parse(undefined).should.eql([]);
    });

    it('should parse string as simple string argument', function () {
      parse('abcdef').should.eql([{
        type: 'string',
        query: 'abcdef'
      }]);
    });

    it('should parse prefixed string as prefixed string argument', function () {
      parse('abc:def').should.eql([{
        type: 'prefix',
        prefix: 'abc',
        query: 'def'
      }]);
    });

    it('should parse several quoted words as single argument', function () {
      parse('"abc def qqq"').should.eql([{
        type: 'string',
        query: 'abc def qqq'
      }]);
    });

    it('should correctly treat unclosed quote', function () {
      parse('"abc def qqq').should.eql([{
        type: 'string',
        query: 'abc def qqq'
      }]);
    });

    it('should parse range arguments', function () {
      parse('15-25').should.eql([{
        type: 'range',
        from: '15',
        to: '25'
      }]);
    });

    it('should parse left range arguments', function () {
      parse('15-').should.eql([{
        type: 'range',
        from: '15',
        to: ''
      }]);
    });

    it('should parse right range arguments', function () {
      parse('-25').should.eql([{
        type: 'range',
        from: '',
        to: '25'
      }]);
    });

    it('should parse prefixed range arguments', function () {
      parse('pref:15-25').should.eql([{
        type: 'prange',
        prefix: 'pref',
        from: '15',
        to: '25'
      }]);
    });

    it('should only apply range arguments for numbers', function () {
      parse('hyphenated-string').should.eql([{
        type: 'string',
        query: 'hyphenated-string'
      }]);
    });

    it('should only apply left range arguments for numbers', function () {
      parse('hyphenated-').should.eql([{
        type: 'string',
        query: 'hyphenated-'
      }]);
    });

    it('should only apply right range arguments for numbers', function () {
      parse('-hyphenated').should.eql([{
        type: 'string',
        query: '-hyphenated'
      }]);
    });

    it('should parse prefixed range arguments', function () {
      parse('pref:hyphenated-string').should.eql([{
        type: 'prefix',
        prefix: 'pref',
        query: 'hyphenated-string'
      }]);
    });

    it('should parse string arguments with flags', function () {
      parse('+*/!#~abcdef').should.eql([{
        flags: ['+', '*', '/', '!', '#', '~'],
        type: 'string',
        query: 'abcdef'
      }]);
    });

    it('should parse several prefixed quoted words with flags', function () {
      parse('+*/!#e:"abcdef qwerty"').should.eql([{
        flags: ['+', '*', '/', '!', '#'],
        type: 'prefix',
        prefix: 'e',
        query: 'abcdef qwerty'
      }]);
    });

    it('should screen special symbols with \\', function() {
      parse('\\+abcdef').should.eql([{
        type: 'string',
        query: '+abcdef'
      }]);
    });

    it('should correctly process flags separated with spaces', function() {
      parse('   +   abcdef   ').should.eql([{
        flags: ['+'],
        type: 'string',
        query: 'abcdef'
      }]);
    });

  });

  describe('several arguments', function() {

    it('should parse two prefixed quoted arguments with flags', function() {
      parse('+*/!#e:"abcdef qwerty" +#q:"foo bar"').should.eql([
        {
          flags: ['+', '*', '/', '!', '#'],
          type: 'prefix',
          prefix: 'e',
          query: 'abcdef qwerty'
        },
        {
          flags: ['+', '#'],
          type: 'prefix',
          prefix: 'q',
          query: 'foo bar'
        }
      ])
    });

  });

});

describe('complex queries', function() {

  describe('logical operators', function() {

    it('should group arguments in braces with AND', function() {
      parse('(abc def)').should.eql([
        {
          type: "and",
          queries: [
            {
              type: "string",
              query: "abc"
            },
            {
              type: "string",
              query: "def"
            }
          ]
        }
      ])
    });

    it('should correctly process closing brace', function() {
      parse('def) abc').should.eql([
        {
          type: "string",
          query: "def)"
        },
        {
          type: "string",
          query: "abc"
        },
      ])
    });

    it('should correctly process opening brace', function() {
      parse('(def abc').should.eql([
        {
          type: "and",
          queries: [
            {
              type: "string",
              query: "def"
            },
            {
              type: "string",
              query: "abc"
            }
          ]
        }
      ])
    });

    it('should not group arguments in screened braces', function() {
      parse('\\(abc def\\)').should.eql([
        {
          type: "string",
          query: "(abc"
        },
        {
          type: "string",
          query: "def)"
        }
      ])
    });

    it('should OR arguments separated by |', function() {
      parse('abc|def').should.eql([
        {
          type: "or",
          queries: [
            {
              type: "string",
              query: "abc"
            },
            {
              type: "string",
              query: "def"
            }
          ]
        }
      ])
    });

    it('should OR arguments in braces separated by |', function() {
      parse('(abc def)|qwe').should.eql([
        {
          type: "or",
          queries: [
            {
              type: "and",
              queries: [
                {
                  type: "string",
                  query: "abc"
                },
                {
                  type: "string",
                  query: "def"
                }
              ]
            },
            {
              type: "string",
              query: "qwe"
            }
          ]
        }
      ])
    });

    it('should OR and AND complex arguments', function() {
      parse('(!e:"abc def" #15)|(+q:"qwe rty" simple)').should.eql([
        {
          type: "or",
          queries: [
            {
              type: "and",
              queries: [
                {
                  flags: ["!"],
                  type: "prefix",
                  prefix: "e",
                  query: "abc def"
                },
                {
                  flags: ["#"],
                  type: "string",
                  query: "15"
                }
              ]
            },
            {
              type: "and",
              queries: [
                {
                  flags: ["+"],
                  type: "prefix",
                  prefix: "q",
                  query: "qwe rty"
                },
                {
                  type: "string",
                  query: "simple"
                }
              ]
            }
          ]
        }
      ])
    });

    it('should do two-level AND grouping', function() {
      parse("(abc ('def q' +qwe))").should.eql([
        {
          type: "and",
          queries: [
            {
              type: "string",
              query: "abc"
            },
            {
              type: "and",
              queries: [
                {
                  type: "string",
                  query: "def q"
                },
                {
                  flags: ["+"],
                  type: "string",
                  query: "qwe"
                }
              ]
            }
          ]
        }
      ])
    });

    it('should do OR grouping in the middle', function() {
      parse("abc def|qwe rty").should.eql([
        {
          type: "string",
          query: "abc"
        },
        {
          type: "or",
          queries: [
            {
              type: "string",
              query: "def"
            },
            {
              type: "string",
              query: "qwe"
            }
          ]
        },
        {
          type: "string",
          query: "rty"
        }
      ])
    });

    it('should OR simple terms in square braces', function() {
      parse("abc [def qwe rty]").should.eql([
        {
          type: "string",
          query: "abc"
        },
        {
          type: "or",
          queries: [
            {
              type: "string",
              query: "def"
            },
            {
              type: "string",
              query: "qwe"
            },
            {
              type: "string",
              query: "rty"
            }
          ]
        }
      ])
    });

    it('should OR complex terms in square braces', function() {
      parse("[abc (+def e:10 p:qwe) rty]").should.eql([
        {
          type: "or",
          queries: [
            {
              type: "string",
              query: "abc"
            },
            {
              type: "and",
              queries: [
                {
                  flags: ["+"],
                  type: "string",
                  query: "def"
                },
                {
                  type: "prefix",
                  prefix: "e",
                  query: "10"
                },
                {
                  type: "prefix",
                  prefix: "p",
                  query: "qwe"
                }
              ]
            },
            {
              type: "string",
              query: "rty"
            }
          ]
        }
      ])
    });

  });

});
