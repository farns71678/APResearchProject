#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

int main() {
    const std::string fileName = "femaleNames.csv";
    std::string line = "";
    std::fstream file(fileName);
    
    if (!file.is_open()) {
        std::cout << "Couldn't open input file.\n";
    }
    else {
        try {
            std::vector<std::string> names{};
            std::vector<size_t> nums{};
            while (getline(file, line)) {
                std::istringstream stream(line);
                getline(stream, line, ',');
                std::string name;
                size_t num;
                getline(stream, name, ',');
                getline(stream, line, ',');
                num = std::stoull(line);
                names.push_back(name);
                nums.push_back(num);
            }
            file.close();

            std::ofstream out(fileName);
            if (!out.is_open()) {
                std::cout << "Couldn't open out file.\n";
            }
            else {
                try {
                    for (int i = 0; i < names.size(); i++) {
                        out << names[i] << "," << nums[i] << "\n";
                    }
                }
                catch(std::exception &exc) {
                    std::cout << "An unexpected error has occured: " << exc.what() << "\n";
                }

                out.close();
            }


        }
        catch (std::exception &exc) {
            std::cout << "An unexpected error has occured: " << exc.what() << "\n";
        }

        if (file.is_open()) file.close();
    }

    return 0;
}