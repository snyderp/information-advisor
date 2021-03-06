if ('ppi' in window.ia === false) {
    window.ia.ppi = {};
}

(function (ns) {

    var PpiCheck = function (title, test_callback) {
            return {
                title: title,
                check: function (value) {
                    return test_callback(value);
                }
            };
        },
        regex_rule_gen = function (a_regex) {

            return function (value) {

                var regex_match,
                    regex_matches = [];

                while (regex_match = a_regex.exec(value)) {

                    if (regex_match[1]) {
                        regex_matches.push(regex_match[1]);
                    }
                }

                return regex_matches;
            };
        },
        data_checker_gen = function (data_set) {

            var i, escape_index,
                num_data = data_set.length,
                // Convert the list of strings into a set of regexes, so that
                // we can do case comparison easier
                data_regexes = [],
                escape_chars = ['.', '(', ')'],
                an_escape_char,
                data_escaped;

            for (i = 0; i < num_data; i += 1) {
                data_escaped = data_set[i];

                for (escape_index in escape_chars) {
                    an_escape_char = escape_chars[escape_index];
                    data_escaped = data_escaped.replace(an_escape_char, '\\' + an_escape_char);
                }

                data_regexes.push(new RegExp("(?:\\s|^)" + data_escaped + '(?:\\s|$)', 'i'));
            }

            return function (value) {

                var index,
                    regex_match,
                    current_regex;

                for (index in data_regexes) {

                    current_regex = data_regexes[index];
                    regex_match = current_regex.exec(value);

                    if (regex_match) {
                        return [$.trim(regex_match[0])];
                    }
                }

                return [];
            };
        },
        ppi = ns.ppi,
        data = ns.data;

    ppi.collection = [];

    ppi.collection.push(PpiCheck("Year", (function () {

        var year_regex = /(?:\D|^)(\d{4})(?:\D|$)/g;

        return function (value) {

            var regex_match,
                regex_matches = [],
                year;

            while (regex_match = year_regex.exec(value)) {

                year = regex_match[1];
                if (year.length === 4 && year > 1900 && year < 2020) {
                    regex_matches.push(regex_match[1]);
                }
            }

            return regex_matches;
        };
    }())));

    ppi.collection.push(PpiCheck("Cities", data_checker_gen(data.cities)));
    ppi.collection.push(PpiCheck("States", data_checker_gen(data.states)));
    ppi.collection.push(PpiCheck("Majors and Minors", data_checker_gen(data.majors)));
    ppi.collection.push(PpiCheck("Faculty", data_checker_gen(data.faculty)));
    ppi.collection.push(PpiCheck("Building (Full)", data_checker_gen(data.buildings_long)));
    ppi.collection.push(PpiCheck("Gender", data_checker_gen(['male', 'female', 'transgendered'])));

    ppi.collection.push(PpiCheck("GPA", (function () {

        var gpa_regex = /(?:\D|^)(\d\.\d{1,2})(?:\D|$)/g;

        return function (value) {

            var regex_match,
                regex_matches = [],
                float_version,
                match;

            while (regex_match = gpa_regex.exec(value)) {

                float_version = +regex_match[1];

                // Only accept year matches that have a non-digit before or
                // after the year.
                if (float_version > 0 && float_version < 5.01 && regex_match[0].length > 3) {
                    regex_matches.push(regex_match[1]);
                }
            }

            return regex_matches;
        };
    }())));

    ppi.collection.push(PpiCheck("Class Number", regex_rule_gen(/(?:\s|^)([A-Z]{2,4}\s?\d{3})(?:\s|$|\W)/ig)));
    ppi.collection.push(PpiCheck("Class Year", regex_rule_gen(/(?:\s|^)(sophmore|senior|junior|freshman)(?:\s|$|\W)/ig)));
    ppi.collection.push(PpiCheck("Sexual Orientation", regex_rule_gen(/(?:\s|^)(gay|straight|bisexual)(?:\s|$|\W)/gi)));
    ppi.collection.push(PpiCheck("Season", regex_rule_gen(/(?:\s|^)(fall|autumn|spring|summer|winter)(?:\s|$|\W)/gi)));
    ppi.collection.push(PpiCheck("Letter Grade", regex_rule_gen(/(?:\s|^)(A[+\-]|B[+\-]?)(?:\s|$|\W)/gi)));
    ppi.collection.push(PpiCheck("Building (Abbr)", (function () {

        var abbr_regexes = [],
            key;

        for (key in data.buildings_short) {
            abbr_regexes.push(new RegExp("(?:\\s|^)(" + data.buildings_short[key] + ")(?:\\s|$|\\d)", "i"));
        }

        return function (value) {

            var regex_key,
                regex_match;

            for (regex_key in abbr_regexes) {

                regex_match = abbr_regexes[regex_key].exec(value);

                if (regex_match && regex_match[1]) {
                    return [regex_match[1]];
                }
            }

            return [];
        };
    }())));

    ppi.find_ppi = function (text) {

        var ppi_check,
            index,
            found_ppi,
            matches = {};

        for (index in ppi.collection) {

            ppi_check = ppi.collection[index];
            found_ppi = ppi_check.check(text);

            if (found_ppi.length > 0) {

                // Class numbers and building abbreviations with room numbers
                // look very similar, so to avoid double counting the same
                // item, kick out the "Class Number" match if we get
                // a Building abbr match

                matches[ppi_check.title] = found_ppi;

                if (ppi_check.title === "Building (Abbr)" && "Class Number" in matches) {
                    delete ppi_check["Class Number"];
                }
            }
        }

        return matches;
    };

}(window.ia));
