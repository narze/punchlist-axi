#!/usr/bin/env node
// Generated from src/ by `pnpm build` - do not edit.
import { createRequire } from "node:module"; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/quote.js
var require_quote = __commonJS({
  "node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/quote.js"(exports, module) {
    "use strict";
    var OPS = (
      /** @type {const} */
      [
        "||",
        "&&",
        ";;&",
        ";;",
        ";&",
        "|&",
        "<(",
        ">(",
        "<<<",
        "<<-",
        "<<",
        ">>",
        ">&",
        ">|",
        "&>>",
        "&>",
        "<&",
        "<>",
        "&",
        ";",
        "(",
        ")",
        "|",
        "<",
        ">"
      ]
    );
    var LINE_TERMINATORS = /[\n\r\u2028\u2029]/;
    var GLOB_SHELL_SPECIAL = /[\s#!"$&'():;<=>@\\^`|~]/g;
    module.exports = function quote(xs) {
      var sawComment = false;
      return xs.map(function(s) {
        if (sawComment && typeof s === "string" && LINE_TERMINATORS.test(s)) {
          throw new TypeError("a token after a `comment` must not contain line terminators");
        }
        if (s === "") {
          return (
            /** @type {const} */
            "''"
          );
        }
        if (s && typeof s === "object") {
          if ("op" in s && s.op === "glob") {
            if (typeof s.pattern !== "string") {
              throw new TypeError("glob token requires a string `pattern`");
            }
            if (LINE_TERMINATORS.test(s.pattern)) {
              throw new TypeError("glob `pattern` must not contain line terminators");
            }
            if (s.pattern === "") {
              return (
                /** @type {const} */
                "''"
              );
            }
            return s.pattern.replace(GLOB_SHELL_SPECIAL, "\\$&");
          }
          if ("op" in s && typeof s.op === "string") {
            if (OPS.indexOf(s.op) < 0) {
              throw new TypeError("invalid `op` value: " + JSON.stringify(s.op));
            }
            return s.op.replace(/[\s\S]/g, "\\$&");
          }
          if ("comment" in s && typeof s.comment === "string") {
            if (LINE_TERMINATORS.test(s.comment)) {
              throw new TypeError("`comment` must not contain line terminators");
            }
            sawComment = true;
            return "#" + s.comment;
          }
          throw new TypeError("unrecognized object token shape");
        }
        if (/'/.test(s) && /!/.test(s)) {
          return "'" + s.replace(/'/g, `'"'"'`) + "'";
        }
        if (/["\s\\]/.test(s) && !/'/.test(s)) {
          return "'" + s + "'";
        }
        if (/["'\s]/.test(s)) {
          return '"' + s.replace(/(["\\$`])/g, "\\$1") + '"';
        }
        return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}~])/g, "$1\\$2");
      }).join(" ");
    };
  }
});

// node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/parse.js
var require_parse = __commonJS({
  "node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/parse.js"(exports, module) {
    "use strict";
    var CONTROL = (
      /** @type {const} */
      "(?:" + /** @type {const} */
      [
        "\\|\\|",
        "\\&(?:\\&|>>?)",
        // `&&`, `&>`, and `&>>`
        ";;\\&?",
        // `;;` and `;;&`
        "[;|]\\&",
        // `;&` and `|&`
        "\\<\\(",
        "\\<\\<\\<",
        "\\<\\<-",
        "\\<\\<(?!\\()",
        // `<<(` stays `<` and `<(`, as zsh reads it; other shells reject it
        ">>",
        ">[&|(]",
        // `>&`, `>|`, and `>(`
        "<[&>]",
        // `<&` and `<>`
        "[&;()|<>]"
      ].join(
        /** @type {const} */
        "|"
      ) + /** @type {const} */
      ")"
    );
    var controlRE = new RegExp("^" + CONTROL + "$");
    var META = (
      /** @type {const} */
      "|&;()<> \\t"
    );
    var SINGLE_QUOTE = (
      /** @type {const} */
      "'([^']*?)'"
    );
    var ANSI_C_BODY = "(?:\\\\[\\s\\S]|[^\\\\'])*?";
    var ANSI_C_QUOTE = "\\$'" + ANSI_C_BODY + "'";
    var ansiCAt = new RegExp("\\$'" + ANSI_C_BODY + "(?:(')|\\\\?$)", "g");
    var ANSI_C_LETTERS = "abeEfnrtv";
    var ANSI_C_CHARS = "\x07\b\x1B\x1B\f\n\r	\v";
    var hash = /^#$/;
    var SQ = (
      /** @type {const} */
      "'"
    );
    var DQ = (
      /** @type {const} */
      '"'
    );
    var DS = (
      /** @type {const} */
      "$"
    );
    var TOKEN = "";
    var mult = (
      /** @type {const} */
      4294967296
    );
    for (i = 0; i < 4; i++) {
      TOKEN += (mult * Math.random()).toString(16);
    }
    var i;
    var startsWithToken = new RegExp("^" + TOKEN);
    function matchAll(s, r) {
      var origIndex = r.lastIndex;
      var matches = [];
      var matchObj;
      while (matchObj = r.exec(s)) {
        matches[matches.length] = matchObj;
        if (r.lastIndex === matchObj.index) {
          r.lastIndex += 1;
        }
      }
      r.lastIndex = origIndex;
      return matches;
    }
    function getVar(env, pre, key) {
      var r = typeof env === "function" ? env(key) : env[key];
      if (typeof r === "undefined" && key != "") {
        r = "";
      } else if (typeof r === "undefined") {
        r = "$";
      }
      if (typeof r === "object") {
        return pre + TOKEN + JSON.stringify(r) + TOKEN;
      }
      return pre + r;
    }
    var ansiCEscape = /\\([0-7]{1,3}|x[\dA-Fa-f]{1,2}|u[\dA-Fa-f]{1,4}|U[\dA-Fa-f]{1,8}|c(?:\\\\|[\s\S])|[abeEfnrtv\\'"?])/g;
    function expandAnsiCEscape(m, escape) {
      var kind = escape.charAt(0);
      if (kind === "c") {
        var ctrl = escape.charAt(1);
        return ctrl === "?" ? "\x7F" : String.fromCharCode(ctrl.charCodeAt(0) & 31);
      }
      if (kind === "x" || kind === "u" || kind === "U") {
        var cp = parseInt(escape.slice(1), 16);
        if (cp > 1114111) {
          return m;
        }
        return String.fromCharCode.apply(null, cp > 65535 ? [55232 + (cp >> 10), 56320 + (cp & 1023)] : [cp]);
      }
      if (kind >= "0" && kind <= "7") {
        return String.fromCharCode(parseInt(escape, 8) & 255);
      }
      var letter = ANSI_C_LETTERS.indexOf(escape);
      return letter < 0 ? escape : ANSI_C_CHARS.charAt(letter);
    }
    function expandAnsiC(body) {
      return body.replace(ansiCEscape, expandAnsiCEscape).split("\0")[0];
    }
    function closesAnsiC(s, i2) {
      ansiCAt.lastIndex = i2;
      return !!/** @type {RegExpExecArray} */
      ansiCAt.exec(s)[1];
    }
    function parseInternal(string, env, opts) {
      if (!opts) {
        opts = {};
      }
      var BS = opts.escape || "\\";
      var ifs = opts.splitUnquoted === true ? " 	\n" : typeof opts.splitUnquoted === "string" ? opts.splitUnquoted : "";
      var BAREWORD = "(\\" + BS + `['"$\\` + BS + META + "]|\\$\\$|\\$(?!" + ANSI_C_QUOTE.slice(2) + `)|[^\\s'"$` + META + "])+";
      var DOUBLE_QUOTE = '"(?:\\' + BS + '[\\s\\S]|[^"\\' + BS + '])*"';
      var chunker = new RegExp([
        "(" + CONTROL + ")",
        // control chars
        "(" + ANSI_C_QUOTE + "|" + BAREWORD + "|" + DOUBLE_QUOTE + "|" + SINGLE_QUOTE + ")+"
      ].join("|"), "g");
      var matches = matchAll(string, chunker);
      if (matches.length === 0) {
        return [];
      }
      if (!env) {
        env = {};
      }
      var commented = false;
      return matches.map(function(match) {
        var s = match[0];
        if (!s || commented) {
          return void 0;
        }
        if (controlRE.test(s)) {
          return (
            /** @type {ControlOperator} */
            { op: s }
          );
        }
        var quote = false;
        var esc = false;
        var out = "";
        var words = [];
        var sawQuote = false;
        var pendingNw = null;
        var isGlob = false;
        var i2;
        function parseEnvVar() {
          i2 += 1;
          var varend;
          var varname;
          var char = s.charAt(i2);
          if (char === "{") {
            i2 += 1;
            if (s.charAt(i2) === "}") {
              throw new Error("Bad substitution: " + s.slice(i2 - 2, i2 + 1));
            }
            var depth = 1;
            varend = i2;
            while (depth > 0 && varend < s.length) {
              if (s.charAt(varend) === "{" && s.charAt(varend - 1) === "$") {
                depth += 1;
              } else if (s.charAt(varend) === "}") {
                depth -= 1;
              }
              varend += 1;
            }
            if (depth !== 0) {
              throw new Error("Bad substitution: " + s.slice(i2));
            }
            varend -= 1;
            varname = s.slice(i2, varend);
            i2 = varend;
          } else if (/[*@#?$!-]/.test(char)) {
            varname = char;
          } else {
            var slicedFromI = s.slice(i2);
            varend = slicedFromI.match(/[^\w\d_]/);
            if (!varend) {
              varname = slicedFromI;
              i2 = s.length;
            } else {
              varname = slicedFromI.slice(0, varend.index);
              i2 += /** @type {number} */
              varend.index - 1;
            }
          }
          return getVar(
            /** @type {NonNullable<typeof env>} */
            env,
            "",
            varname
          );
        }
        function flushRun() {
          if (pendingNw === null) {
            return;
          }
          if (pendingNw === 0) {
            if (out !== "") {
              words[words.length] = out;
              out = "";
            }
          } else {
            words[words.length] = out;
            out = "";
            for (var fe = 1; fe < pendingNw; fe += 1) {
              words[words.length] = "";
            }
          }
          pendingNw = null;
        }
        for (i2 = 0; i2 < s.length; i2++) {
          var c = s.charAt(i2);
          if (ifs && c !== DS) {
            flushRun();
          }
          isGlob = isGlob || !quote && (c === "*" || c === "?");
          if (esc) {
            out += c;
            esc = false;
          } else if (quote) {
            if (c === quote) {
              quote = false;
            } else if (quote == SQ) {
              out += c;
            } else {
              if (c === BS) {
                i2 += 1;
                c = s.charAt(i2);
                if (c === DQ || c === BS || c === DS) {
                  out += c;
                } else {
                  out += BS + c;
                }
              } else if (c === DS) {
                out += parseEnvVar();
              } else {
                out += c;
              }
            }
          } else if (c === DQ || c === SQ) {
            quote = c;
            sawQuote = true;
          } else if (controlRE.test(c)) {
            return (
              /** @type {ControlOperator} */
              { op: s }
            );
          } else if (hash.test(c)) {
            commented = true;
            var commentObj = { comment: string.slice(match.index + i2 + 1) };
            if (out.length) {
              return (
                /** @type {const} */
                [out, commentObj]
              );
            }
            return (
              /** @type {const} */
              [commentObj]
            );
          } else if (c === BS) {
            esc = true;
          } else if (c === DS && s.charAt(i2 + 1) === SQ && closesAnsiC(s, i2)) {
            flushRun();
            sawQuote = true;
            out += expandAnsiC(s.slice(i2 + 2, ansiCAt.lastIndex - 1));
            i2 = ansiCAt.lastIndex - 1;
          } else if (c === DS) {
            var value = parseEnvVar();
            if (!ifs) {
              out += value;
            } else {
              for (var vi = 0; vi < value.length; vi += 1) {
                var vc = value.charAt(vi);
                if (ifs.indexOf(vc) < 0) {
                  flushRun();
                  out += vc;
                } else if (pendingNw === null) {
                  pendingNw = vc === " " || vc === "	" || vc === "\n" ? 0 : 1;
                } else if (vc !== " " && vc !== "	" && vc !== "\n") {
                  pendingNw += 1;
                }
              }
            }
          } else {
            out += c;
          }
        }
        if (isGlob) {
          return (
            /** @type {GlobPattern} */
            { op: "glob", pattern: out }
          );
        }
        if (ifs) {
          if (pendingNw !== null && pendingNw > 0) {
            words[words.length] = out;
            out = "";
            for (var te = 1; te < pendingNw; te += 1) {
              words[words.length] = "";
            }
          }
          if (out !== "" || sawQuote && words.length === 0) {
            words[words.length] = out;
          }
          return words;
        }
        return out;
      }).reduce(
        function(prev, arg) {
          if (typeof arg === "undefined") {
            return prev;
          }
          [].concat(arg).forEach(function(entry) {
            prev[prev.length] = entry;
          });
          return prev;
        },
        /** @type {ParseEntry[]} */
        []
      );
    }
    module.exports = function parse(s, env, opts) {
      var mapped = parseInternal(s, env, opts);
      if (typeof env !== "function") {
        return mapped;
      }
      return mapped.reduce(
        function(acc, s2) {
          if (typeof s2 === "object") {
            acc[acc.length] = s2;
            return acc;
          }
          var xs = s2.split(RegExp("(" + TOKEN + ".*?" + TOKEN + ")", "g"));
          if (xs.length === 1) {
            acc[acc.length] = xs[0];
            return acc;
          }
          xs.filter(Boolean).forEach(function(x) {
            acc[acc.length] = startsWithToken.test(x) ? JSON.parse(x.split(TOKEN)[1]) : x;
          });
          return acc;
        },
        /** @type {ParseEntry[]} */
        []
      );
    };
  }
});

// node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/index.js
var require_shell_quote = __commonJS({
  "node_modules/.pnpm/shell-quote@1.12.0/node_modules/shell-quote/index.js"(exports) {
    "use strict";
    exports.quote = require_quote();
    exports.parse = require_parse();
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/macos.js
var require_macos = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/macos.js"(exports, module) {
    module.exports = {
      "/Applications/Atom.app/Contents/MacOS/Atom": "atom",
      "/Applications/Atom Beta.app/Contents/MacOS/Atom Beta": "/Applications/Atom Beta.app/Contents/MacOS/Atom Beta",
      "/Applications/Brackets.app/Contents/MacOS/Brackets": "brackets",
      "/Applications/Sublime Text.app/Contents/MacOS/Sublime Text": "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
      "/Applications/Sublime Text.app/Contents/MacOS/sublime_text": "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
      "/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2": "/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl",
      "/Applications/Sublime Text Dev.app/Contents/MacOS/Sublime Text": "/Applications/Sublime Text Dev.app/Contents/SharedSupport/bin/subl",
      "/Applications/Visual Studio Code.app/Contents/MacOS/Code": "code",
      "/Applications/Visual Studio Code.app/Contents/MacOS/Electron": "code",
      "/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Code - Insiders": "code-insiders",
      "/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron": "code-insiders",
      "/Applications/VSCodium.app/Contents/MacOS/Electron": "codium",
      "/Applications/Cursor.app/Contents/MacOS/Cursor": "cursor",
      "/Applications/Trae.app/Contents/MacOS/Electron": "trae",
      "/Applications/Antigravity.app/Contents/MacOS/Electron": "antigravity",
      "/Applications/AppCode.app/Contents/MacOS/appcode": "/Applications/AppCode.app/Contents/MacOS/appcode",
      "/Applications/CLion.app/Contents/MacOS/clion": "/Applications/CLion.app/Contents/MacOS/clion",
      "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea": "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea",
      "/Applications/IntelliJ IDEA Ultimate.app/Contents/MacOS/idea": "/Applications/IntelliJ IDEA Ultimate.app/Contents/MacOS/idea",
      "/Applications/IntelliJ IDEA Community Edition.app/Contents/MacOS/idea": "/Applications/IntelliJ IDEA Community Edition.app/Contents/MacOS/idea",
      "/Applications/PhpStorm.app/Contents/MacOS/phpstorm": "/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
      "/Applications/PyCharm.app/Contents/MacOS/pycharm": "/Applications/PyCharm.app/Contents/MacOS/pycharm",
      "/Applications/PyCharm CE.app/Contents/MacOS/pycharm": "/Applications/PyCharm CE.app/Contents/MacOS/pycharm",
      "/Applications/RubyMine.app/Contents/MacOS/rubymine": "/Applications/RubyMine.app/Contents/MacOS/rubymine",
      "/Applications/WebStorm.app/Contents/MacOS/webstorm": "/Applications/WebStorm.app/Contents/MacOS/webstorm",
      "/Applications/MacVim.app/Contents/MacOS/MacVim": "mvim",
      "/Applications/GoLand.app/Contents/MacOS/goland": "/Applications/GoLand.app/Contents/MacOS/goland",
      "/Applications/Rider.app/Contents/MacOS/rider": "/Applications/Rider.app/Contents/MacOS/rider",
      "/Applications/Zed.app/Contents/MacOS/zed": "zed"
    };
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/linux.js
var require_linux = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/linux.js"(exports, module) {
    module.exports = {
      atom: "atom",
      Brackets: "brackets",
      "code-insiders": "code-insiders",
      code: "code",
      vscodium: "vscodium",
      codium: "codium",
      cursor: "cursor",
      trae: "trae",
      antigravity: "antigravity",
      emacs: "emacs",
      gvim: "gvim",
      idea: "idea",
      "idea.sh": "idea",
      phpstorm: "phpstorm",
      "phpstorm.sh": "phpstorm",
      pycharm: "pycharm",
      "pycharm.sh": "pycharm",
      rubymine: "rubymine",
      "rubymine.sh": "rubymine",
      sublime_text: "subl",
      vim: "vim",
      webstorm: "webstorm",
      "webstorm.sh": "webstorm",
      goland: "goland",
      "goland.sh": "goland",
      rider: "rider",
      "rider.sh": "rider",
      zed: "zed"
    };
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/windows.js
var require_windows = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/editor-info/windows.js"(exports, module) {
    module.exports = [
      "Brackets.exe",
      "Code.exe",
      "Code - Insiders.exe",
      "VSCodium.exe",
      "Cursor.exe",
      "atom.exe",
      "sublime_text.exe",
      "notepad++.exe",
      "clion.exe",
      "clion64.exe",
      "idea.exe",
      "idea64.exe",
      "phpstorm.exe",
      "phpstorm64.exe",
      "pycharm.exe",
      "pycharm64.exe",
      "rubymine.exe",
      "rubymine64.exe",
      "webstorm.exe",
      "webstorm64.exe",
      "goland.exe",
      "goland64.exe",
      "rider.exe",
      "rider64.exe",
      "Trae.exe",
      "zed.exe",
      "Antigravity.exe"
    ];
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/guess.js
var require_guess = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/guess.js"(exports, module) {
    var path2 = __require("path");
    var shellQuote = require_shell_quote();
    var childProcess = __require("child_process");
    var COMMON_EDITORS_MACOS = require_macos();
    var COMMON_EDITORS_LINUX = require_linux();
    var COMMON_EDITORS_WIN = require_windows();
    function getEditorFromMacProcesses(output) {
      const processNames = Object.keys(COMMON_EDITORS_MACOS);
      const processList = output.split("\n");
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i];
        if (processList.includes(processName)) {
          return COMMON_EDITORS_MACOS[processName];
        }
        const processNameWithoutApplications = processName.replace("/Applications", "");
        if (output.indexOf(processNameWithoutApplications) !== -1) {
          if (processName !== COMMON_EDITORS_MACOS[processName]) {
            return COMMON_EDITORS_MACOS[processName];
          }
          const runningProcess = processList.find(
            (procName) => procName.endsWith(processNameWithoutApplications)
          );
          if (runningProcess !== void 0) {
            return runningProcess;
          }
        }
      }
      return void 0;
    }
    function getEditorFromWindowsProcesses(output) {
      const runningProcesses = output.split("\r\n");
      for (let i = 0; i < runningProcesses.length; i++) {
        const fullProcessPath = runningProcesses[i].trim();
        const shortProcessName = path2.win32.basename(fullProcessPath);
        if (COMMON_EDITORS_WIN.indexOf(shortProcessName) !== -1) {
          return fullProcessPath;
        }
      }
      return void 0;
    }
    function getEditorFromLinuxProcesses(output) {
      const processNames = Object.keys(COMMON_EDITORS_LINUX);
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i];
        if (output.indexOf(processName) !== -1) {
          return COMMON_EDITORS_LINUX[processName];
        }
      }
      return void 0;
    }
    function guessEditor(specifiedEditor) {
      if (specifiedEditor) {
        return shellQuote.parse(specifiedEditor);
      }
      if (process.env.LAUNCH_EDITOR) {
        return [process.env.LAUNCH_EDITOR];
      }
      if (process.versions.webcontainer) {
        return [process.env.EDITOR || "code"];
      }
      try {
        if (process.platform === "darwin") {
          const output = childProcess.execSync("ps x -o comm=", {
            stdio: ["pipe", "pipe", "ignore"]
          }).toString();
          const editor = getEditorFromMacProcesses(output);
          if (editor !== void 0) {
            return [editor];
          }
        } else if (process.platform === "win32") {
          const output = childProcess.execSync(
            'powershell -NoProfile -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8;Get-CimInstance -Query \\"select executablepath from win32_process where executablepath is not null\\" | % { $_.ExecutablePath }"',
            {
              stdio: ["pipe", "pipe", "ignore"]
            }
          ).toString();
          const editor = getEditorFromWindowsProcesses(output);
          if (editor !== void 0) {
            return [editor];
          }
        } else if (process.platform === "linux") {
          const output = childProcess.execSync("ps x --no-heading -o comm --sort=comm", {
            stdio: ["pipe", "pipe", "ignore"]
          }).toString();
          const editor = getEditorFromLinuxProcesses(output);
          if (editor !== void 0) {
            return [editor];
          }
        }
      } catch (ignoreError) {
      }
      if (process.env.VISUAL) {
        return [process.env.VISUAL];
      } else if (process.env.EDITOR) {
        return [process.env.EDITOR];
      }
      return [null];
    }
    module.exports = guessEditor;
    module.exports.getEditorFromMacProcesses = getEditorFromMacProcesses;
    module.exports.getEditorFromWindowsProcesses = getEditorFromWindowsProcesses;
    module.exports.getEditorFromLinuxProcesses = getEditorFromLinuxProcesses;
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/get-args.js
var require_get_args = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/get-args.js"(exports, module) {
    var os2 = __require("os");
    var path2 = __require("path");
    module.exports = function getArgumentsForFile(editor, fileName, lineNumber, columnNumber = 1) {
      fileName = path2.resolve(fileName);
      if (process.platform === "linux" && fileName.startsWith("/mnt/") && /Microsoft/i.test(os2.release())) {
        fileName = `./${path2.relative("", fileName)}`;
      }
      if (!lineNumber) {
        return [fileName];
      }
      const editorBasename = path2.basename(editor).replace(/\.(exe|cmd|bat)$/i, "");
      switch (editorBasename) {
        case "atom":
        case "Atom":
        case "Atom Beta":
        case "subl":
        case "sublime":
        case "sublime_text":
        case "wstorm":
        case "charm":
        case "zed":
          return [`${fileName}:${lineNumber}:${columnNumber}`];
        case "notepad++":
          return ["-n" + lineNumber, "-c" + columnNumber, fileName];
        case "vim":
        case "mvim":
          return [`+call cursor(${lineNumber}, ${columnNumber})`, fileName];
        case "joe":
        case "gvim":
          return [`+${lineNumber}`, fileName];
        case "emacs":
        case "emacsclient":
          return [`+${lineNumber}:${columnNumber}`, fileName];
        case "rmate":
        case "mate":
        case "mine":
          return ["--line", lineNumber, fileName];
        case "code":
        case "Code":
        case "code-insiders":
        case "Code - Insiders":
        case "codium":
        case "trae":
        case "antigravity":
        case "cursor":
        case "vscodium":
        case "VSCodium":
          return ["-r", "-g", `${fileName}:${lineNumber}:${columnNumber}`];
        case "appcode":
        case "clion":
        case "clion64":
        case "idea":
        case "idea64":
        case "phpstorm":
        case "phpstorm64":
        case "pycharm":
        case "pycharm64":
        case "rubymine":
        case "rubymine64":
        case "webstorm":
        case "webstorm64":
        case "goland":
        case "goland64":
        case "rider":
        case "rider64":
          return ["--line", lineNumber, "--column", columnNumber, fileName];
      }
      if (process.env.LAUNCH_EDITOR) {
        return [fileName, lineNumber, columnNumber];
      }
      return [fileName];
    };
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/construct-windows-launch-command.js
var require_construct_windows_launch_command = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/construct-windows-launch-command.js"(exports, module) {
    function escapeCmdArgs(cmdArgs) {
      return cmdArgs.replace(/([&|<>,;=^])/g, "^$1");
    }
    function doubleQuoteIfNeeded(str) {
      if (str.includes("^")) {
        return `^"${str}^"`;
      } else if (str.includes(" ")) {
        return `"${str}"`;
      }
      return str;
    }
    function constructWindowsLaunchCommand(editor, args) {
      if (args.some((arg) => /[\r\n]/.test(arg))) {
        throw new Error("Cannot launch an editor with an argument containing a line break");
      }
      if (args.some((arg) => arg.includes("%"))) {
        throw new Error('Cannot launch an editor with an argument containing "%"');
      }
      return [editor, ...args.map(escapeCmdArgs)].map(doubleQuoteIfNeeded).join(" ");
    }
    module.exports = constructWindowsLaunchCommand;
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/parse-file.js
var require_parse_file = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/parse-file.js"(exports, module) {
    var path2 = __require("path");
    var positionRE = /:(\d+)(:(\d+))?$/;
    module.exports = function parseFile(file) {
      if (file.startsWith("file://")) {
        file = __require("url").fileURLToPath(file);
      }
      const unresolvedFileName = file.replace(positionRE, "");
      const fileName = unresolvedFileName ? path2.resolve(unresolvedFileName) : "";
      const match = file.match(positionRE);
      const lineNumber = match && match[1];
      const columnNumber = match && match[3];
      return {
        fileName,
        lineNumber,
        columnNumber
      };
    };
  }
});

// node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/index.js
var require_launch_editor = __commonJS({
  "node_modules/.pnpm/launch-editor@2.14.2/node_modules/launch-editor/index.js"(exports, module) {
    var fs2 = __require("fs");
    var path2 = __require("path");
    var colors = require_picocolors();
    var childProcess = __require("child_process");
    var guessEditor = require_guess();
    var getArgumentsForFile = require_get_args();
    var constructWindowsLaunchCommand = require_construct_windows_launch_command();
    var parseFile = require_parse_file();
    function wrapErrorCallback(cb) {
      return (fileName, errorMessage2) => {
        console.log();
        console.log(colors.red("Could not open " + path2.basename(fileName) + " in the editor."));
        if (errorMessage2) {
          if (errorMessage2[errorMessage2.length - 1] !== ".") {
            errorMessage2 += ".";
          }
          console.log(colors.red("The editor process exited with an error: " + errorMessage2));
        }
        console.log();
        if (cb) cb(fileName, errorMessage2);
      };
    }
    function isTerminalEditor(editor) {
      switch (editor) {
        case "vim":
        case "emacs":
        case "nano":
          return true;
      }
      return false;
    }
    var currentChildProcess = null;
    function launchEditor2(file, specifiedEditor, onErrorCallback) {
      const { fileName, lineNumber, columnNumber } = parseFile(file);
      if (typeof specifiedEditor === "function") {
        onErrorCallback = specifiedEditor;
        specifiedEditor = void 0;
      }
      onErrorCallback = wrapErrorCallback(onErrorCallback);
      if (process.platform === "win32" && fileName.startsWith("\\\\")) {
        return onErrorCallback(
          fileName,
          "UNC paths are not supported on Windows to avoid security issues. See https://github.com/vitejs/launch-editor/tree/main/packages/launch-editor#unc-paths-on-windows for details."
        );
      }
      if (!fs2.existsSync(fileName)) {
        return;
      }
      const [editor, ...args] = guessEditor(specifiedEditor);
      if (!editor) {
        onErrorCallback(fileName, null);
        return;
      }
      const extraArgs = getArgumentsForFile(editor, fileName, lineNumber, columnNumber);
      args.push.apply(args, extraArgs);
      let launchCommand;
      if (process.platform === "win32") {
        try {
          launchCommand = constructWindowsLaunchCommand(editor, args);
        } catch (error) {
          onErrorCallback(fileName, error.message);
          return;
        }
      }
      if (currentChildProcess && isTerminalEditor(editor)) {
        currentChildProcess.kill("SIGKILL");
      }
      if (process.platform === "win32") {
        currentChildProcess = childProcess.exec(launchCommand, {
          stdio: "inherit",
          shell: true
        });
      } else {
        currentChildProcess = childProcess.spawn(editor, args, { stdio: "inherit" });
      }
      currentChildProcess.on("exit", function(errorCode) {
        currentChildProcess = null;
        if (errorCode) {
          onErrorCallback(fileName, "(code " + errorCode + ")");
        }
      });
      currentChildProcess.on("error", function(error) {
        let { code, message } = error;
        if ("ENOENT" === code) {
          message = `${message} ('${editor}' command does not exist in 'PATH')`;
        }
        onErrorCallback(fileName, message);
      });
    }
    module.exports = launchEditor2;
  }
});

// src/cli.ts
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import zlib from "node:zlib";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawn as spawn2 } from "node:child_process";
import { fileURLToPath } from "node:url";

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/cli.js
import { basename as basename2 } from "node:path";

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/errors.js
var AxiError = class extends Error {
  code;
  suggestions;
  constructor(message, code, suggestions = []) {
    super(message);
    this.code = code;
    this.suggestions = suggestions;
    this.name = "AxiError";
  }
};
function exitCodeForError(error) {
  if (error instanceof AxiError && error.code === "VALIDATION_ERROR") {
    return 2;
  }
  return 1;
}

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/output.js
import { homedir } from "node:os";

// node_modules/.pnpm/@toon-format+toon@2.3.1/node_modules/@toon-format/toon/dist/index.mjs
var NULL_LITERAL = "null";
var DELIMITERS = {
  comma: ",",
  tab: "	",
  pipe: "|"
};
var DEFAULT_DELIMITER = DELIMITERS.comma;
function escapeString(value) {
  return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`).replace(/\n/g, `\\n`).replace(/\r/g, `\\r`).replace(/\t/g, `\\t`).replace(/[\u0000-\u001F]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function isBooleanOrNullLiteral(token) {
  return token === "true" || token === "false" || token === "null";
}
function setOwnProperty(target, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(target, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true
    });
    return;
  }
  target[key] = value;
}
function normalizeValue(value) {
  if (value === null) return null;
  if (typeof value === "object" && value !== null && "toJSON" in value && typeof value.toJSON === "function") {
    const next = value.toJSON();
    if (next !== value) return normalizeValue(next);
  }
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Object.is(value, -0)) return 0;
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === "bigint") {
    if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) return Number(value);
    return value.toString();
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value instanceof Set) return Array.from(value).map(normalizeValue);
  if (value instanceof Map) return Object.fromEntries(Array.from(value, ([k, v]) => [String(k), normalizeValue(v)]));
  if (isPlainObject(value)) {
    const encodedValues = {};
    for (const key in value) if (Object.hasOwn(value, key)) setOwnProperty(encodedValues, key, normalizeValue(value[key]));
    return encodedValues;
  }
  return null;
}
function isJsonPrimitive(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isJsonArray(value) {
  return Array.isArray(value);
}
function isJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isEmptyObject(value) {
  return Object.keys(value).length === 0;
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}
function isArrayOfPrimitives(value) {
  return value.length === 0 || value.every((item) => isJsonPrimitive(item));
}
function isArrayOfArrays(value) {
  return value.length === 0 || value.every((item) => isJsonArray(item));
}
function isArrayOfObjects(value) {
  return value.length === 0 || value.every((item) => isJsonObject(item));
}
var NUMERIC_LIKE_PATTERN = /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
var LEADING_ZERO_PATTERN = /^0\d+$/;
function isValidUnquotedKey(key) {
  return /^[A-Z_][\w.]*$/i.test(key);
}
function isIdentifierSegment(key) {
  return /^[A-Z_]\w*$/i.test(key);
}
function isSafeUnquoted(value, delimiter2 = DEFAULT_DELIMITER) {
  if (!value) return false;
  if (value !== value.trim()) return false;
  if (isBooleanOrNullLiteral(value) || isNumericLike(value)) return false;
  if (value.includes(":")) return false;
  if (value.includes('"') || value.includes("\\")) return false;
  if (/[[\]{}]/.test(value)) return false;
  if (/[\u0000-\u001F]/.test(value)) return false;
  if (value.includes(delimiter2)) return false;
  if (value.startsWith("-")) return false;
  return true;
}
function isNumericLike(value) {
  return NUMERIC_LIKE_PATTERN.test(value) || LEADING_ZERO_PATTERN.test(value);
}
function tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, flattenDepth) {
  if (options.keyFolding !== "safe") return;
  if (!isJsonObject(value)) return;
  const { segments, tail, leafValue } = collectSingleKeyChain(key, value, flattenDepth ?? options.flattenDepth);
  if (segments.length < 2) return;
  if (!segments.every((seg) => isIdentifierSegment(seg))) return;
  const foldedKey = buildFoldedKey(segments);
  const absolutePath = pathPrefix ? `${pathPrefix}.${foldedKey}` : foldedKey;
  if (siblings.includes(foldedKey)) return;
  if (rootLiteralKeys && rootLiteralKeys.has(absolutePath)) return;
  return {
    foldedKey,
    remainder: tail,
    leafValue,
    segmentCount: segments.length
  };
}
function collectSingleKeyChain(startKey, startValue, maxDepth) {
  const segments = [startKey];
  let currentValue = startValue;
  while (segments.length < maxDepth) {
    if (!isJsonObject(currentValue)) break;
    const keys = Object.keys(currentValue);
    if (keys.length !== 1) break;
    const nextKey = keys[0];
    const nextValue = currentValue[nextKey];
    segments.push(nextKey);
    currentValue = nextValue;
  }
  if (!isJsonObject(currentValue) || isEmptyObject(currentValue)) return {
    segments,
    tail: void 0,
    leafValue: currentValue
  };
  return {
    segments,
    tail: currentValue,
    leafValue: currentValue
  };
}
function buildFoldedKey(segments) {
  return segments.join(".");
}
function encodePrimitive(value, delimiter2) {
  if (value === null) return NULL_LITERAL;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  return encodeStringLiteral(value, delimiter2);
}
function encodeStringLiteral(value, delimiter2 = DEFAULT_DELIMITER) {
  if (isSafeUnquoted(value, delimiter2)) return value;
  return `"${escapeString(value)}"`;
}
function encodeKey(key) {
  if (isValidUnquotedKey(key)) return key;
  return `"${escapeString(key)}"`;
}
function encodeAndJoinPrimitives(values, delimiter2 = DEFAULT_DELIMITER) {
  return values.map((v) => encodePrimitive(v, delimiter2)).join(delimiter2);
}
function formatHeader(length, options) {
  const key = options?.key;
  const fields = options?.fields;
  const delimiter2 = options?.delimiter ?? ",";
  let header = "";
  if (key != null) header += encodeKey(key);
  header += `[${length}${delimiter2 !== DEFAULT_DELIMITER ? delimiter2 : ""}]`;
  if (fields) {
    const quotedFields = fields.map((f) => encodeKey(f));
    header += `{${quotedFields.join(delimiter2)}}`;
  }
  header += ":";
  return header;
}
function* encodeJsonValue(value, options, depth) {
  if (isJsonPrimitive(value)) {
    const encodedPrimitive = encodePrimitive(value, options.delimiter);
    if (encodedPrimitive !== "") yield encodedPrimitive;
    return;
  }
  if (isJsonArray(value)) yield* encodeArrayLines(void 0, value, depth, options);
  else if (isJsonObject(value)) yield* encodeObjectLines(value, depth, options);
}
function* encodeObjectLines(value, depth, options, rootLiteralKeys, pathPrefix, remainingDepth) {
  const keys = Object.keys(value);
  if (depth === 0 && !rootLiteralKeys) rootLiteralKeys = new Set(keys.filter((k) => k.includes(".")));
  const effectiveFlattenDepth = remainingDepth ?? options.flattenDepth;
  for (const [key, val] of Object.entries(value)) yield* encodeKeyValuePairLines(key, val, depth, options, keys, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
}
function* encodeKeyValuePairLines(key, value, depth, options, siblings, rootLiteralKeys, pathPrefix, flattenDepth) {
  const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
  const effectiveFlattenDepth = flattenDepth ?? options.flattenDepth;
  if (options.keyFolding === "safe" && siblings) {
    const foldResult = tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
    if (foldResult) {
      const { foldedKey, remainder, leafValue, segmentCount } = foldResult;
      const encodedFoldedKey = encodeKey(foldedKey);
      if (remainder === void 0) {
        if (isJsonPrimitive(leafValue)) {
          yield indentedLine(depth, `${encodedFoldedKey}: ${encodePrimitive(leafValue, options.delimiter)}`, options.indent);
          return;
        } else if (isJsonArray(leafValue)) {
          yield* encodeArrayLines(foldedKey, leafValue, depth, options);
          return;
        } else if (isJsonObject(leafValue) && isEmptyObject(leafValue)) {
          yield indentedLine(depth, `${encodedFoldedKey}:`, options.indent);
          return;
        }
      }
      if (isJsonObject(remainder)) {
        yield indentedLine(depth, `${encodedFoldedKey}:`, options.indent);
        const remainingDepth = effectiveFlattenDepth - segmentCount;
        const foldedPath = pathPrefix ? `${pathPrefix}.${foldedKey}` : foldedKey;
        yield* encodeObjectLines(remainder, depth + 1, options, rootLiteralKeys, foldedPath, remainingDepth);
        return;
      }
    }
  }
  const encodedKey = encodeKey(key);
  if (isJsonPrimitive(value)) yield indentedLine(depth, `${encodedKey}: ${encodePrimitive(value, options.delimiter)}`, options.indent);
  else if (isJsonArray(value)) yield* encodeArrayLines(key, value, depth, options);
  else if (isJsonObject(value)) {
    yield indentedLine(depth, `${encodedKey}:`, options.indent);
    if (!isEmptyObject(value)) yield* encodeObjectLines(value, depth + 1, options, rootLiteralKeys, currentPath, effectiveFlattenDepth);
  }
}
function* encodeArrayLines(key, value, depth, options) {
  if (value.length === 0) {
    yield indentedLine(depth, key != null ? `${encodeKey(key)}: []` : "[]", options.indent);
    return;
  }
  if (isArrayOfPrimitives(value)) {
    yield indentedLine(depth, encodeInlineArrayLine(value, options.delimiter, key), options.indent);
    return;
  }
  if (isArrayOfArrays(value)) {
    if (value.every((arr) => isArrayOfPrimitives(arr))) {
      yield* encodeArrayOfArraysAsListItemsLines(key, value, depth, options);
      return;
    }
  }
  if (isArrayOfObjects(value)) {
    const header = extractTabularHeader(value);
    if (header) yield* encodeArrayOfObjectsAsTabularLines(key, value, header, depth, options);
    else yield* encodeMixedArrayAsListItemsLines(key, value, depth, options);
    return;
  }
  yield* encodeMixedArrayAsListItemsLines(key, value, depth, options);
}
function* encodeArrayOfArraysAsListItemsLines(prefix, values, depth, options) {
  yield indentedLine(depth, formatHeader(values.length, {
    key: prefix,
    delimiter: options.delimiter
  }), options.indent);
  for (const arr of values) if (isArrayOfPrimitives(arr)) {
    const arrayLine = encodeInlineArrayLine(arr, options.delimiter);
    yield indentedListItem(depth + 1, arrayLine, options.indent);
  }
}
function encodeInlineArrayLine(values, delimiter2, prefix) {
  const header = formatHeader(values.length, {
    key: prefix,
    delimiter: delimiter2
  });
  const joinedValue = encodeAndJoinPrimitives(values, delimiter2);
  if (values.length === 0) return header;
  return `${header} ${joinedValue}`;
}
function* encodeArrayOfObjectsAsTabularLines(prefix, rows, header, depth, options) {
  yield indentedLine(depth, formatHeader(rows.length, {
    key: prefix,
    fields: header,
    delimiter: options.delimiter
  }), options.indent);
  yield* writeTabularRowsLines(rows, header, depth + 1, options);
}
function extractTabularHeader(rows) {
  if (rows.length === 0) return;
  const firstRow = rows[0];
  const firstKeys = Object.keys(firstRow);
  if (firstKeys.length === 0) return;
  if (isTabularArray(rows, firstKeys)) return firstKeys;
}
function isTabularArray(rows, header) {
  for (const row of rows) {
    if (Object.keys(row).length !== header.length) return false;
    for (const key of header) {
      if (!Object.hasOwn(row, key)) return false;
      if (!isJsonPrimitive(row[key])) return false;
    }
  }
  return true;
}
function* writeTabularRowsLines(rows, header, depth, options) {
  for (const row of rows) yield indentedLine(depth, encodeAndJoinPrimitives(header.map((key) => row[key]), options.delimiter), options.indent);
}
function* encodeMixedArrayAsListItemsLines(prefix, items, depth, options) {
  yield indentedLine(depth, formatHeader(items.length, {
    key: prefix,
    delimiter: options.delimiter
  }), options.indent);
  for (const item of items) yield* encodeListItemValueLines(item, depth + 1, options);
}
function* encodeObjectAsListItemLines(obj, depth, options) {
  if (isEmptyObject(obj)) {
    yield indentedLine(depth, "-", options.indent);
    return;
  }
  const entries = Object.entries(obj);
  const [firstKey, firstValue] = entries[0];
  const restEntries = entries.slice(1);
  if (isJsonArray(firstValue) && isArrayOfObjects(firstValue)) {
    const header = extractTabularHeader(firstValue);
    if (header) {
      yield indentedListItem(depth, formatHeader(firstValue.length, {
        key: firstKey,
        fields: header,
        delimiter: options.delimiter
      }), options.indent);
      yield* writeTabularRowsLines(firstValue, header, depth + 2, options);
      if (restEntries.length > 0) yield* encodeObjectLines(Object.fromEntries(restEntries), depth + 1, options);
      return;
    }
  }
  const encodedKey = encodeKey(firstKey);
  if (isJsonPrimitive(firstValue)) yield indentedListItem(depth, `${encodedKey}: ${encodePrimitive(firstValue, options.delimiter)}`, options.indent);
  else if (isJsonArray(firstValue)) if (firstValue.length === 0) yield indentedListItem(depth, `${encodedKey}: []`, options.indent);
  else if (isArrayOfPrimitives(firstValue)) yield indentedListItem(depth, `${encodedKey}${encodeInlineArrayLine(firstValue, options.delimiter)}`, options.indent);
  else {
    yield indentedListItem(depth, `${encodedKey}${formatHeader(firstValue.length, { delimiter: options.delimiter })}`, options.indent);
    for (const item of firstValue) yield* encodeListItemValueLines(item, depth + 2, options);
  }
  else if (isJsonObject(firstValue)) {
    yield indentedListItem(depth, `${encodedKey}:`, options.indent);
    if (!isEmptyObject(firstValue)) yield* encodeObjectLines(firstValue, depth + 2, options);
  }
  if (restEntries.length > 0) yield* encodeObjectLines(Object.fromEntries(restEntries), depth + 1, options);
}
function* encodeListItemValueLines(value, depth, options) {
  if (isJsonPrimitive(value)) yield indentedListItem(depth, encodePrimitive(value, options.delimiter), options.indent);
  else if (isJsonArray(value)) if (isArrayOfPrimitives(value)) yield indentedListItem(depth, encodeInlineArrayLine(value, options.delimiter), options.indent);
  else {
    yield indentedListItem(depth, formatHeader(value.length, { delimiter: options.delimiter }), options.indent);
    for (const item of value) yield* encodeListItemValueLines(item, depth + 1, options);
  }
  else if (isJsonObject(value)) yield* encodeObjectAsListItemLines(value, depth, options);
}
function indentedLine(depth, content, indentSize) {
  return " ".repeat(indentSize * depth) + content;
}
function indentedListItem(depth, content, indentSize) {
  return indentedLine(depth, "- " + content, indentSize);
}
function applyReplacer(root, replacer) {
  const replacedRoot = replacer("", root, []);
  if (replacedRoot === void 0) return transformChildren(root, replacer, []);
  return transformChildren(normalizeValue(replacedRoot), replacer, []);
}
function transformChildren(value, replacer, path2) {
  if (isJsonObject(value)) return transformObject(value, replacer, path2);
  if (isJsonArray(value)) return transformArray(value, replacer, path2);
  return value;
}
function transformObject(obj, replacer, path2) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const childPath = [...path2, key];
    const replacedValue = replacer(key, value, childPath);
    if (replacedValue === void 0) continue;
    setOwnProperty(result, key, transformChildren(normalizeValue(replacedValue), replacer, childPath));
  }
  return result;
}
function transformArray(arr, replacer, path2) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    const childPath = [...path2, i];
    const replacedValue = replacer(String(i), value, childPath);
    if (replacedValue === void 0) continue;
    const normalizedValue = normalizeValue(replacedValue);
    result.push(transformChildren(normalizedValue, replacer, childPath));
  }
  return result;
}
function encode(input, options) {
  return Array.from(encodeLines(input, options)).join("\n");
}
function encodeLines(input, options) {
  const normalizedValue = normalizeValue(input);
  const resolvedOptions = resolveOptions(options);
  return encodeJsonValue(resolvedOptions.replacer ? applyReplacer(normalizedValue, resolvedOptions.replacer) : normalizedValue, resolvedOptions, 0);
}
function resolveOptions(options) {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
    keyFolding: options?.keyFolding ?? "off",
    flattenDepth: options?.flattenDepth ?? Number.POSITIVE_INFINITY,
    replacer: options?.replacer
  };
}

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/output.js
function collapseHomeDirectory(path2, homeDir = homedir()) {
  if (!path2.startsWith(homeDir)) {
    return path2;
  }
  return `~${path2.slice(homeDir.length)}`;
}
function homeHeaderOutput(options) {
  return {
    bin: collapseHomeDirectory(options.execPath ?? process.argv[1] ?? "", options.homeDir),
    description: options.description
  };
}
function errorOutput(message, code, suggestions = []) {
  const output = {
    error: message,
    code
  };
  if (suggestions.length > 0) {
    output.help = suggestions;
  }
  return output;
}
function renderOutput(output) {
  if (typeof output === "string") {
    return output;
  }
  return encode(output);
}
function renderError(message, code, suggestions = []) {
  return renderOutput(errorOutput(message, code, suggestions));
}

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/update.js
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
var REGISTRY_BASE = "https://registry.npmjs.org";
var REGISTRY_FETCH_TIMEOUT_MS = 2e4;
function parseSemver(version2) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+[0-9A-Za-z-.]+)?$/.exec(version2.trim());
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : []
  };
}
function comparePrerelease(a, b) {
  if (a.length === 0 && b.length === 0)
    return 0;
  if (a.length === 0)
    return 1;
  if (b.length === 0)
    return -1;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (index >= a.length)
      return -1;
    if (index >= b.length)
      return 1;
    const left = a[index];
    const right = b[index];
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) {
      const delta = Number(left) - Number(right);
      if (delta !== 0)
        return delta < 0 ? -1 : 1;
    } else if (leftNumeric) {
      return -1;
    } else if (rightNumeric) {
      return 1;
    } else if (left !== right) {
      return left < right ? -1 : 1;
    }
  }
  return 0;
}
function compareSemver(a, b) {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) {
    if (a === b)
      return 0;
    return a < b ? -1 : 1;
  }
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch < parsedB.patch ? -1 : 1;
  }
  return comparePrerelease(parsedA.prerelease, parsedB.prerelease);
}
function isUpdateAvailable(current, latest) {
  return compareSemver(latest, current) > 0;
}
var nodeFs = {
  existsSync,
  readFileSync: (path2, encoding) => readFileSync(path2, encoding)
};
function readNearestPackageJson(startPath, fs2 = nodeFs) {
  let dir = dirname(startPath);
  let previous = "";
  while (dir !== previous) {
    const packageJsonPath = join(dir, "package.json");
    if (fs2.existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(fs2.readFileSync(packageJsonPath, "utf-8"));
        if (typeof parsed.name === "string" && parsed.name.length > 0) {
          return {
            packageName: parsed.name,
            version: typeof parsed.version === "string" ? parsed.version : void 0,
            packageJsonPath
          };
        }
      } catch {
      }
    }
    previous = dir;
    dir = dirname(dir);
  }
  return {};
}
function detectInstallMethod(options) {
  const env = options.env ?? process.env;
  const path2 = options.entry.replaceAll("\\", "/");
  if (path2.includes("/_npx/") || /\/dlx-[^/]+\//.test(path2) || path2.includes("/pnpm/dlx/") || path2.includes("/bun/install/cache/")) {
    return { kind: "npx" };
  }
  const homebrewFormula = homebrewFormulaFromPath(path2, env);
  if (homebrewFormula) {
    return { kind: "homebrew", formula: homebrewFormula };
  }
  const pnpmHome = normalizePathRoot(env.PNPM_HOME);
  if (isPathInsideRoot(path2, pnpmHome) || isKnownPnpmGlobalStore(path2, env)) {
    return { kind: "pnpm-global" };
  }
  if (isKnownNpmGlobalInstall(path2, env)) {
    return { kind: "npm-global" };
  }
  return { kind: "unknown" };
}
function normalizePathRoot(path2) {
  const normalized = path2?.replaceAll("\\", "/").replace(/\/+$/, "");
  return normalized && normalized.length > 0 ? normalized : void 0;
}
function isPathInsideRoot(path2, root) {
  return root !== void 0 && (path2 === root || path2.startsWith(`${root}/`));
}
function homebrewFormulaFromPath(path2, env) {
  for (const root of homebrewCellarRoots(env)) {
    if (!isPathInsideRoot(path2, root)) {
      continue;
    }
    const relative = path2.slice(root.length).replace(/^\/+/, "");
    const formula = relative.split("/")[0];
    if (formula) {
      return formula;
    }
  }
  return null;
}
function homebrewCellarRoots(env) {
  const roots = [];
  const explicitCellar = normalizePathRoot(env.HOMEBREW_CELLAR);
  if (explicitCellar) {
    roots.push(explicitCellar);
  }
  const prefixes = [
    env.HOMEBREW_PREFIX,
    "/opt/homebrew",
    "/usr/local",
    "/home/linuxbrew/.linuxbrew"
  ];
  for (const prefix of prefixes) {
    const normalized = normalizePathRoot(prefix);
    if (normalized) {
      roots.push(`${normalized}/Cellar`);
    }
  }
  return [...new Set(roots)];
}
function isKnownPnpmGlobalStore(path2, env) {
  return pnpmGlobalStoreRoots(env).some((root) => {
    if (!isPathInsideRoot(path2, root)) {
      return false;
    }
    const relative = path2.slice(root.length).replace(/^\/+/, "");
    return /^\d+\/\.pnpm\//.test(relative);
  });
}
function pnpmGlobalStoreRoots(env) {
  const roots = [];
  const home2 = normalizePathRoot(env.HOME ?? env.USERPROFILE);
  if (home2) {
    roots.push(`${home2}/Library/pnpm/global`);
    roots.push(`${home2}/.local/share/pnpm/global`);
    roots.push(`${home2}/AppData/Local/pnpm/global`);
  }
  const localAppData = normalizePathRoot(env.LOCALAPPDATA);
  if (localAppData) {
    roots.push(`${localAppData}/pnpm/global`);
  }
  return [...new Set(roots)];
}
function isKnownNpmGlobalInstall(path2, env) {
  return npmGlobalNodeModulesRoots(env).some((root) => isPathInsideRoot(path2, root)) || isKnownVersionManagerNpmGlobal(path2, env);
}
function npmGlobalNodeModulesRoots(env) {
  const roots = [
    "/usr/local/lib/node_modules",
    "/usr/lib/node_modules",
    "/opt/homebrew/lib/node_modules",
    "/opt/local/lib/node_modules"
  ];
  const prefixes = [env.npm_config_prefix, env.NPM_CONFIG_PREFIX];
  for (const prefix of prefixes) {
    const normalized = normalizePathRoot(prefix);
    if (normalized) {
      roots.push(`${normalized}/lib/node_modules`, `${normalized}/node_modules`);
    }
  }
  const appData = normalizePathRoot(env.APPDATA);
  if (appData) {
    roots.push(`${appData}/npm/node_modules`);
  }
  const home2 = normalizePathRoot(env.HOME ?? env.USERPROFILE);
  if (home2) {
    roots.push(`${home2}/.npm-global/lib/node_modules`, `${home2}/.npm-packages/lib/node_modules`);
  }
  return [...new Set(roots)];
}
function isKnownVersionManagerNpmGlobal(path2, env) {
  return versionManagerNodeRoots(env).some((root) => isPathInsideRoot(path2, root) && path2.includes("/lib/node_modules/"));
}
function versionManagerNodeRoots(env) {
  const roots = [];
  const home2 = normalizePathRoot(env.HOME ?? env.USERPROFILE);
  if (home2) {
    roots.push(`${home2}/.nvm/versions/node`, `${home2}/.local/share/fnm/node-versions`, `${home2}/.asdf/installs/nodejs`, `${home2}/.nodenv/versions`, `${home2}/.local/share/mise/installs/node`, `${home2}/.volta/tools/image/node`);
  }
  const nvmDir = normalizePathRoot(env.NVM_DIR);
  if (nvmDir) {
    roots.push(`${nvmDir}/versions/node`);
  }
  const fnmDir = normalizePathRoot(env.FNM_DIR);
  if (fnmDir) {
    roots.push(`${fnmDir}/node-versions`);
  }
  return [...new Set(roots)];
}
function planUpgrade(method, packageName) {
  switch (method.kind) {
    case "npm-global":
      return {
        method: method.kind,
        command: `npm install -g ${packageName}@latest`,
        argv: ["npm", "install", "-g", `${packageName}@latest`]
      };
    case "pnpm-global":
      return {
        method: method.kind,
        command: `pnpm add -g ${packageName}@latest`,
        argv: ["pnpm", "add", "-g", `${packageName}@latest`]
      };
    case "homebrew":
      if (method.formula) {
        return {
          method: method.kind,
          command: `brew upgrade ${method.formula}`,
          argv: ["brew", "upgrade", method.formula]
        };
      }
      return {
        method: method.kind,
        command: `brew upgrade ${packageName}`,
        argv: null,
        note: "Could not determine the Homebrew formula automatically"
      };
    case "npx":
      return {
        method: method.kind,
        command: `npx -y ${packageName}@latest`,
        argv: null,
        note: "npx always runs the latest published version, so no install is needed"
      };
    case "unknown":
      return {
        method: method.kind,
        command: `npm install -g ${packageName}@latest`,
        argv: null,
        note: "Could not determine how this tool was installed"
      };
  }
}
function packageManagerExecutable(command, platform) {
  if (platform === "win32" && (command === "npm" || command === "pnpm" || command === "npx")) {
    return `${command}.cmd`;
  }
  return command;
}
function shouldUseWindowsPackageManagerShell(command, platform) {
  return platform === "win32" && (command === "npm" || command === "pnpm" || command === "npx");
}
async function npmViewVersion(packageName, platform = process.platform) {
  try {
    const command = packageManagerExecutable("npm", platform);
    const { stdout } = await execFileAsync(command, ["view", packageName, "version"], {
      timeout: 2e4,
      shell: shouldUseWindowsPackageManagerShell("npm", platform)
    });
    const version2 = stdout.trim();
    return version2.length > 0 ? version2 : null;
  } catch {
    return null;
  }
}
function registryPath(packageName) {
  return packageName.startsWith("@") ? packageName.replace("/", "%2f") : packageName;
}
function notPublishedError(packageName) {
  return new AxiError(`${packageName} is not published to the npm registry`, "UPDATE_ERROR", [
    "Confirm the package name is correct",
    `Run \`npm view ${packageName} version\` to check manually`
  ]);
}
var RegistryNotFoundError = class extends Error {
};
async function withRegistryTimeout(timeoutMs, operation) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Registry fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
async function fetchRegistryVersion(fetchImpl, packageName, timeoutMs) {
  return withRegistryTimeout(timeoutMs, async (signal) => {
    const response = await fetchImpl(`${REGISTRY_BASE}/${registryPath(packageName)}/latest`, { headers: { accept: "application/json" }, signal });
    if (response.ok) {
      const data = await response.json();
      if (typeof data.version === "string" && data.version.length > 0) {
        return data.version;
      }
    } else if (response.status === 404) {
      throw new RegistryNotFoundError();
    }
    return null;
  });
}
async function fetchLatestVersion(packageName, options = {}) {
  const fetchImpl = options.fetchImpl === void 0 ? globalThis.fetch : options.fetchImpl ?? void 0;
  let registryNotFound = false;
  if (typeof fetchImpl === "function") {
    try {
      const version2 = await fetchRegistryVersion(fetchImpl, packageName, options.fetchTimeoutMs ?? REGISTRY_FETCH_TIMEOUT_MS);
      if (version2) {
        return version2;
      }
    } catch (error) {
      if (error instanceof RegistryNotFoundError) {
        registryNotFound = true;
      } else if (error instanceof AxiError) {
        throw error;
      }
    }
  }
  const viewed = await (options.npmView ?? ((name) => npmViewVersion(name, options.platform)))(packageName);
  if (viewed) {
    return viewed;
  }
  if (registryNotFound) {
    throw notPublishedError(packageName);
  }
  throw new AxiError(`Could not reach the npm registry to check for updates to ${packageName}`, "UPDATE_ERROR", [
    "Check your network connection and try again",
    `Run \`npm view ${packageName} version\` to check manually`
  ]);
}
async function defaultRunInstall(plan, stdout, context) {
  const argv = plan.argv;
  if (!argv || argv.length === 0) {
    return { ok: false, message: "No runnable upgrade command" };
  }
  stdout.write(`running: ${plan.command}
`);
  return new Promise((resolve2) => {
    const [command, ...args] = argv;
    const child = spawn(packageManagerExecutable(command, context.platform), args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: shouldUseWindowsPackageManagerShell(command, context.platform)
    });
    child.stdout?.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      resolve2({ ok: false, message: error.message });
    });
    child.on("close", (code) => {
      resolve2(code === 0 ? { ok: true } : { ok: false, message: `${plan.command} exited with code ${code}` });
    });
  });
}
function binNameFromArgv(invokedAs) {
  return basename(invokedAs ?? "tool") || "tool";
}
function resolveEntry(invokedAs, realpath) {
  if (!invokedAs) {
    return void 0;
  }
  try {
    return realpath(invokedAs);
  } catch {
    return invokedAs;
  }
}
function resolveInstalledVersion(invokedAs, realpath, fs2) {
  const installedEntry = resolveEntry(invokedAs, realpath);
  return installedEntry ? readNearestPackageJson(installedEntry, fs2).version : void 0;
}
function homebrewUpgradeOutput(options) {
  const update = {
    package: options.packageName,
    previous: options.current,
    latest: options.latest
  };
  if (options.installedVersion) {
    update.installed = options.installedVersion;
    update.available = isUpdateAvailable(options.installedVersion, options.latest);
  } else {
    update.action = "upgrade-command-ran";
    update.result = "installed version unknown";
  }
  return {
    update,
    command: options.command
  };
}
function parseUpdateArgs(args, binName) {
  if (args.length === 0) {
    return "install";
  }
  if (args.length === 1 && (args[0] === "--check" || args[0] === "--dry-run")) {
    return "check";
  }
  const unknown = args.find((arg) => arg !== "--check" && arg !== "--dry-run");
  throw new AxiError(unknown ? `Unknown update option: ${unknown}` : "Invalid update arguments", "VALIDATION_ERROR", [
    `Run \`${binName} update --help\``,
    `Use \`${binName} update --check\` to check without installing`
  ]);
}
async function runUpdate(options) {
  const invokedAs = options.invokedAs ?? process.argv[1];
  const binName = binNameFromArgv(invokedAs);
  const mode = parseUpdateArgs(options.args, binName);
  const platform = options.platform ?? process.platform;
  const realpath = options.realpath ?? ((path2) => realpathSync(path2));
  const entry = resolveEntry(invokedAs, realpath);
  const fs2 = options.fs ?? nodeFs;
  const fromPackageJson = entry ? readNearestPackageJson(entry, fs2) : {};
  const packageName = options.packageName ?? fromPackageJson.packageName;
  const current = options.version ?? fromPackageJson.version;
  if (!packageName) {
    throw new AxiError("Could not determine the package name to update", "UPDATE_ERROR", [
      "Reinstall the tool from npm so its package.json is available",
      "Tool authors can pass `packageName` to runAxiCli()"
    ]);
  }
  if (!current) {
    throw new AxiError(`Could not determine the current version of ${packageName}`, "UPDATE_ERROR", [
      "Reinstall the tool from npm so its version is available",
      "Tool authors can pass `version` to runAxiCli()"
    ]);
  }
  const fetchLatest = options.fetchLatest ?? ((name) => fetchLatestVersion(name, { platform }));
  const latest = await fetchLatest(packageName);
  const available = isUpdateAvailable(current, latest);
  if (mode === "check") {
    const output = {
      update: { package: packageName, current, latest, available }
    };
    if (available) {
      output.help = [`Run \`${binName} update\` to upgrade`];
    }
    return output;
  }
  if (!available) {
    return {
      update: `${packageName} is already on the latest version (${current})`
    };
  }
  const method = entry ? detectInstallMethod({ entry, env: options.env }) : { kind: "unknown" };
  const plan = planUpgrade(method, packageName);
  if (!plan.argv) {
    const help = method.kind === "npx" ? `Re-run with \`${plan.command}\` to use the latest version` : `Run \`${plan.command}\` to upgrade`;
    return {
      update: {
        package: packageName,
        current,
        latest,
        available: true,
        action: "manual",
        ...plan.note ? { reason: plan.note } : {},
        run: plan.command
      },
      help: [help]
    };
  }
  const runInstall = options.runInstall ?? defaultRunInstall;
  const result = await runInstall(plan, options.stdout, { platform });
  if (!result.ok) {
    throw new AxiError(`Failed to upgrade ${packageName}`, "UPDATE_ERROR", [
      `Run \`${plan.command}\` manually`,
      ...result.message ? [result.message] : []
    ]);
  }
  if (method.kind === "homebrew") {
    return homebrewUpgradeOutput({
      packageName,
      current,
      latest,
      installedVersion: resolveInstalledVersion(invokedAs, realpath, fs2),
      command: plan.command
    });
  }
  return {
    update: `${packageName} upgraded ${current} -> ${latest}`,
    command: plan.command
  };
}

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/cli.js
var stdoutWithErrorHandler = /* @__PURE__ */ new WeakSet();
function defaultFormatError(error) {
  if (error instanceof AxiError) {
    return {
      output: `${renderError(error.message, error.code, error.suggestions)}
`,
      exitCode: exitCodeForError(error)
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    output: `${renderError(message, "UNKNOWN")}
`,
    exitCode: 1
  };
}
function defaultUnknownCommand(command) {
  return `${renderError(`Unknown command: ${command}`, "VALIDATION_ERROR", [
    "Run `--help` to see available commands"
  ])}
`;
}
async function runAxiCli(options) {
  const stdout = options.stdout ?? process.stdout;
  handleStdoutErrors(stdout);
  try {
    await options.initialize?.();
  } catch (error) {
    writeFormattedError(error, stdout, options);
    return;
  }
  const argv = options.argv ?? process.argv.slice(2);
  if (argv.length === 1 && argv[0] === "--help") {
    stdout.write(options.topLevelHelp);
    if (!options.commands.update) {
      if (options.topLevelHelp.length > 0 && !options.topLevelHelp.endsWith("\n")) {
        stdout.write("\n");
      }
      stdout.write(builtinCommandsHelp());
    }
    return;
  }
  if (argv.length === 1 && isVersionFlag(argv[0])) {
    if (!options.version) {
      stdout.write(`${renderError("Version is not configured for this tool", "VALIDATION_ERROR")}
`);
      process.exitCode = 2;
      return;
    }
    stdout.write(`${options.version}
`);
    return;
  }
  const command = argv[0];
  if (!command) {
    await runHandler(options.home, [], { command: void 0, args: [] }, stdout, options, true);
    return;
  }
  if (command.startsWith("-")) {
    stdout.write(renderLeadingFlagError(command));
    process.exitCode = 2;
    return;
  }
  const args = argv.slice(1);
  if (command === "update" && !options.commands.update) {
    await runBuiltinUpdate(args, stdout, options);
    return;
  }
  if (args.includes("--help")) {
    const help = options.getCommandHelp?.(command);
    if (help) {
      stdout.write(help);
      return;
    }
  }
  const handler = options.commands[command];
  if (!handler) {
    stdout.write((options.renderUnknownCommand ?? defaultUnknownCommand)(command));
    process.exitCode = 2;
    return;
  }
  await runHandler(handler, args, { command, args }, stdout, options, false);
}
function handleStdoutErrors(stdout) {
  const errorObservable = stdout;
  if (typeof errorObservable.on !== "function" || stdoutWithErrorHandler.has(stdout)) {
    return;
  }
  stdoutWithErrorHandler.add(stdout);
  errorObservable.on("error", (error) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "EPIPE") {
      process.exitCode = 0;
      return;
    }
    throw error;
  });
}
async function runHandler(handler, args, contextInput, stdout, options, isHomeView) {
  try {
    const context = await options.resolveContext?.(contextInput);
    const output = await handler(args, context);
    stdout.write(`${renderCommandOutput(output, options, isHomeView)}
`);
  } catch (error) {
    writeFormattedError(error, stdout, options);
  }
}
async function runBuiltinUpdate(args, stdout, options) {
  if (args.length === 1 && args[0] === "--help") {
    stdout.write(builtinUpdateHelp());
    return;
  }
  try {
    const output = await runUpdate({
      args,
      stdout,
      packageName: options.packageName,
      version: options.version
    });
    stdout.write(`${renderOutput(output)}
`);
  } catch (error) {
    writeFormattedError(error, stdout, options);
  }
}
function writeFormattedError(error, stdout, options) {
  const formatted = (options.formatError ?? defaultFormatError)(error);
  stdout.write(formatted.output);
  process.exitCode = formatted.exitCode;
}
function resolveBinName() {
  return basename2(process.argv[1] ?? "tool") || "tool";
}
function builtinCommandsHelp() {
  const bin = resolveBinName();
  return `${renderOutput({
    "built-in": {
      update: `Upgrade \`${bin}\` to the latest published version`,
      "update --check": "Report current vs latest without installing"
    }
  })}
