#include <iostream>
#include <fstream>
#include <chrono>
#include "noise_generator.h"

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <output_filename>" << std::endl;
        return 1;
    }

    // Create a noise generator with a random seed based on current time
    unsigned int seed = std::chrono::system_clock::now().time_since_epoch().count();

    // seed = 12345; // Testing with a fixed seed

    NoiseGenerator noiseGen(seed);
    
    // Parameters for the heightmap
    const int width = 256;
    const int height = 256;
    const double scale = 0.05;  // Adjust this to change the frequency of the noise
    const int octaves = 6;      // Number of octaves for the octave noise
    const double persistence = 0.5; // Persistence for the octave noise
    
    // Create a heightmap
    std::vector<std::vector<double>> heightmap(height, std::vector<double>(width));
    
    // Generate the heightmap using octave noise for more realistic terrain
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // Generate noise value between 0 and 1
            double value = noiseGen.octaveNoise(
                x * scale, 
                y * scale,
                octaves,
                persistence 
            );
            
            // Normalize to 0-1 range
            value = (value + 1.0) * 0.5;
            heightmap[y][x] = value;
        }
    }
    
    // Save the heightmap as a PGM file for visualization
    std::ofstream file(argv[1]);
    file << "P2\n" << width << " " << height << "\n255\n";
    
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            file << static_cast<int>(heightmap[y][x] * 255) << " ";
        }
        file << "\n";
    }
    
    file.close();
    std::cout << "Heightmap has been generated and saved as '" << argv[1] << "'" << std::endl;
    std::cout << "Using seed: " << seed << std::endl;
    
    return 0;
} 