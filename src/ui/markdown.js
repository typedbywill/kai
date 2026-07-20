// Convert QML color object/value to hex string
function colorToHex(color) {
    if (!color) return "#888888";
    if (typeof color === "string") {
        if (color.startsWith("#")) return color;
        return color;
    }
    // QML color objects have r, g, b, a properties in [0..1] range
    if (typeof color.r === "number") {
        var r = Math.round(color.r * 255).toString(16).padStart(2, '0');
        var g = Math.round(color.g * 255).toString(16).padStart(2, '0');
        var b = Math.round(color.b * 255).toString(16).padStart(2, '0');
        return "#" + r + g + b;
    }
    return color.toString();
}

// Escapes special HTML characters to prevent rendering or nesting bugs
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Syntax highlighting implementation for common languages
function highlightCode(code, lang, isDarkTheme) {
    var escaped = escapeHtml(code);
    if (!lang) {
        return escaped;
    }
    lang = lang.toLowerCase().trim();

    // Define syntax color scheme matching active theme
    var colors = {
        keyword: isDarkTheme ? "#ff79c6" : "#d73a49",    // pink / red
        type: isDarkTheme ? "#8be9fd" : "#005cc5",       // cyan / blue
        string: isDarkTheme ? "#f1fa8c" : "#032f62",     // yellow / dark blue
        comment: isDarkTheme ? "#6272a4" : "#6a737d",    // gray-blue / gray
        number: isDarkTheme ? "#bd93f9" : "#005cc5",     // purple / blue
        builtin: isDarkTheme ? "#50fa7b" : "#e36209",    // green / orange-brown
        property: isDarkTheme ? "#ffb86c" : "#6f42c1"    // orange / purple
    };

    function span(content, type) {
        return "<font color=\"" + colors[type] + "\">" + content + "</font>";
    }

    var tokens = [];
    var tokenPlaceholder = "___TOKEN_PLACEHOLDER_";

    function addToken(content, type) {
        var id = tokens.length;
        tokens.push({ content: content, type: type });
        return tokenPlaceholder + id + "___";
    }

    // Identify standard comment & string styles to preserve them from formatting
    var combinedRegex;
    if (lang === "html" || lang === "xml") {
        combinedRegex = /(&lt;!--[\s\S]*?--&gt;)|("([^"\\]|\\.)*")|('([^'\\]|\\.)*')/g;
    } else if (lang === "python" || lang === "bash" || lang === "shell" || lang === "sh") {
        combinedRegex = /(#.*)|("([^"\\]|\\.)*")|('([^'\\]|\\.)*')/g;
    } else { // js, ts, cpp, c, csharp, java, qml
        combinedRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`([^`\\]|\\.)*`)/g;
    }

    var tokenizedText = escaped.replace(combinedRegex, function(match) {
        var firstChar = match.charAt(0);
        if (firstChar === '/' || firstChar === '#' || match.startsWith("&lt;!--")) {
            return addToken(match, "comment");
        } else {
            return addToken(match, "string");
        }
    });

    var keywords, types, builtins;

    if (lang === "js" || lang === "javascript" || lang === "ts" || lang === "typescript" || lang === "qml") {
        keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|typeof|instanceof|class|extends|import|export|from|default|as|key|property|signal|readonly|id)\b/g;
        types = /\b(String|Number|Boolean|Array|Object|Function|Promise|RegExp|Date|var|let|const)\b/g;
        builtins = /\b(console|window|document|Math|JSON|Qt|console\.log|print)\b/g;
    } else if (lang === "python" || lang === "py") {
        keywords = /\b(def|class|if|elif|else|for|while|break|continue|return|import|from|as|in|is|not|and|or|try|except|finally|raise|assert|pass|with|lambda|global|nonlocal|del)\b/g;
        types = /\b(int|float|str|bool|list|dict|tuple|set|frozenset|object|type)\b/g;
        builtins = /\b(print|len|range|enumerate|zip|map|filter|sum|min|max|abs|str|int|float|bool|list|dict)\b/g;
    } else if (lang === "cpp" || lang === "c" || lang === "h" || lang === "hpp") {
        keywords = /\b(if|else|for|while|do|switch|case|break|continue|return|class|struct|union|enum|public|private|protected|virtual|override|final|inline|const|volatile|static|extern|namespace|using|template|typename|friend|new|delete|sizeof|typeof|alignof)\b/g;
        types = /\b(int|char|float|double|bool|void|wchar_t|short|long|signed|unsigned|size_t|auto|std::string|std::vector|std::map|std::set|std::shared_ptr|std::unique_ptr|QString|QVariant|QList|QObject|signals|slots|public slots|private slots|Q_OBJECT|Q_PROPERTY|Q_INVOKABLE)\b/g;
        builtins = /\b(std::cout|std::cin|std::endl|qDebug|qWarning|qInfo|qFatal)\b/g;
    } else if (lang === "html" || lang === "xml") {
        tokenizedText = tokenizedText.replace(/&lt;(\/?)(\w+)/g, function(match, slash, tagName) {
            return "&lt;" + slash + span(tagName, "keyword");
        });
        tokenizedText = tokenizedText.replace(/(\w+)=/g, function(match, attrName) {
            return span(attrName, "property") + "=";
        });
    } else if (lang === "css") {
        keywords = /\b(margin|padding|color|background|border|width|height|font|display|position|top|left|right|bottom|flex|grid|align|justify|opacity|radius)\b/g;
    } else if (lang === "bash" || lang === "shell" || lang === "sh") {
        keywords = /\b(if|then|else|elif|fi|case|esac|for|while|do|done|in|exit|return|local|export|alias|echo|printf|cd|pwd|ls|grep|sed|awk|cat|mkdir|rm|cp|mv|chmod|chown)\b/g;
        builtins = /\B\$\w+\b/g;
    }

    if (keywords) {
        tokenizedText = tokenizedText.replace(keywords, function(match) {
            return span(match, "keyword");
        });
    }
    if (types) {
        tokenizedText = tokenizedText.replace(types, function(match) {
            return span(match, "type");
        });
    }
    if (builtins) {
        tokenizedText = tokenizedText.replace(builtins, function(match) {
            return span(match, "builtin");
        });
    }

    // Highlight numerical constants
    var numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
    tokenizedText = tokenizedText.replace(numberRegex, function(match) {
        return span(match, "number");
    });

    // Restore comments and strings in their original positions
    var replaced = true;
    while (replaced) {
        replaced = false;
        tokenizedText = tokenizedText.replace(new RegExp(tokenPlaceholder + "(\\d+)___", "g"), function(match, idStr) {
            replaced = true;
            var id = parseInt(idStr);
            var tok = tokens[id];
            return span(tok.content, tok.type);
        });
    }

    return tokenizedText;
}

// Parses formatting inside list items, tables, paragraphs
function parseInline(text, highlightColorHex) {
    if (!text) return "";

    // Escape basic HTML elements first to avoid tags mess
    var s = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, function(match, code) {
        return "<code style=\"font-family: monospace; background-color: rgba(128,128,128,0.15); padding: 2px 4px; border-radius: 3px;\">" + code + "</code>";
    });

    // Bold formatting: **text** and __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");

    // Italic formatting: *text* and _text_
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Strikethrough formatting: ~~text~~
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    // Markdown Links: [label](url)
    var linkColor = highlightColorHex || "#2980b9";
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, label, url) {
        return "<a href=\"" + url + "\" style=\"color: " + linkColor + "; text-decoration: none;\">" + label + "</a>";
    });

    return s;
}

// Parses GitHub Flavored Markdown tables
function parseTable(tableLines, isDarkTheme, highlightColorHex) {
    if (tableLines.length === 0) return "";

    var borderColor = isDarkTheme ? "#3a3a3a" : "#cccccc";
    var html = "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" width=\"100%\" style=\"border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; border: 1px solid " + borderColor + ";\">";

    var hasHeader = false;
    var rows = [];

    for (var k = 0; k < tableLines.length; k++) {
        var line = tableLines[k].trim();
        if (line.startsWith("|")) line = line.substring(1);
        if (line.endsWith("|")) line = line.slice(0, -1);

        var cells = line.split("|");

        // Separator line: |---|---|
        if (k === 1 && cells.every(function(c) { return /^\s*:-*-*:?\s*$/.test(c) || /^\s*-+\s*$/.test(c); })) {
            hasHeader = true;
            continue;
        }

        rows.push(cells.map(function(c) { return c.trim(); }));
    }

    for (var r = 0; r < rows.length; r++) {
        var isHeaderRow = (r === 0 && hasHeader);
        var tag = isHeaderRow ? "th" : "td";
        var rowBg = "";
        if (isHeaderRow) {
            rowBg = " bgcolor=\"" + (isDarkTheme ? "#2e3032" : "#eaecf0") + "\"";
        } else if (r % 2 === 1) {
            rowBg = " bgcolor=\"" + (isDarkTheme ? "#282a2b" : "#f8f9fa") + "\"";
        }

        html += "<tr" + rowBg + ">";
        for (var c = 0; c < rows[r].length; c++) {
            var cellContent = parseInline(rows[r][c], highlightColorHex);
            var style = isHeaderRow ? "font-weight: bold; text-align: left;" : "";
            html += "<" + tag + " style=\"" + style + "\">" + cellContent + "</" + tag + ">";
        }
        html += "</tr>";
    }

    html += "</table>";
    return html;
}

// Main parser function that translates complete Markdown content into QML-compatible HTML RichText
function parseMarkdown(md, isDarkTheme, textColor, altBgColor, highlightColor) {
    if (!md) return "";

    var textColorHex = colorToHex(textColor);
    var altBgColorHex = colorToHex(altBgColor);
    var highlightColorHex = colorToHex(highlightColor);

    // Styling constants for block elements
    var codeBg = isDarkTheme ? "#1c1e1f" : "#f6f8fa";
    var codeBorder = isDarkTheme ? "#2e3132" : "#e1e4e8";
    var codeTextColor = isDarkTheme ? "#e3e8ec" : "#24292e";

    var lines = md.split(/\r?\n/);
    var html = "";
    var i = 0;

    var inList = false;
    var listType = ""; // "ul" or "ol"
    var inBlockquote = false;

    while (i < lines.length) {
        var line = lines[i];

        // --- Fenced Code Blocks ---
        if (line.trim().startsWith("```")) {
            var lang = line.trim().substring(3).trim();
            var codeContent = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeContent.push(lines[i]);
                i++;
            }
            if (i < lines.length) i++; // skip closing tag

            html += closeList();
            html += closeBlockquote();

            var rawCode = codeContent.join("\n");
            var highlighted = highlightCode(rawCode, lang, isDarkTheme);

            // Frame code block inside HTML table cell for background border/margins support in RichText
            html += "<table width=\"100%\" bgcolor=\"" + codeBg + "\" cellpadding=\"8\" style=\"margin-top: 4px; margin-bottom: 8px; border: 1px solid " + codeBorder + ";\">";
            html += "<tr><td><pre style=\"font-family: monospace; font-size: 11pt; color: " + codeTextColor + "; white-space: pre-wrap; margin: 0;\"><code>" + highlighted + "</code></pre></td></tr>";
            html += "</table>";
            continue;
        }

        // --- Horizontal Rules ---
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            html += closeList();
            html += closeBlockquote();
            html += "<hr color=\"" + codeBorder + "\"/>";
            i++;
            continue;
        }

        // --- Headers ---
        var headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
            html += closeList();
            html += closeBlockquote();
            var level = headerMatch[1].length;
            var headerText = headerMatch[2];
            
            // Map header level to font-sizes
            var size = "5";
            if (level === 1) size = "6";
            else if (level === 2) size = "5";
            else if (level === 3) size = "4";
            else size = "3";

            html += "<h" + level + " style=\"color: " + textColorHex + "; margin-top: 12px; margin-bottom: 4px;\"><font size=\"" + size + "\"><b>" + parseInline(headerText, highlightColorHex) + "</b></font></h" + level + ">";
            i++;
            continue;
        }

        // --- Blockquotes ---
        if (line.trim().startsWith(">")) {
            html += closeList();
            if (!inBlockquote) {
                var bqBorderColor = highlightColorHex;
                var bqBgColor = isDarkTheme ? "#2c2e30" : "#f1f3f5";
                html += "<table width=\"100%\" bgcolor=\"" + bqBgColor + "\" cellpadding=\"6\" style=\"margin-bottom: 8px; border-left: 4px solid " + bqBorderColor + ";\"><tr><td>";
                inBlockquote = true;
            }
            var quoteLine = line.trim().substring(1);
            if (quoteLine.startsWith(" ")) quoteLine = quoteLine.substring(1);
            html += parseInline(quoteLine, highlightColorHex) + "<br/>";
            i++;
            continue;
        } else if (inBlockquote && !line.trim().startsWith(">") && line.trim() !== "") {
            // Continuation of blockquote
            html += parseInline(line.trim(), highlightColorHex) + "<br/>";
            i++;
            continue;
        } else if (inBlockquote && line.trim() === "") {
            html += closeBlockquote();
            i++;
            continue;
        }

        // --- Lists ---
        var ulMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
        var olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

        if (ulMatch || olMatch) {
            var match = ulMatch || olMatch;
            var currentType = ulMatch ? "ul" : "ol";
            var itemText = match[3];

            html += closeBlockquote();

            if (!inList) {
                listType = currentType;
                html += "<" + listType + ">";
                inList = true;
            } else if (listType !== currentType) {
                html += "</" + listType + ">";
                listType = currentType;
                html += "<" + listType + ">";
            }

            html += "<li>" + parseInline(itemText, highlightColorHex) + "</li>";
            i++;
            continue;
        } else if (inList && line.trim() !== "" && !line.match(/^(\s*)([*+-]|\d+\.)\s+/)) {
            if (line.startsWith("    ") || line.startsWith("\t")) {
                html += " " + parseInline(line.trim(), highlightColorHex);
                i++;
                continue;
            } else {
                html += closeList();
            }
        } else if (inList && line.trim() === "") {
            html += closeList();
            i++;
            continue;
        }

        // --- Tables ---
        if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i+1].trim().startsWith("|")) {
            html += closeList();
            html += closeBlockquote();

            var tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                tableLines.push(lines[i]);
                i++;
            }

            html += parseTable(tableLines, isDarkTheme, highlightColorHex);
            continue;
        }

        // --- Empty Lines ---
        if (line.trim() === "") {
            html += closeList();
            html += closeBlockquote();
            i++;
            continue;
        }

        // --- Standard Paragraphs ---
        html += closeList();
        html += closeBlockquote();

        var paraLines = [line];
        i++;
        while (i < lines.length) {
            var nextLine = lines[i];
            if (nextLine.trim() === "" ||
                nextLine.trim().startsWith("```") ||
                /^(?:-{3,}|\*{3,}|_{3,})$/.test(nextLine.trim()) ||
                nextLine.match(/^(#{1,6})\s+/) ||
                nextLine.trim().startsWith(">") ||
                nextLine.match(/^(\s*)([*+-]|\d+\.)\s+/) ||
                nextLine.trim().startsWith("|")) {
                break;
            }
            paraLines.push(nextLine);
            i++;
        }

        html += "<p style=\"margin-top: 4px; margin-bottom: 6px; color: " + textColorHex + ";\">" + parseInline(paraLines.join(" "), highlightColorHex) + "</p>";
    }

    html += closeList();
    html += closeBlockquote();

    return html;

    function closeList() {
        if (inList) {
            inList = false;
            return "</" + listType + ">";
        }
        return "";
    }

    // Safely wraps up any open blockquotes at end of file/segment
    function closeBlockquote() {
        if (inBlockquote) {
            inBlockquote = false;
            return "</td></tr></table>";
        }
        return "";
    }
}