`;
}
function builtinUpdateHelp() {
  const bin = resolveBinName();
  return `${renderOutput({
    command: "update",
    description: `Upgrade \`${bin}\` to the latest published npm version`,
    flags: {
      "--check": "Report current vs latest and exit without installing"
    },
    examples: [`${bin} update`, `${bin} update --check`]
  })}
`;
}
function renderLeadingFlagError(flag) {
  const bin = basename2(process.argv[1] ?? "tool") || "tool";
  return `${renderError("Flags must come after the command", "VALIDATION_ERROR", [
    `Run \`${bin} <command> [args] [flags]\``,
    `Move \`${flag}\` after the command instead of before it`
  ])}
`;
}
function isVersionFlag(flag) {
  return flag === "-v" || flag === "-V" || flag === "--version";
}
function renderCommandOutput(output, options, isHomeView) {
  if (!isHomeView) {
    return renderOutput(output);
  }
  const header = homeHeaderOutput({ description: options.description });
  if (typeof output === "string") {
    return `${renderOutput(header)}
${output}`;
  }
  return renderOutput(mergeHomeHeader(header, output));
}
function mergeHomeHeader(header, output) {
  const rest = { ...output };
  delete rest.bin;
  delete rest.description;
  return {
    ...header,
    ...rest
  };
}

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/hooks.js
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, realpathSync as realpathSync2, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { basename as basename3, delimiter, dirname as dirname2, join as join2, resolve } from "node:path";
var OPENCODE_PLUGIN_MANAGED_PREFIX = "axi-sdk-js managed opencode plugin:";
function isManagedHook(hook, marker) {
  return typeof hook?.command === "string" && hook.command.includes(marker);
}
function computeSessionStartHookUpdate(settings, spec) {
  const updated = structuredClone(settings);
  let changed = false;
  if (!updated.hooks) {
    updated.hooks = {};
    changed = true;
  }
  if (Array.isArray(updated.hooks.session_start)) {
    const legacyHooks = updated.hooks.session_start.filter((hook) => !isManagedHook(hook, spec.marker));
    if (legacyHooks.length !== updated.hooks.session_start.length) {
      changed = true;
      if (legacyHooks.length === 0) {
        delete updated.hooks.session_start;
      } else {
        updated.hooks.session_start = legacyHooks;
      }
    }
  }
  if (!Array.isArray(updated.hooks.SessionStart)) {
    updated.hooks.SessionStart = [];
    changed = true;
  }
  for (const group of updated.hooks.SessionStart) {
    if (!Array.isArray(group.hooks)) {
      continue;
    }
    for (const hook of group.hooks) {
      if (!isManagedHook(hook, spec.marker)) {
        continue;
      }
      const timeout = spec.timeoutSeconds ?? 10;
      const isCorrect = hook.command === spec.command && hook.type === "command" && hook.timeout === timeout;
      if (isCorrect && !changed) {
        return [settings, false];
      }
      hook.command = spec.command;
      hook.type = "command";
      hook.timeout = timeout;
      return [updated, true];
    }
  }
  updated.hooks.SessionStart.push({
    matcher: "",
    hooks: [
      {
        type: "command",
        command: spec.command,
        timeout: spec.timeoutSeconds ?? 10
      }
    ]
  });
  return [updated, true];
}
function computeSessionStartHookRemoval(settings, marker) {
  if (!settings.hooks) {
    return [settings, false];
  }
  const updated = structuredClone(settings);
  const hooks = updated.hooks;
  if (!hooks) {
    return [settings, false];
  }
  let changed = false;
  if (Array.isArray(hooks.session_start)) {
    const remaining = hooks.session_start.filter((hook) => !isManagedHook(hook, marker));
    if (remaining.length !== hooks.session_start.length) {
      changed = true;
      if (remaining.length === 0) {
        delete hooks.session_start;
      } else {
        hooks.session_start = remaining;
      }
    }
  }
  if (Array.isArray(hooks.SessionStart)) {
    const remainingGroups = [];
    let sessionStartChanged = false;
    for (const group of hooks.SessionStart) {
      if (!Array.isArray(group.hooks)) {
        remainingGroups.push(group);
        continue;
      }
      const remainingHooks = group.hooks.filter((hook) => !isManagedHook(hook, marker));
      if (remainingHooks.length === group.hooks.length) {
        remainingGroups.push(group);
        continue;
      }
      sessionStartChanged = true;
      if (remainingHooks.length > 0) {
        remainingGroups.push({ ...group, hooks: remainingHooks });
      }
    }
    if (sessionStartChanged) {
      changed = true;
      if (remainingGroups.length > 0) {
        hooks.SessionStart = remainingGroups;
      } else {
        delete hooks.SessionStart;
      }
    }
  }
  if (Object.keys(hooks).length === 0) {
    delete updated.hooks;
  }
  return changed ? [updated, true] : [settings, false];
}
function computeCodexConfigUpdate(content) {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const normalized = content.length === 0 ? "" : content;
  if (normalized.trim().length === 0) {
    return [`[features]${newline}hooks = true${newline}`, true];
  }
  const lines = normalized.split(/\r?\n/);
  const updated = [...lines];
  let inFeatures = false;
  let sawFeatures = false;
  for (let index = 0; index < updated.length; index++) {
    const line = updated[index];
    const section = line.match(/^\s*(\[{1,2})([^\]]+)(\]{1,2})\s*(?:#.*)?$/);
    if (section) {
      const isTableHeader = section[1] === "[" && section[3] === "]" || section[1] === "[[" && section[3] === "]]";
      if (!isTableHeader) {
        continue;
      }
      const sectionName = section[2].trim();
      if (inFeatures) {
        updated.splice(index, 0, "hooks = true");
        return [updated.join(newline), true];
      }
      inFeatures = sectionName === "features";
      sawFeatures ||= inFeatures;
      continue;
    }
    if (!inFeatures) {
      continue;
    }
    const flag = line.match(/^\s*hooks\s*=\s*(true|false)\s*(?:#.*)?$/);
    if (!flag) {
      continue;
    }
    if (flag[1] === "true") {
      return [content, false];
    }
    updated[index] = line.replace(/false/, "true");
    return [updated.join(newline), true];
  }
  if (sawFeatures) {
    const suffix = normalized.endsWith(newline) ? "" : newline;
    return [`${normalized}${suffix}hooks = true${newline}`, true];
  }
  const separator = normalized.endsWith(newline) ? newline : `${newline}${newline}`;
  return [
    `${normalized}${separator}[features]${newline}hooks = true${newline}`,
    true
  ];
}
function openCodePluginId(marker) {
  return `axi-${marker.replace(/[^A-Za-z0-9._-]+/g, "_")}`;
}
function buildOpenCodeAmbientPluginSource(marker, command, timeoutSeconds) {
  const managedMarker = `${OPENCODE_PLUGIN_MANAGED_PREFIX} ${marker}`;
  return `// ${managedMarker}
