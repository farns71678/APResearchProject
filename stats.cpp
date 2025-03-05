#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cmath>

struct blockchain_data {
    int userSize, chainSize, blockNum;
    std::string alg;
    
    blockchain_data(int users, int size, int blocks, std::string a) {
        this->userSize = users;
        this->chainSize = size;
        this->blockNum = blocks;
        this->alg = a;
    }
};

struct stat_data {
    double mean, standardDeviation;
    int size;

    stat_data(double m, double sd, int s) {
        this->mean = m;
        this->standardDeviation = sd;
        this->size = s;
    }
};

stat_data calcStats(std::string type, int userSize, std::vector<blockchain_data> &rows);

int main() {
    std::string line;
    std::fstream file("blockchainData.csv");
    std::ofstream out("./stats.txt");

    if (!out.is_open()) std::cout << "Couldn't open out file.\n";

    if (!file.is_open()) {
        out << "Unable to open file\n";
    }
    else {
        std::vector<blockchain_data> rows{};
        getline(file, line);
        while (getline(file, line)) {
            int users, size, num;
            std::string alg;
            std::string input;
            std::istringstream stream(line);
            getline(stream, input, ',');
            users = std::stoi(input);
            getline(stream, alg, ',');
            getline(stream, input, ',');
            size = std::stoi(input);
            getline(stream, input, ',');
            num = std::stoi(input);

            rows.push_back(blockchain_data(users, size, num, alg));
        }

        /*for (auto row : rows) {
            out << row.userSize << "," << row.chainSize << "," << row.alg << "," << row.blockNum << std::endl;
        }*/

        // print stats 
        std::vector<std::string> algs{};
        std::vector<int> sizes;

        for (int i = 0; i < rows.size(); i++) {
            if (std::find(algs.begin(), algs.end(), rows[i].alg) != algs.end()) {
                algs.push_back(rows[i].alg);
            }
            if (std::find(sizes.begin(), sizes.end(), rows[i].userSize) != sizes.end()) {
                sizes.push_back(rows[i].userSize);
            }
        }

        for (int i = 0; i < algs.size(); i++) {
            for (int j = 0; j < sizes.size(); j++) {
                stat_data stats = calcStats(algs[i], sizes[i], rows);
                out << "User Size:\t\033[96m" << sizes[i] << "\033[0m\nAlgorithm:\t\033[96m" << algs[i] << "\033[0m\nMean:\t\033[96m" << stats.mean << "\033[0m\nStandard Deviation:\t\033[96m" << stats.standardDeviation << "\033[0m\nRows:\t\033[96m" << stats.size << "\033[0m\n\n";
            }
        }

        file.close();
    }

    if (out.is_open()) out.close();
    return 0;
}

/// @brief averages chain sizes of the same compression type and user pool size
/// @param type string representation of algorithm type
/// @param userSize user pool size
/// @param rows reference to CSV data
/// @return an instance of stat_data
stat_data calcStats(std::string type, int userSize, std::vector<blockchain_data> &rows) {
    double total = 0;
    int count = 0;

    for (auto &row : rows) {
        if (row.alg == type && row.userSize == userSize) {
            total += row.chainSize;
            count++;
        }
    }
    double mean = total / count;

    // calculate standard deviation
    total = 0;
    for (auto &row : rows) {
        if (row.alg == type && row.userSize == userSize) {
            total += (row.chainSize - mean) * (row.chainSize - mean);
        }
    }

    double sd = std::sqrt(total / mean);

    return stat_data(mean, sd, count);
}