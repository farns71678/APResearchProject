#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cmath>

/// @brief struct for data from blockchainData.csv
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
    double mean, standardDeviation, meanBlock;
    int size, rows, blocks;
    std::string alg;

    stat_data(double m, double sd, double mb, int s, int r, int b, std::string a) {
        this->mean = m;
        this->standardDeviation = sd;
        this->meanBlock = mb;
        this->size = s;
        this->rows = r;
        this->blocks = b;
        this->alg = a;
    }
};

stat_data* calcStats(std::string type, int userSize, std::vector<blockchain_data> &rows);

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
            if (std::find(algs.begin(), algs.end(), rows[i].alg) == algs.end()) {
                algs.push_back(rows[i].alg);
            }
            if (std::find(sizes.begin(), sizes.end(), rows[i].userSize) == sizes.end()) {
                sizes.push_back(rows[i].userSize);
            }
        }

        std::vector<stat_data*> statRows{};
        for (int i = 0; i < algs.size(); i++) {
            for (int j = 0; j < sizes.size(); j++) {
                statRows.push_back(calcStats(algs[i], sizes[j], rows));
                /*if (stats != nullptr) {
                    std::cout << "User Size:\t\t\033[96m" << sizes[j] << "\033[0m\nAlgorithm:\t\t\033[96m" << algs[i] << "\033[0m\nMean:\t\t\t\033[96m" << stats->mean << "\033[0m\nStandard Deviation:\t\033[96m" << stats->standardDeviation << "\033[0m\nRows:\t\t\t\033[96m" << stats->size << "\033[0m\n\n";
                    out << "User Size:\t\t\t" << sizes[j] << "\nAlgorithm:\t\t\t" << algs[i] << "\nMean:\t\t\t\t" << stats->mean << "\nStandard Deviation:\t" << stats->standardDeviation << "\nRows:\t\t\t\t" << stats->size << "\n\n";
                    delete stats;
                }*/
            }
        }

        std::vector<std::pair<int,int>> controlSizes{};
        for (int i = 0; i < sizes.size(); i++) {
            for (int j = 0; j < statRows.size(); j++) {
                if (statRows[j]->size == sizes[i] && statRows[j]->alg == "none") controlSizes.push_back(std::pair<int, int>(sizes[i], statRows[j]->mean));
            }
        }

        for (auto row : statRows) {
            if (row != nullptr) {
                std::cout << "User Size:\t\t\033[96m" << row->size << "\033[0m\nAlgorithm:\t\t\033[96m" << row->alg << "\033[0m\nMean:\t\t\t\033[96m" << row->mean << "\033[0m\nStandard Deviation:\t\033[96m" << row->standardDeviation << "\033[0m\nBlocks:\t\t\t\033[96m" << row->blocks << "\033[0m\nMean Block Size:\t\033[96m" << row->meanBlock << "\033[0m\nRows:\t\t\t\033[96m" << row->rows << "\033[0m\n";
                out << "User Size:\t\t\t" << row->size << "\nAlgorithm:\t\t\t" << row->alg << "\nMean:\t\t\t\t" << row->mean << "\nStandard Deviation:\t" << row->standardDeviation<< "\nBlocks:\t\t\t\t" << row->blocks << "\nMean Block Size:\t" << row->meanBlock << "\nRows:\t\t\t\t" << row->rows << "\n";

                for (auto controlSize : controlSizes) {
                    if (controlSize.first == row->size) {
                        std::cout << "Compression:\t\t\033[96m" << (100.0 / controlSize.second * row->mean) << "%\033[0m\n\n";
                        out << "Compression:\t\t" << (100.0 / controlSize.second * row->mean) << "%\n\n";
                    }
                }

                delete row;
                row = nullptr;
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
stat_data* calcStats(std::string type, int userSize, std::vector<blockchain_data> &rows) {
    double total = 0;
    int count = 0;
    double blockTotal = 0;

    for (auto &row : rows) {
        if (row.alg == type && row.userSize == userSize) {
            total += row.chainSize;
            blockTotal += row.blockNum;
            count++;
        }
    }

    if (count == 0) return nullptr;
    const double mean = total / count;

    // calculate standard deviation
    total = 0;
    for (auto &row : rows) {
        if (row.alg == type && row.userSize == userSize) {
            total += (row.chainSize - mean) * (row.chainSize - mean);
        }
    }

    double sd = std::sqrt(total / mean);

    return new stat_data(mean, sd, mean / (blockTotal / count), userSize, count, (int)(blockTotal / count), type);
}