// This file is generated by axi-sdk-js. It is safe to edit only if you remove the managed marker above.
import { spawn } from "node:child_process";

const command = ${JSON.stringify(command)};
const marker = ${JSON.stringify(marker)};
const ambientHeader = ${JSON.stringify(`## AXI ambient context: ${marker}`)};
const timeoutMs = ${JSON.stringify(timeoutSeconds * 1e3)};

function runAxiHomeView(cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, [], {
      cwd: directoryOrFallback(cwd),
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      resolve("error: " + marker + " ambient context timed out after " + timeoutMs + "ms");
    }, timeoutMs);

    child.stdout?.setEncoding("utf-8");
    child.stderr?.setEncoding("utf-8");
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve("error: " + marker + " ambient context failed: " + error.message);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      const message = (stderr || stdout || marker + " exited with code " + code).trim();
      resolve("error: " + marker + " ambient context failed: " + message);
    });
  });
}

function directoryOrFallback(directory) {
  return typeof directory === "string" && directory.length > 0
    ? directory
    : process.cwd();
}

// Returns the session's ambient context text, running the AXI home view once per session.
function ambientContextFor(directory) {
  const sessionCache = new Map();

  return async (sessionID) => {
    const key = sessionID ?? "__global__";
    let homeView = sessionCache.get(key);
    if (homeView === undefined) {
      homeView = await runAxiHomeView(directory);
      sessionCache.set(key, homeView);
    }
    return homeView.length === 0 ? "" : ambientHeader + "\\n" + homeView;
  };
}

