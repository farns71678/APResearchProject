#include <iostream>
#include <fstream>
#include <string>
#include <cstring>
#include <regex>
#include <algorithm>

int main() {
    std::string line = "";
    std::fstream file("./lastNames.html");
    std::ofstream out;

    out.open("./lastNames.csv", std::ios_base::app);

    if (!file.is_open() || !out.is_open()) {
        std::cout << "Couldn't open a file. \n";
        if (file.is_open()) file.close();
        if (out.is_open()) out.close();
    }
    else {
        try {
            int matches = 0;
            const std::string compare = "                    <td class=\"whitespace-nowrap py-4 pl-4 pr-3 text-base text-left text-gray-900\"><a href=\"/last-names/";
            const int compareSize = compare.size();
            while (getline(file, line)) {
                if (line.size() > compareSize && line.substr(0, compareSize) == compare) {
                    // has line information - use reg ex to find information
                    std::string data = line;
                    getline(file, line);
                    data.append(line);
                    std::smatch match;
                    std::regex exp("<a href=\"/last-names/[^-<>/]+-surname-popularity/\">([^<>/]+)</a></td> +<td class=\"whitespace-nowrap py-4 pl-4 pr-3 text-base text-left text-gray-900\">((,|\\d)+)</td>");
                    if (std::regex_search(data, match, exp)) {
                        matches++;
                        std::string numStr = match[2];
                        numStr.erase(std::remove(numStr.begin(), numStr.end(), ','), numStr.end());
                        uint32_t num = std::stoi(numStr);
                        out << match[1] << "," << num << "\n";
                    }
                    else {
                        std::string data = line;
                        getline(file, line);
                        data.append(line);
                        //std::cout << data << std::endl;
                    }
                }
            }
            std::cout << matches << std::endl;
        }
        catch (std::exception &exc) {
            std::cout << "An unexpeced error occured: \n" << exc.what();
        }

        file.close();
        out.close();
    }

    return 0;
}