export default {
  id: ${JSON.stringify(openCodePluginId(marker))},
  // OpenCode 2 entrypoint.
  async setup(ctx) {
    const ambientContext = ambientContextFor(ctx.location.directory);
    await ctx.session.hook("context", async (event) => {
      const text = await ambientContext(event.sessionID);
      if (text) event.system.push({ type: "text", text });
    });
  },
  // OpenCode 1 entrypoint.
  async server({ directory }) {
    const ambientContext = ambientContextFor(directory);
    return {
      "experimental.chat.system.transform": async (input, output) => {
        const text = await ambientContext(input.sessionID);
        if (text) output.system.push(text);
      },
    };
  },
};
`;
}
function openCodePluginFileName(marker) {
  return `${openCodePluginId(marker)}.js`;
}
function openCodePluginDir(scope, home2, root) {
  return scope === "project" ? join2(root, ".opencode", "plugins") : join2(home2, ".config", "opencode", "plugins");
}
function resolveHookScopeTargets(marker, options) {
  const home2 = options.homeDir ?? homedir2();
  const scope = options.scope ?? "user";
  const root = scope === "project" ? resolve(options.projectDir ?? process.cwd()) : home2;
  return {
    scope,
    home: home2,
    root,
    claudeSettingsPath: join2(root, ".claude", "settings.json"),
    codexHooksPath: join2(root, ".codex", "hooks.json"),
    codexConfigPath: join2(home2, ".codex", "config.toml"),
    openCodePluginPath: join2(openCodePluginDir(scope, home2, root), openCodePluginFileName(marker))
  };
}
function installOpenCodeAmbientPlugin(pluginPath, marker, command, timeoutSeconds, onError) {
  const managedMarker = `${OPENCODE_PLUGIN_MANAGED_PREFIX} ${marker}`;
  const next = buildOpenCodeAmbientPluginSource(marker, command, timeoutSeconds);
  try {
    mkdirSync(dirname2(pluginPath), { recursive: true });
    const current = existsSync2(pluginPath) ? readFileSync2(pluginPath, "utf-8") : void 0;
    if (current !== void 0 && !current.includes(managedMarker)) {
      onError?.(`${pluginPath}: refusing to overwrite unmanaged OpenCode plugin`);
      return;
    }
    if (current !== next) {
      writeFileSync(pluginPath, next, "utf-8");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onError?.(`${pluginPath}: ${message}`);
  }
}
function resolvePortableHookCommand(execPath, binaryNames, marker, context) {
  if (binaryNames.length === 0) {
    return execPath;
  }
  const resolvedExec = context.resolveRealPath(execPath);
  if (!resolvedExec) {
    return execPath;
  }
  for (const name of binaryNames) {
    if (!name.includes(marker)) {
      continue;
    }
    for (const dir of context.pathEntries) {
      if (!dir)
        continue;
      for (const ext of context.pathExtensions) {
        const candidate = join2(dir, `${name}${ext}`);
        const resolvedCandidate = context.resolveRealPath(candidate);
        if (resolvedCandidate && resolvedCandidate === resolvedExec) {
          return name;
        }
        const shimTarget = context.resolveShimTarget?.(candidate);
        if (shimTarget && shimTarget === resolvedExec) {
          return name;
        }
      }
    }
  }
  return execPath;
}
var NPM_SHIM_SCRIPT_PATTERNS = [
  // Git Bash / POSIX shim: exec node "$basedir/node_modules/<pkg>/.../cli.js"
  /"\$basedir\/([^"]+\.[cm]?js)"/,
  // Windows .cmd shim: "%dp0%\node_modules\<pkg>\...\cli.js"
  /%~?dp0%?[\\/]([^"\r\n]+\.[cm]?js)/i
];
function extractNpmShimScriptPath(content) {
  for (const pattern of NPM_SHIM_SCRIPT_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return void 0;
}
function buildDefaultPortableCommandContext() {
  const rawPath = process.env.PATH ?? process.env.Path ?? "";
  const pathEntries = rawPath.split(delimiter).filter(Boolean);
  const pathExtensions = process.platform === "win32" ? (
    // Git Bash resolves the extensionless shim, which PATHEXT omits.
    ["", ...(process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";")]
  ) : [""];
  return {
    pathEntries,
    pathExtensions,
    resolveRealPath: (absolutePath) => {
      try {
        const stat = statSync(absolutePath);
        if (!stat.isFile()) {
          return void 0;
        }
        return realpathSync2(absolutePath);
      } catch {
        return void 0;
      }
    },
    resolveShimTarget: (shimPath) => {
      try {
        const relative = extractNpmShimScriptPath(readFileSync2(shimPath, "utf-8"));
        if (!relative) {
          return void 0;
        }
        return realpathSync2(resolve(dirname2(shimPath), relative));
      } catch {
        return void 0;
      }
    }
  };
}
function shouldInstallHooksForNodeAxiExecPath(execPath, policy) {
  const normalized = resolve(execPath).replaceAll("\\", "/");
  if (!normalized.includes(policy.marker) || normalized.endsWith(".ts")) {
    return false;
  }
  const fileName = basename3(normalized);
  if (policy.binaryNames?.includes(fileName)) {
    return true;
  }
  return policy.distEntrypoints?.some((entrypoint) => normalized.endsWith(entrypoint.replaceAll("\\", "/"))) ?? false;
}
function inferHookOptions(execPath) {
  if (!execPath) {
    return void 0;
  }
  const normalized = execPath.replaceAll("\\", "/");
  const match = normalized.match(/(?:^|\/)dist\/bin\/([^/]+)\.js$/);
  if (match?.[1]) {
    const marker = match[1];
    return {
      execPath,
      marker,
      binaryNames: [marker],
      distEntrypoints: [`dist/bin/${marker}.js`]
    };
  }
  const fileName = normalized.split("/").pop() ?? "";
  if (!fileName || fileName.includes(".") || fileName === "node") {
    return void 0;
  }
  return {
    execPath,
    marker: fileName,
    binaryNames: [fileName],
    distEntrypoints: [`dist/bin/${fileName}.js`]
  };
}
function buildInferredHookInstallPolicy(marker, options, inferred) {
  const binaryNames = options.binaryNames ?? inferred.binaryNames;
  const distEntrypoints = options.distEntrypoints ?? inferred.distEntrypoints;
  return (execPath) => shouldInstallHooksForNodeAxiExecPath(execPath, {
    marker,
    binaryNames,
    distEntrypoints
  });
}
function installSessionStartHooks(options = {}) {
  const inferred = inferHookOptions(options.execPath ?? process.argv[1]);
  const marker = options.marker ?? inferred?.marker;
  if (!marker) {
    return;
  }
  const execPath = resolve(options.execPath ?? inferred?.execPath ?? process.argv[1] ?? "");
  if (!execPath) {
    return;
  }
  const defaultPolicyOptions = inferred ?? {
    execPath,
    marker,
    binaryNames: [marker],
    distEntrypoints: [`dist/bin/${marker}.js`]
  };
  const shouldInstall = options.shouldInstall ?? buildInferredHookInstallPolicy(marker, options, defaultPolicyOptions);
  if (shouldInstall && !shouldInstall(execPath)) {
    return;
  }
  const binaryNames = options.binaryNames ?? inferred?.binaryNames ?? [];
  const command = resolvePortableHookCommand(execPath, binaryNames, marker, buildDefaultPortableCommandContext());
  const targets = resolveHookScopeTargets(marker, options);
  const jsonTargets = [targets.claudeSettingsPath, targets.codexHooksPath];
  const codexConfigPath = targets.codexConfigPath;
  installOpenCodeAmbientPlugin(targets.openCodePluginPath, marker, command, options.timeoutSeconds ?? 10, options.onError);
  for (const target of jsonTargets) {
    try {
      mkdirSync(dirname2(target), { recursive: true });
      const current = existsSync2(target) ? JSON.parse(readFileSync2(target, "utf-8")) : {};
      const [updated, changed] = computeSessionStartHookUpdate(current, {
        marker,
        command,
        timeoutSeconds: options.timeoutSeconds
      });
      if (changed) {
        writeFileSync(target, `${JSON.stringify(updated, null, 2)}
`, "utf-8");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.onError?.(`${target}: ${message}`);
    }
  }
  try {
    mkdirSync(dirname2(codexConfigPath), { recursive: true });
    const current = existsSync2(codexConfigPath) ? readFileSync2(codexConfigPath, "utf-8") : "";
    const [updated, changed] = computeCodexConfigUpdate(current);
    if (changed) {
      writeFileSync(codexConfigPath, updated, "utf-8");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options.onError?.(`${codexConfigPath}: ${message}`);
  }
}
function resolveStatusMarker(options, callerName) {
  const inferred = inferHookOptions(options.execPath ?? process.argv[1]);
  const marker = options.marker ?? inferred?.marker;
  if (!marker) {
    throw new Error(`${callerName}: unable to infer a hook marker from the current process; pass { marker } explicitly`);
  }
  return marker;
}
function hasManagedJsonHookEntry(path2, marker) {
  if (!existsSync2(path2)) {
    return false;
  }
  try {
    const settings = JSON.parse(readFileSync2(path2, "utf-8"));
    const groups = settings.hooks?.SessionStart ?? [];
    const inGroups = groups.some((group) => (group.hooks ?? []).some((hook) => isManagedHook(hook, marker)));
    const legacy = settings.hooks?.session_start ?? [];
    return inGroups || legacy.some((hook) => isManagedHook(hook, marker));
  } catch {
    return false;
  }
}
function hasManagedOpenCodePlugin(path2, marker) {
  if (!existsSync2(path2)) {
    return false;
  }
  try {
    return readFileSync2(path2, "utf-8").includes(`${OPENCODE_PLUGIN_MANAGED_PREFIX} ${marker}`);
  } catch {
    return false;
  }
}
function isCodexHooksFeatureEnabled(path2) {
  if (!existsSync2(path2)) {
    return false;
  }
  try {
    const [, changed] = computeCodexConfigUpdate(readFileSync2(path2, "utf-8"));
    return !changed;
  } catch {
    return false;
  }
}
function sessionStartHookStatus(options = {}) {
  const marker = resolveStatusMarker(options, "sessionStartHookStatus");
  const targets = resolveHookScopeTargets(marker, options);
  return {
    marker,
    scope: targets.scope,
    claude: {
      installed: hasManagedJsonHookEntry(targets.claudeSettingsPath, marker),
      path: targets.claudeSettingsPath
    },
    codex: {
      installed: hasManagedJsonHookEntry(targets.codexHooksPath, marker),
      path: targets.codexHooksPath,
      userFeatureEnabled: isCodexHooksFeatureEnabled(targets.codexConfigPath),
      userFeaturePath: targets.codexConfigPath
    },
    opencode: {
      installed: hasManagedOpenCodePlugin(targets.openCodePluginPath, marker),
      path: targets.openCodePluginPath
    }
  };
}
function uninstallSessionStartHooks(options = {}) {
  const inferred = inferHookOptions(options.execPath ?? process.argv[1]);
  const marker = options.marker ?? inferred?.marker;
  if (!marker) {
    return;
  }
  const targets = resolveHookScopeTargets(marker, options);
  for (const target of [targets.claudeSettingsPath, targets.codexHooksPath]) {
    try {
      if (!existsSync2(target)) {
        continue;
      }
      const current = JSON.parse(readFileSync2(target, "utf-8"));
      const [updated, changed] = computeSessionStartHookRemoval(current, marker);
      if (changed) {
        writeFileSync(target, `${JSON.stringify(updated, null, 2)}
`, "utf-8");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.onError?.(`${target}: ${message}`);
    }
  }
  const pluginPath = targets.openCodePluginPath;
  try {
    if (existsSync2(pluginPath)) {
      const managedMarker = `${OPENCODE_PLUGIN_MANAGED_PREFIX} ${marker}`;
      if (readFileSync2(pluginPath, "utf-8").includes(managedMarker)) {
        rmSync(pluginPath, { force: true });
      } else {
        options.onError?.(`${pluginPath}: refusing to remove unmanaged OpenCode plugin`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options.onError?.(`${pluginPath}: ${message}`);
  }
}

// src/cli.ts
var import_launch_editor = __toESM(require_launch_editor(), 1);

// package.json
var version = "0.1.4";

// src/version.ts
var VERSION = version;

// src/cli.ts
var DIR = path.dirname(fileURLToPath(import.meta.url));
var SCRIPT = path.join(DIR, "punchlist-axi.mjs");
var STATE_DIR = path.join(os.tmpdir(), "punchlist");
var PREFIX = "/__pe";
var COOKIE = "__pe_auth";
var SERVE_FLAGS = { target: "v", port: "v", host: "v", "no-auth": "b", "no-tailscale": "b", token: "v", root: "v", "editor-url": "v", "idle-timeout": "v" };
var FLAGS = {
  start: SERVE_FLAGS,
  serve: SERVE_FLAGS,
  wait: { port: "v", timeout: "v", json: "b" },
  show: { port: "v", full: "b" },
  done: { port: "v", failed: "b", open: "v" },
  status: { port: "v" },
  stop: { port: "v" },
  setup: { project: "b", remove: "b" }
};
var errorMessage = (e) => e instanceof Error ? e.message : String(e);
function usageError(msg, cmd, extra = []) {
  const flags = Object.keys(FLAGS[cmd]).map((f) => `--${f}`).join(", ");
  return new AxiError(msg, "VALIDATION_ERROR", [...extra, `Valid flags for \`${cmd}\`: ${flags} (--help always allowed)`]);
}
function parseArgs(cmd, argv) {
  const spec = FLAGS[cmd], positional = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    const k = eq > -1 ? a.slice(2, eq) : a.slice(2);
    let v = eq > -1 ? a.slice(eq + 1) : void 0;
    if (!spec[k]) throw usageError(`unknown flag --${k} for \`${cmd}\``, cmd);
    if (spec[k] === "b") {
      if (v !== void 0) throw usageError(`--${k} takes no value`, cmd);
      flags[k] = true;
      continue;
    }
    if (v === void 0) {
      v = argv[++i];
      if (v === void 0 || v.startsWith("--")) throw usageError(`--${k} needs a value`, cmd);
    }
    flags[k] = v;
  }
  return { ...flags, _: positional };
}
function normalizeTarget(t) {
  if (!t) throw usageError("--target is required (dev server port or URL)", "start", [`Run \`${PE} start --target 5173\` or \`--target http://localhost:3000\``]);
  if (/^\d+$/.test(t)) return `http://localhost:${t}`;
  if (!/^https?:\/\//.test(t)) return `http://${t}`;
  return t.replace(/\/+$/, "");
}
function idleTimeout(args, cmd) {
  const raw = args["idle-timeout"] ?? "3600", secs = Number(raw);
  if (!raw.trim() || !(secs >= 0)) throw usageError("--idle-timeout must be a number of seconds (0 = never exit)", cmd);
  return secs;
}
var EDITOR_URLS = {
  vscode: "vscode://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}",
  cursor: "cursor://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}",
  windsurf: "windsurf://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}",
  zed: "zed://ssh/{host}{abs}:{line}:{col}"
};
function editorUrlTemplate(v) {
  const t = EDITOR_URLS[v ?? "vscode"] ?? v ?? "";
  if (!t.includes("{abs}")) throw usageError(
    `--editor-url must be ${Object.keys(EDITOR_URLS).join(", ")} or a template with {abs}`,
    "start",
    ["e.g. `--editor-url 'vscode://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}'` ({host}, {abs}, {line}, {col})"]
  );
  return t;
}
function statePath(port) {
  return path.join(STATE_DIR, `${port}.json`);
}
function readState(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function loadState(args) {
  if (args.port) {
    const p = statePath(args.port);
    if (!fs.existsSync(p)) throw notRunning(`no proxy running on port ${args.port}`, args.port);
    return readState(p);
  }
  const files = fs.existsSync(STATE_DIR) ? fs.readdirSync(STATE_DIR).filter((f) => f.endsWith(".json")) : [];
  files.sort((a, b) => fs.statSync(path.join(STATE_DIR, b)).mtimeMs - fs.statSync(path.join(STATE_DIR, a)).mtimeMs);
  if (!files[0]) throw notRunning("no proxy running");
  return readState(path.join(STATE_DIR, files[0]));
}
function notRunning(msg, port) {
  return new AxiError(msg, "NOT_RUNNING", [`Run \`${PE} start --target <port|url>${port ? ` --port ${port}` : ""}\``]);
}
async function api(st, p, opts = {}) {
  try {
    return await fetch(`${apiBase(st)}${p}`, { ...opts, headers: { "x-pe-token": st.token, ...opts.headers } });
  } catch {
    throw new AxiError(`proxy on port ${st.port} is not responding`, "NOT_RESPONDING", [`Run \`${PE} start --target ${st.target} --port ${st.port}\` to restart it`]);
  }
}
function apiBase(st) {
  const h = ["0.0.0.0", "::", ""].includes(st.host) ? "127.0.0.1" : st.host;
  return `http://${h.includes(":") ? `[${h}]` : h}:${st.port}${PREFIX}`;
}
function readBody(req, limit = 2e6) {
  return new Promise((resolve2, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      resolve2(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}
function json(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(obj));
}
function getCookie(header, name) {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
function stripCookie(header, name) {
  if (!header) return header;
  const kept = header.split(";").map((s) => s.trim()).filter((s) => s && !s.startsWith(name + "="));
  return kept.length ? kept.join("; ") : void 0;
}
function tailscaleSelf() {
  try {
    const out = execFileSync("tailscale", ["status", "--json"], { stdio: ["ignore", "pipe", "ignore"], timeout: 3e3, encoding: "utf8" });
    const j = JSON.parse(out);
    const name = j.Self?.DNSName?.replace(/\.$/, "");
    return j.BackendState === "Running" && name ? { name, ips: j.Self?.TailscaleIPs ?? [] } : null;
  } catch {
    return null;
  }
}
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function printInfo(st) {
  const authPath = !st.auth ? "/" : `${PREFIX}/auth?token=${st.token}`;
  console.log(`punchlist: proxying ${st.target}`);
  console.log(`  Local:     http://${st.host === "0.0.0.0" ? "127.0.0.1" : st.host}:${st.port}${authPath}`);
  if (st.tailnet) console.log(`  Tailscale: http://${st.tailnet}:${st.port}${authPath}`);
  console.log(`  Agent:     ${PE} wait --port ${st.port}`);
}
function links(st) {
  const authPath = !st.auth ? "/" : `${PREFIX}/auth?token=${st.token}`;
  return { local: `http://${st.host === "0.0.0.0" ? "127.0.0.1" : st.host}:${st.port}${authPath}`, ...st.tailnet ? { tailscale: `http://${st.tailnet}:${st.port}${authPath}` } : {} };
}
function startOutput(st, state) {
  const l = links(st);
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid, state },
    links: l,
    help: [
      "Paste the full local link into your reply text - the user does not see command output, and the link token sets the access cookie",
      "Tell the user: press the pointer button (Annotate, Alt+Shift+E), tap an element or drag a box, write a note, repeat, then press Send. With Annotate off, selecting text shows an Annotate button. The pause button (Alt+Shift+P) pauses animations, the globe button (Alt+Shift+L) goes to another page of the app (a pasted URL keeps only its path), the list button shows the notes, and notes survive reloads until sent. \u2197 Open in the note panel opens the source file in their editor (\u29C9 Copy copies path:line); when no file is known, \u{1F50E} Locate asks you to find it. \u270E Edit in the note panel edits the file right in the page (with no file known, you find it first)",
      "The user can save files from the page while you work: re-read a file before you edit it",
      ...l.tailscale ? ["Also paste the tailscale link: it opens on the user's phone or any other device in their tailnet"] : [],
      listenHelp(st.port)
    ]
  };
}
var BASE_PORT = () => Number(process.env["PUNCHLIST_PORT"] || 4e3);
var PORT_TRIES = 20;
function portFree(port, host) {
  return new Promise((resolve2) => {
    const srv = net.createServer().once("error", () => {
      resolve2(false);
    });
    srv.listen(port, host, () => srv.close(() => {
      resolve2(true);
    }));
  });
}
async function cmdStart(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0])).origin;
  editorUrlTemplate(args["editor-url"]);
  if (args.root && !fs.existsSync(args.root)) throw usageError(`--root ${path.resolve(args.root)} does not exist`, "start");
  idleTimeout(args, "start");
  const auto = args.port == null, base = BASE_PORT();
  let port = auto ? base : Number(args.port);
  if (auto) {
    const running = runningProxies();
    const same = running.find((st) => st.target === target);
    if (same) return startOutput(same, "already running");
    const held = new Set(running.map((st) => st.port));
    while (port < base + PORT_TRIES - 1 && (held.has(port) || !await portFree(port, args.host ?? "127.0.0.1"))) port++;
  }
  const p = statePath(port);
  const old = fs.existsSync(p) ? readState(p) : null;
  if (old && alive(old.pid)) {
    if (old.target !== target) throw new AxiError(`port ${port} already proxies ${old.target}`, "PORT_BUSY", [`Run \`${PE} stop --port ${port}\` first, or pick another --port`]);
    return startOutput(old, "already running");
  }
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.rmSync(p, { force: true });
  const logFile = path.join(STATE_DIR, `${port}.log`);
  const fd = fs.openSync(logFile, "w");
  const child = spawn2(process.execPath, [SCRIPT, "serve", ...process.argv.slice(3)], { detached: true, stdio: ["ignore", fd, fd], env: { ...process.env, PUNCHLIST_PORT: String(port) } });
  child.unref();
  fs.closeSync(fd);
  const exit = { seen: false };
  child.on("exit", () => {
    exit.seen = true;
  });
  for (let i = 0; i < 100 && !exit.seen; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const st = runningProxies().find((s) => s.pid === child.pid);
    if (st) return startOutput(st, st.port === base || !auto ? "started" : `started (${st.port - base > 1 ? `ports ${base}-${st.port - 1} are` : `port ${base} is`} busy)`);
  }
  if (!exit.seen) child.kill();
  const log = fs.readFileSync(logFile, "utf8").trim().slice(-1e3);
  throw new AxiError(`proxy did not start: ${log || "no output"}`, "START_FAILED", [`Full log: ${logFile}`]);
}
function cmdServe(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0]));
  const auto = args.port == null;
  let port = Number(args.port ?? BASE_PORT());
  const lastPort = port + PORT_TRIES - 1;
  const host = args.host ?? "127.0.0.1";
  const root = path.resolve(args.root ?? ".");
  if (!fs.existsSync(root)) throw usageError(`--root ${root} does not exist`, "serve");
  const editorUrl = editorUrlTemplate(args["editor-url"]);
  let sshHost = null;
  const noAuth = args["no-auth"] === true;
  const wildcard = ["0.0.0.0", "::"].includes(host);
  const ts = noAuth || args["no-tailscale"] || args.host != null && !wildcard ? null : tailscaleSelf();
  const tailnetIps = ts && !wildcard ? ts.ips : [];
  const token = args.token ?? crypto.randomBytes(12).toString("base64url");
  const idleSecs = idleTimeout(args, "serve");
  const targetPort = Number(target.port) || (target.protocol === "https:" ? 443 : 80);
  const lib = target.protocol === "https:" ? https : http;
  const selfOrigins = [target.origin];
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
    for (const h of ["localhost", "127.0.0.1", "[::1]"]) selfOrigins.push(`${target.protocol}//${h}:${targetPort}`);
  }
  const origins = [...new Set(selfOrigins)];
  const items = [];
  const waiters = /* @__PURE__ */ new Set();
  const sse = /* @__PURE__ */ new Set();
  let seq = 0;
  const summarize = (p) => {
    const n = p.notes.length;
    return { label: n === 1 ? (p.notes[0]?.comment ?? "").slice(0, 60) : `${n} notes`, prompt: p.notes.map((x) => x.comment).join(" | ") };
  };
  const publicItem = (it) => ({ id: it.id, ...it.payload.kind ? { kind: it.payload.kind } : {}, status: it.status, message: it.message, ...summarize(it.payload), ...it.file ? { file: it.file } : {} });
  const broadcast = (obj) => {
    const line = `data: ${JSON.stringify(obj)}

`;
    for (const r of sse) r.write(line);
  };
  function dispatch() {
    for (const w of waiters) {
      const it = items.find((i) => i.status === "pending");
      if (!it) return;
      it.status = "working";
      waiters.delete(w);
      clearTimeout(w.timer);
      json(w.res, 200, it);
      broadcast({ type: "update", item: publicItem(it) });
    }
  }
  function authed(req) {
    if (noAuth) return true;
    return getCookie(req.headers.cookie, COOKIE) === token || req.headers["x-pe-token"] === token;
  }
  function upstreamHeaders(req) {
    const h = { ...req.headers };
    h.host = target.host;
    if (h.origin) h.origin = target.origin;
    if (h.referer) {
      try {
        const u = new URL(h.referer);
        h.referer = target.origin + u.pathname + u.search;
      } catch {
      }
    }
    delete h["accept-encoding"];
    const c = stripCookie(h.cookie, COOKIE);
    if (c) h.cookie = c;
    else delete h.cookie;
    return Object.fromEntries(Object.entries(h).filter(([k]) => !k.startsWith("x-forwarded-") && k !== "forwarded" && k !== "x-pe-token"));
  }
  function rewriteLocation(loc) {
    for (const o of origins) if (loc === o || loc.startsWith(o + "/") || loc.startsWith(o + "?")) return loc.slice(o.length) || "/";
    return loc;
  }
  function injectHtml(html) {
    for (const o of origins) html = html.split(o + "/").join("/").split(o).join("/");
    const tag = `<script src="${PREFIX}/client.js" defer data-pe></script>`;
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + "</head>");
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => m + tag);
    return html + tag;
  }
  function proxy(req, res) {
    const upReq = lib.request({
      hostname: target.hostname.replace(/^\[|\]$/g, ""),
      port: targetPort,
      method: req.method,
      path: req.url,
      headers: upstreamHeaders(req),
      rejectUnauthorized: false
    }, (upRes) => {
      const status = upRes.statusCode ?? 502;
      const h = { ...upRes.headers };
      delete h["content-security-policy"];
      delete h["content-security-policy-report-only"];
      if (h.location) h.location = rewriteLocation(h.location);
      if (h["set-cookie"]) h["set-cookie"] = h["set-cookie"].map((c) => c.replace(/;\s*domain=[^;]*/i, ""));
      const isHtml = /text\/html/i.test(h["content-type"] ?? "");
      if (!isHtml || req.method === "HEAD" || status === 204 || status === 304) {
        res.writeHead(status, h);
        upRes.pipe(res);
        return;
      }
      let stream = upRes;
      const enc = (h["content-encoding"] ?? "").toLowerCase();
      if (enc === "gzip") stream = upRes.pipe(zlib.createGunzip());
      else if (enc === "br") stream = upRes.pipe(zlib.createBrotliDecompress());
      else if (enc === "deflate") stream = upRes.pipe(zlib.createInflate());
      const chunks = [];
      stream.on("data", (c) => chunks.push(c));
      stream.on("error", (e) => {
        if (!res.headersSent) res.writeHead(502);
        res.end(`punchlist: decode error ${e.message}`);
      });
      stream.on("end", () => {
        const body = Buffer.from(injectHtml(Buffer.concat(chunks).toString("utf8")), "utf8");
        delete h["content-encoding"];
        delete h["transfer-encoding"];
        h["content-length"] = String(body.length);
        res.writeHead(status, h);
        res.end(body);
      });
    });
    upReq.on("error", (e) => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end(`punchlist: cannot reach ${target.origin} (${e.code ?? e.message}). Is the dev server running?`);
    });
    req.pipe(upReq);
  }
  async function handleApi(req, res, url) {
    const p = url.pathname.slice(PREFIX.length);
    if (p === "/client.js" || p === "/editor.js") {
      const js = fs.readFileSync(path.join(DIR, p.slice(1)));
      const gz = /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
      res.writeHead(200, {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "no-store",
        vary: "accept-encoding",
        ...gz ? { "content-encoding": "gzip" } : {}
      });
      res.end(gz ? zlib.gzipSync(js) : js);
      return;
    }
    if (p === "/requests" && req.method === "POST") {
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch (e) {
        json(res, 400, { error: errorMessage(e) });
        return;
      }
      if (!isPayload(payload)) {
        json(res, 400, { error: "expected { notes: [{ comment, elements: [...] }] }" });
        return;
      }
      const it = { id: `r${++seq}`, status: "pending", createdAt: (/* @__PURE__ */ new Date()).toISOString(), payload, message: null };
      items.push(it);
      log(`received ${it.id}: ${summarize(payload).prompt.slice(0, 100)}`);
      broadcast({ type: "update", item: publicItem(it) });
      dispatch();
      json(res, 201, publicItem(it));
      return;
    }
    if (p === "/requests" && req.method === "GET") {
      json(res, 200, items.map(publicItem));
      return;
    }
    const one = /^\/requests\/([\w-]+)$/.exec(p)?.[1], done = /^\/requests\/([\w-]+)\/done$/.exec(p)?.[1];
    if (one && req.method === "GET") {
      const it = items.find((i) => i.id === one);
      if (it) json(res, 200, it);
      else json(res, 404, { error: "unknown id" });
      return;
    }
    if (done && req.method === "POST") {
      const it = items.find((i) => i.id === done);
      if (!it) {
        json(res, 404, { error: "unknown id" });
        return;
      }
      let body = {};
      try {
        body = JSON.parse(await readBody(req) || "{}");
      } catch {
      }
      it.status = body.status === "failed" ? "failed" : "done";
      it.message = typeof body.message === "string" && body.message ? body.message : null;
      const f = body.file;
      if (it.status === "done" && typeof f?.file === "string") it.file = { file: f.file, ...f.line ? { line: Number(f.line) } : {}, ...f.column ? { column: Number(f.column) } : {} };
      log(`${it.status} ${it.id}${it.message ? `: ${it.message}` : ""}`);
      broadcast({ type: "update", item: publicItem(it) });
      json(res, 200, publicItem(it));
      return;
    }
    if (p === "/open" && req.method === "POST") {
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch (e) {
        json(res, 400, { error: errorMessage(e) });
        return;
      }
      if (typeof body.file !== "string" || !body.file) {
        json(res, 400, { error: "expected { file, line?, column?, launch?, request? }" });
        return;
      }
      const it = typeof body.request === "string" ? items.find((i) => i.id === body.request) : void 0;
      if (it?.payload.edit) {
        const f = editable(body.file);
        if ("error" in f) {
          json(res, f.status, { error: f.error });
          return;
        }
      }
      const r = openInEditor(body.file, Number(body.line) || 0, Number(body.column) || 0, body.launch !== false);
      json(res, r.status, r.status === 200 ? r.result : { error: r.error });
      return;
    }
    if (p === "/file" && req.method === "GET") {
      const f = editable(url.searchParams.get("path") ?? "");
      if ("error" in f) {
        json(res, f.status, { error: f.error });
        return;
      }
      const buf = fs.readFileSync(f.real);
      if (buf.includes(0)) {
        json(res, 415, { error: `${f.rel} is a binary file` });
        return;
      }
      json(res, 200, { file: f.rel, content: buf.toString("utf8"), etag: etag(buf) });
      return;
    }
    if (p === "/file" && req.method === "POST") {
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch (e) {
        json(res, 400, { error: errorMessage(e) });
        return;
      }
      const { file, content, etag: base } = body;
      if (typeof file !== "string" || typeof content !== "string" || typeof base !== "string") {
        json(res, 400, { error: "expected { file, content, etag }" });
        return;
      }
      const f = editable(file);
      if ("error" in f) {
        json(res, f.status, { error: f.error });
        return;
      }
      const now = etag(fs.readFileSync(f.real));
      if (now !== base) {
        json(res, 409, { error: `${f.rel} changed on disk since it was opened`, etag: now });
        return;
      }
      const buf = Buffer.from(content, "utf8");
      fs.writeFileSync(f.real, buf);
      log(`saved ${f.rel} from the browser editor (${buf.length} bytes)`);
      json(res, 200, { file: f.rel, etag: etag(buf) });
      return;
    }
    if (p === "/next" && req.method === "GET") {
      const timeout = Math.min(Number(url.searchParams.get("timeout")) || 25e3, 6e4);
      const w = { res };
      w.timer = setTimeout(() => {
        waiters.delete(w);
        res.writeHead(204);
        res.end();
      }, timeout);
      req.on("close", () => {
        clearTimeout(w.timer);
        waiters.delete(w);
      });
      waiters.add(w);
      dispatch();
      return;
    }
    if (p === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(`data: ${JSON.stringify({ type: "snapshot", items: items.map(publicItem) })}

`);
      sse.add(res);
      const ka = setInterval(() => res.write(": ka\n\n"), 25e3);
      req.on("close", () => {
        clearInterval(ka);
        sse.delete(res);
      });
      return;
    }
    json(res, 404, { error: "not found" });
  }
  const handler = (req, res) => {
    touch();
    res.on("close", touch);
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname === `${PREFIX}/auth`) {
      const next = url.searchParams.get("next");
      const dest = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      if (noAuth || url.searchParams.get("token") === token) {
        res.writeHead(302, { "set-cookie": `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`, location: dest });
      } else res.writeHead(403, { "content-type": "text/plain" });
      res.end(res.statusCode === 403 ? "punchlist: bad token" : "");
      return;
    }
    if (!authed(req)) {
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8" });
      res.end("punchlist: open the link printed by `punchlist start` (it carries the access token).");
      return;
    }
    if (url.pathname.startsWith(PREFIX + "/")) {
      handleApi(req, res, url).catch((e) => {
        json(res, 500, { error: errorMessage(e) });
      });
      return;
    }
    proxy(req, res);
  };
  const onUpgrade = (req, socket, head) => {
    touch();
    if (!authed(req)) {
      socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return;
    }
    const opts = { host: target.hostname.replace(/^\[|\]$/g, ""), port: targetPort, servername: target.hostname, rejectUnauthorized: false };
    const up = target.protocol === "https:" ? tls.connect(opts, onConnect) : net.connect(opts, onConnect);
    function onConnect() {
      let raw = `${req.method ?? "GET"} ${req.url ?? "/"} HTTP/1.1\r
`;
      const h = upstreamHeaders(req);
      for (const [k, v] of Object.entries(h)) for (const vv of [v ?? []].flat()) raw += `${k}: ${vv}\r
`;
      up.write(raw + "\r\n");
      if (head.length) up.write(head);
      up.pipe(socket);
      socket.pipe(up);
    }
    up.on("error", () => socket.destroy());
    socket.on("error", () => up.destroy());
  };
  function projectFile(file) {
    const inside = (dir, f) => f === dir || f.startsWith(dir + path.sep);
    const abs = path.resolve(root, file);
    if (!inside(root, abs)) return { status: 403, error: "file is outside the project" };
    let real;
    try {
      real = fs.realpathSync(abs);
    } catch {
      return { status: 404, error: `${file} not found in ${root}` };
    }
    const realRoot = fs.realpathSync(root);
    if (!inside(realRoot, real)) return { status: 403, error: "file is outside the project" };
    return { abs, real, rel: path.relative(root, abs), realRoot };
  }
  function editable(file) {
    const f = projectFile(file);
    if ("error" in f) return f;
    const realRel = path.relative(f.realRoot, f.real);
    if ([...f.rel.split(path.sep), ...realRel.split(path.sep)].some((s) => s.startsWith(".") || s === "node_modules"))
      return { status: 403, error: `${f.rel} cannot be edited in the browser (dotfiles and node_modules are off limits)` };
    try {
      execFileSync("git", ["check-ignore", "-q", "--", realRel], { cwd: f.realRoot, stdio: "ignore" });
      return { status: 403, error: `${f.rel} cannot be edited in the browser (git ignores it)` };
    } catch {
    }
    const stat = fs.statSync(f.real);
    if (!stat.isFile()) return { status: 404, error: `${f.rel} is not a file` };
    if (stat.size > 2e6) return { status: 413, error: `${f.rel} is too large to edit in the browser` };
    return f;
  }
  const etag = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  function openInEditor(file, line, column, launch) {
    const f = projectFile(file);
    if ("error" in f) return f;
    const { abs, rel } = f;
    sshHost ??= `${os.userInfo().username}@${(ts ?? tailscaleSelf())?.name ?? os.hostname()}`;
    const vars = { host: sshHost, abs, file: rel, line: String(line || 1), col: String(column || 1) };
    const url = editorUrl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
    if (launch) {
      const failures = [];
      (0, import_launch_editor.default)(abs + (line ? `:${line}${column ? `:${column}` : ""}` : ""), (_f, msg) => failures.push(msg ?? "no editor found (set LAUNCH_EDITOR or EDITOR)"));
      if (failures[0]) return { status: 500, error: failures[0] };
      log(`opened ${rel}${line ? `:${line}` : ""} in the editor`);
    }
    return { status: 200, result: { file: rel, abs, url } };
  }
  function log(msg) {
    console.log(`[punchlist ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${msg}`);
  }
  const listenOn = (h) => new Promise((resolve2) => {
    const s = http.createServer(handler).on("upgrade", onUpgrade).once("error", resolve2);
    s.listen(port, h, () => {
      s.off("error", resolve2);
      resolve2(s);
    });
  });
  const fail = (msg) => {
    console.error(msg);
    process.exit(1);
  };
  async function bind() {
    for (; ; ) {
      const main = await listenOn(host);
      if (!(main instanceof http.Server)) {
        if (main.code === "EADDRINUSE" && auto && port < lastPort) {
          log(`port ${port} is in use, trying ${port + 1}`);
          port++;
          continue;
        }
        return fail(main.code === "EADDRINUSE" ? `port ${port} is in use (pick another with --port)` : main.message);
      }
      const servers = [main];
      let clash = false;
      for (const ip of tailnetIps) {
        const s = await listenOn(ip);
        if (s instanceof http.Server) servers.push(s);
        else if (s.code === "EADDRINUSE") {
          clash = true;
          break;
        } else log(`not listening on tailscale address ${ip}: ${s.code ?? s.message}`);
      }
      if (!clash) return servers.length > 1 || wildcard;
      for (const s of servers) s.close();
      if (auto && port < lastPort) {
        log(`port ${port} is in use on the tailnet, trying ${port + 1}`);
        port++;
        continue;
      }
      return fail(`port ${port} is in use on the tailscale address (pick another with --port, or pass --no-tailscale)`);
    }
  }
  void bind().then((onTailnet) => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const st = { port, host, target: target.origin, token, auth: !noAuth, pid: process.pid, cwd: process.cwd(), ...ts && onTailnet ? { tailnet: ts.name } : {} };
    fs.writeFileSync(statePath(port), JSON.stringify(st));
    printInfo(st);
  });
  const cleanup = () => {
    try {
      fs.unlinkSync(statePath(port));
    } catch {
    }
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  const idle = idleSecs > 0 ? setTimeout(() => {
    if (waiters.size) {
      touch();
      return;
    }
    log(`no requests for ${idleSecs}s, exiting`);
    cleanup();
  }, Math.min(idleSecs * 1e3, 2 ** 31 - 1)) : null;
  function touch() {
    idle?.refresh();
  }
  return new Promise(() => void 0);
}
function isPayload(x) {
  const notes = x?.notes;
  return Array.isArray(notes) && notes.length > 0 && notes.every((n) => {
    const { kind, comment, elements } = n ?? {};
    return typeof comment === "string" && comment.trim() !== "" && Array.isArray(elements) && (elements.length > 0 || kind === "page");
  });
}
var HTML_LIMIT = 600;
function requestView(it, port, full = false) {
  const { notes, viewport } = it.payload;
  const kinds = new Set(notes.map((n) => n.kind));
  const cut = !full && notes.some((n) => n.elements.some((e) => (e.html?.length ?? 0) > HTML_LIMIT));
  const noHint = [];
  const view = {
    request: { id: it.id, status: it.status, notes: notes.length, ...viewport ? { viewport: `${viewport.w}x${viewport.h}` } : {} },
    notes: notes.map((n, i) => ({
      key: String(i + 1),
      kind: n.kind,
      comment: n.comment,
      page: n.path,
      ...n.frozen ? { frozen: "captured with animations paused" } : {},
      ...n.kind === "page" && n.title ? { title: n.title } : {},
      ...n.kind === "text" ? { selected: n.text } : {},
      ...n.kind === "area" && n.area ? { area: `${Math.round(n.area.width)}x${Math.round(n.area.height)} at page (${Math.round(n.area.x)}, ${Math.round(n.area.y)})` } : {},
      targets: n.elements.map((e, j) => {
        const key = n.elements.length > 1 ? `${i + 1}${"abcdef".charAt(j)}` : String(i + 1);
        const h = e.hints ?? {};
        const hints = Object.fromEntries(["svelte", "rails", "react", "vue"].flatMap((k) => {
          const v = h[k];
          return v?.length ? [[k, v.join(k === "rails" ? " > " : k === "svelte" ? ", " : " < ")]] : [];
        }));
        if (!Object.keys(hints).length) noHint.push(key);
        let html = e.html ?? "";
        if (!full && html.length > HTML_LIMIT) html = `${html.slice(0, HTML_LIMIT)}... (truncated, ${html.length} chars total)`;
        return {
          key,
          label: e.label,
          ...Object.keys(hints).length ? { hints } : {},
          ...e.text ? { text: e.text } : {},
          html,
          ...full ? {
            selector: e.selector,
            ...e.ancestors?.length ? { inside: e.ancestors.join(" > ") } : {},
            ...e.styles ? { styles: e.styles } : {},
            ...e.rect ? { box: `${Math.round(e.rect.width)}x${Math.round(e.rect.height)} at page (${Math.round(e.rect.x)}, ${Math.round(e.rect.y)})` } : {}
          } : {}
        };
      })
    }))
  };
  if (it.payload.kind === "locate") return { ...view, request: { ...view.request, kind: "locate" }, help: [
    `The user wants to open the source of this target ${it.payload.edit ? "in the editor in their browser (only source files: no dotfiles, node_modules or git-ignored files)" : "in their editor"}: find the file (and line) that renders it. Lookup only - do not edit anything`,
    "Use the hints first (a component name: grep for its definition), then visible text, ids, data-* attributes or uncommon classes",
    `Run \`${PE} done ${it.id} --open <file>[:line[:col]] --port ${port}\` to hand it back (a path relative to the project; the browser offers Open / Copy); --failed "<why>" if you cannot find it`
  ] };
  const help = ["Handle every note (notes may touch the same file), then report once"];
  if (kinds.has("elements")) help.push("kind elements: apply the comment to every target; they often share one partial or component");
  if (kinds.has("text")) help.push("kind text: change exactly the selected text; it may live in an i18n file (config/locales, src/lib/i18n)");
  if (kinds.has("page")) help.push("kind page: no target, the note is about the whole page; the page path tells you the route (its layout and template)");
  if (kinds.has("area")) help.push("kind area: the user boxed empty space; the change belongs at that spot inside the target");
  if (noHint.length) help.push(`No source hint for [${noHint.join("], [")}]: grep for the visible text, ids, data-* attributes or uncommon classes; the page path tells you the route`);
  if (cut || !full) help.push(`Run \`${PE} show ${it.id} --full --port ${port}\` for selectors, computed styles${cut ? " and the full HTML" : ""}`);
  help.push(`Run \`${PE} done ${it.id} "<one line per note, e.g. 1: ... 2: ...>" --port ${port}\` when finished (--failed if nothing could be done)`);
  return { ...view, help };
}
async function cmdWait(args) {
  const st = loadState(args);
  const secs = Number(args.timeout ?? 540);
  if (!(secs > 0)) throw usageError("--timeout must be a number of seconds", "wait");
  const deadline = Date.now() + secs * 1e3;
  while (Date.now() < deadline) {
    const left = Math.max(1e3, Math.min(25e3, deadline - Date.now()));
    const r = await api(st, `/next?timeout=${left}`);
    if (r.status === 200) {
      const it = await r.json();
      return args.json ? JSON.stringify(it, null, 2) : requestView(it, st.port);
    }
    if (r.status !== 204) throw new AxiError(`unexpected ${r.status} from the proxy: ${(await r.text()).slice(0, 300)}`, "PROXY_ERROR");
  }
  return { request: `none (waited ${secs}s)`, help: [listenHelp(st.port)] };
}
async function cmdShow(args) {
  const id = args._[0];
  if (!id) throw usageError("request id is required", "show", [`Run \`${PE} show <id> [--full]\``]);
  const st = loadState(args);
  const r = await api(st, `/requests/${encodeURIComponent(id)}`);
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, "NOT_FOUND", [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  return requestView(await r.json(), st.port, args.full === true);
}
async function cmdDone(args) {
  const id = args._[0];
  if (!id) throw usageError("request id is required", "done", [`Run \`${PE} done <id> "<one line per note>"\``]);
  const st = loadState(args);
  const status = args.failed ? "failed" : "done";
  let message = args._.slice(1).join(" ") || null;
  let found = null;
  if (args.open && !args.failed) {
    const [, file, line, column] = /^(.+?)(?::(\d+))?(?::(\d+))?$/.exec(args.open) ?? [];
    const o = await api(st, "/open", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file, line, column, launch: false, request: id }) });
    const b = await o.json().catch(() => ({}));
    if (!o.ok || !b.file) throw new AxiError(`could not open ${args.open}: ${b.error ?? o.status}`, "OPEN_FAILED", [
      `Fix the path and run \`${PE} done ${id} --open <file>[:line[:col]] --port ${st.port}\` again`,
      ...o.status === 403 ? [`If no editable file renders it, run \`${PE} done ${id} "<why>" --failed --port ${st.port}\``] : []
    ]);
    found = { file: b.file, ...line ? { line: Number(line) } : {}, ...column ? { column: Number(column) } : {} };
    message ??= `found ${b.file}${line ? `:${line}${column ? `:${column}` : ""}` : ""}`;
  }
  const r = await api(st, `/requests/${encodeURIComponent(id)}/done`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, message, ...found ? { file: found } : {} })
  });
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, "NOT_FOUND", [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  if (!r.ok) throw new AxiError(`proxy refused: ${r.status} ${(await r.text()).slice(0, 300)}`, "PROXY_ERROR");
  return { request: { id, status }, help: [listenHelp(st.port)] };
}
async function cmdStatus(args) {
  const st = loadState(args);
  const list = await (await api(st, "/requests")).json();
  const by = (s) => list.filter((i) => i.status === s).length;
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid },
    count: list.length ? `${list.length} request${list.length === 1 ? "" : "s"} (${by("pending")} pending, ${by("working")} working, ${by("done")} done, ${by("failed")} failed)` : "0 requests - the user has not sent anything yet",
    ...list.length ? { requests: list.map((i) => ({ id: i.id, status: i.status, prompt: i.prompt })) } : {},
    help: [`Run \`${PE} wait --port ${st.port}\` to receive the next batch`]
  };
}
function cmdStop(args) {
  const port = args.port;
  const p = port ? statePath(port) : null;
  if (p && !fs.existsSync(p) || !p && !runningProxies().length) return { stop: `no proxy running${port ? ` on port ${port}` : ""} (no-op)` };
  const st = loadState(args);
  try {
    process.kill(st.pid, "SIGTERM");
  } catch {
    fs.rmSync(statePath(st.port), { force: true });
  }
  return { stop: `stopped the proxy on port ${st.port}` };
}
function runningProxies() {
  if (!fs.existsSync(STATE_DIR)) return [];
  return fs.readdirSync(STATE_DIR).filter((f) => f.endsWith(".json")).flatMap((f) => {
    try {
      return [readState(path.join(STATE_DIR, f))];
    } catch {
      return [];
    }
  }).filter((st) => alive(st.pid));
}
async function home() {
  const here = process.cwd();
  const mine = (st) => st.cwd !== void 0 && (here === st.cwd || here.startsWith(st.cwd + path.sep));
  const sts = runningProxies(), local = sts.filter(mine), others = sts.length - local.length;
  const proxies = await Promise.all(local.map(async (st) => {
    let pending = "?";
    try {
      pending = (await (await api(st, "/requests", { signal: AbortSignal.timeout(1500) })).json()).filter((i) => i.status === "pending").length;
    } catch {
    }
    return { port: st.port, target: st.target, pending };
  }));
  return {
    proxies: proxies.length ? proxies : "0 running for this directory",
    ...others ? { other_proxies: `${others} (started from other directories; see \`${PE} status --port <port>\`)` } : {},
    help: proxies.length ? [`Run \`${PE} wait --port <port>\` to receive notes`, `Run \`${PE} status --port <port>\` to list requests`, `Run \`${PE} --help\` for commands and the loop`] : [`Run \`${PE} start --target <port|url>\` to proxy a dev server`, `Run \`${PE} --help\` for commands and the loop`]
  };
}
function cmdSetup(args) {
  if (args._[0] !== "hooks" || args._.length > 1) throw usageError("unknown setup target", "setup", [`Run \`${PE} setup hooks [--project] [--remove]\``]);
  if (VIA_NPX && !args.remove) throw new AxiError(
    "setup hooks needs an installed punchlist-axi (the npx cache path can disappear)",
    "NOT_INSTALLED",
    ["Run `npm i -g punchlist-axi`, then `punchlist-axi setup hooks`"]
  );
  const scope = args.project ? "project" : "user";
  const identity = { marker: "punchlist-axi", execPath: SCRIPT, scope };
  const problems = [];
  const onError = (m) => {
    problems.push(m);
  };
  if (args.remove) uninstallSessionStartHooks({ ...identity, onError });
  else installSessionStartHooks({ ...identity, binaryNames: ["punchlist-axi"], shouldInstall: () => true, onError });
  const st = sessionStartHookStatus(identity);
  const row = (agent, a) => ({ agent, installed: a.installed, path: a.path.replace(os.homedir(), "~") });
  return {
    setup: `${args.remove ? "removed" : "installed or already up to date"}: SessionStart hooks (${scope} scope)`,
    agents: [row("claude", st.claude), row("codex", st.codex), row("opencode", st.opencode)],
    ...problems.length ? { warnings: problems } : {},
    help: args.remove ? [`Run \`${PE} setup hooks${args.project ? " --project" : ""}\` to install them again`] : ["Each new agent session now starts with the proxies running for its directory", `Run \`${PE} setup hooks --remove${args.project ? " --project" : ""}\` to undo`]
  };
}
var REAL_SCRIPT = (() => {
  try {
    return fs.realpathSync(SCRIPT);
  } catch {
    return SCRIPT;
  }
})();
var VIA_NPX = REAL_SCRIPT.split(path.sep).includes("_npx");
var ON_PATH = !VIA_NPX && (process.env["PATH"] ?? "").split(path.delimiter).some((dir) => {
  try {
    return dir !== "" && fs.realpathSync(path.join(dir, "punchlist-axi")) === REAL_SCRIPT;
  } catch {
    return false;
  }
});
var PE = VIA_NPX ? "npx -y punchlist-axi" : ON_PATH ? "punchlist-axi" : `node ${SCRIPT}`;
var WAIT_EXECUTION_GUIDANCE = "Keep wait in the foreground by default. Use a background command only if a tracked job in your harness reliably resumes or notifies the same agent on completion (Claude Code: Bash with run_in_background: true). Codex: keep this turn active; if exec_command returns a session ID, use write_stdin to collect its output. A running command alone does not guarantee a new turn. Do not detach wait with nohup, shell &, disown or redirected output without a verified callback. Do not claim to be listening until you can receive the command output";
var listenHelp = (port) => `Run \`${PE} wait --port ${port}\` to receive notes. ${WAIT_EXECUTION_GUIDANCE}. Run wait again after every done or timeout until the user tells you to stop`;
var GUIDE = `punchlist - click-to-edit for any running web app. A local proxy injects a picker into every
page; the user marks elements and presses Send; you pull the notes, edit the source, report back.

commands:
  start   proxy a dev server in the background and print the link for the user
  wait    block until the user sends notes, then print them
  show    print a request again (--full: selectors, styles, full HTML)
  done    report a request back to the browser
  status  list requests on a proxy
  stop    stop a proxy
  setup   add a SessionStart hook so new agent sessions see running proxies
  serve   run the proxy in the foreground (debugging)

loop: start -> send the user the link -> wait -> edit the source -> done -> wait ...
Read \`${PE} wait --help\` for how to keep receiving notes in your agent harness.
Every output ends with help lines that name the next command.
Run \`${PE} <command> --help\` for flags, examples and guidance.`;
var HELP = {
  start: `start --target <port|url> [--port 4000] [--host 127.0.0.1] [--no-auth] [--no-tailscale] [--root .] [--editor-url vscode] [--idle-timeout 3600]
  Start the proxy in the background and print the link for the user. Safe to re-run: without
  --port it reuses the proxy for the same target. Always pass the printed --port to later commands.
  Find the dev server port from running processes, Procfile.dev, bin/dev, package.json scripts or
  the conversation; ask the user only if it is unclear.
  --target   dev server port or URL (required)
  --port     proxy port, strict (default: 4000, or the next free port when it is busy;
             set PUNCHLIST_PORT to start from another port)
  --host     listen address (default 127.0.0.1; 0.0.0.0 = all interfaces)
  --no-auth  no access token (purely local use only; never on the tailnet)
  --no-tailscale  do not listen on the tailnet
  --root     project directory that \u2197 Open resolves source hints against (default: the cwd)
  --editor-url  how \u2197 Open reaches the editor from a browser on another machine (tailscale):
             vscode (default), cursor, windsurf, zed, or a template with {host} {abs} {line} {col}
             ({host} = user@<tailscale name>; the editor connects back over SSH).
             A browser on localhost opens the file in the editor on this machine instead
  --idle-timeout  seconds without any request (page loads, a running wait) before the proxy
             exits on its own (default 3600; 0 = never). After that, run start again
  When tailscale is installed and connected, the proxy also listens on this machine's tailnet
  addresses and prints a tailscale link (http://<machine>.<tailnet>.ts.net:<port>) that opens on
  the user's phone. Only tailnet devices reach it, and the link token is still required.
  Never use \`tailscale funnel\`: anyone who reaches the proxy can make you edit code.
examples:
  ${PE} start --target 5173
  ${PE} start --target http://localhost:3000 --port 4001`,
  serve: `serve --target <port|url> [same flags as start]
  Run the proxy in the foreground (debugging). Agents use start.`,
  wait: `wait [--port 4000] [--timeout 540] [--json]
  Block until the user presses Send, then print the batch of notes.
  Prints \`request: none\` (exit 0) when nothing arrives in time: run it again.
  --port     proxy port (default: most recently started proxy)
  --timeout  seconds to wait (default 540, under most shell-tool limits)
  --json     raw request JSON instead of the formatted view
  Share the proxy link in a progress message before waiting, so the user can open it.
  ${WAIT_EXECUTION_GUIDANCE}.
  Keep waiting in the active turn when your harness has no completion notifications.
  Do not send a final reply while expecting
  a detached wait to wake you. With completion notifications, a longer --timeout
  (e.g. 3600) means fewer empty wake-ups.
  Run wait again after every done and every timeout until the user tells you to stop.
  Notes queue on the proxy while it runs. If your turn already ended, the user can ask
  you to pick up the queued notes; run wait to receive them. SessionStart hooks provide
  context at session start, not a notification when the user presses Send.
finding the source (in this order):
  1. svelte file:line:col (or React _debugSource) - open it directly
  2. rails templates - the last entry is the innermost partial. Needs
     config.action_view.annotate_rendered_view_with_filenames = true in development; suggest it
     once for Rails apps, never add it without the user's consent
  3. react/vue component names - grep for the definition
  4. no hints - grep for visible text (also i18n files), ids, data-* attributes, rare classes
  The HTML is rendered output, not source. Make the smallest change; if a target comes from a
  shared partial or component, say in done that every use changes.
examples:
  ${PE} wait --port 4000`,
  show: `show <id> [--full] [--port 4000]
  Print one request again. --full adds selectors, ancestors, computed styles, boxes and untruncated HTML.
examples:
  ${PE} show r1 --full --port 4000`,
  done: `done <id> "<one line per note>" [--failed] [--open <file[:line[:col]]>] [--port 4000]
  Report a request back to the browser (shown as a toast). Run it once per request.
  If some notes fail, still do the others and name the failed ones in the message.
  --failed   nothing could be done; the message says why
  --open     the project file you found (answers a locate request); the user gets Open / Copy,
             or the file opens in the page editor when they asked for \u270E Edit
examples:
  ${PE} done r1 "1: CTA larger  2: doors time -> 18:00" --port 4000
  ${PE} done r2 "need the new copy for the hero" --failed
  ${PE} done r3 --open app/assets/javascripts/components/hero.js.jsx:12`,
  status: `status [--port 4000]
  List the requests on a proxy with counts by state.`,
  stop: `stop [--port 4000]
  Stop a proxy. No-op when nothing runs.`,
  setup: `setup hooks [--project] [--remove]
  Add a SessionStart hook to Claude Code, Codex and OpenCode: each session starts with the
  proxies running for its directory (the no-args home view). Safe to re-run.
  --project  write the project's config (.claude/settings.json, ...) instead of the user's
  --remove   take the hooks out again
examples:
  ${PE} setup hooks
  ${PE} setup hooks --remove`
};
var handlers = { start: cmdStart, serve: cmdServe, wait: cmdWait, show: cmdShow, done: cmdDone, status: cmdStatus, stop: cmdStop, setup: cmdSetup };
var cmds = Object.fromEntries(Object.keys(handlers).map((k) => [k, (argv) => handlers[k](parseArgs(k, argv))]));
await runAxiCli({
  description: "Click-to-edit for running web apps: the user marks UI in the browser, you pull the notes and edit the source",
  version: VERSION,
  topLevelHelp: GUIDE + "\n",
  home,
  commands: cmds,
  getCommandHelp: (c) => {
    const h = HELP[c];
    return h ? h + "\n" : null;
  }
});
