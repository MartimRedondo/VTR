#ifndef NOISE_GENERATOR_H
#define NOISE_GENERATOR_H

#include <vector>
#include <random>
#include <cmath>
#include <algorithm>


class NoiseGenerator {
private:
    std::vector<int> permutation;
    std::vector<int> p;
    
    double fade(double t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    double lerp(double t, double a, double b) {
        return a + t * (b - a);
    }
    
    double grad(int hash, double x, double y, double z) {
        int h = hash & 15;
        double u = h < 8 ? x : y;
        double v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

public:
    NoiseGenerator(unsigned int seed = 0) {
        // Initialize permutation table
        permutation.resize(256);
        for (int i = 0; i < 256; i++) {
            permutation[i] = i;
        }
        
        // Shuffle permutation table
        std::mt19937 gen(seed);
        std::shuffle(permutation.begin(), permutation.end(), gen);
        
        // Duplicate permutation table
        p.resize(512);
        for (int i = 0; i < 256; i++) {
            p[i] = permutation[i];
            p[i + 256] = permutation[i];
        }
    }
    
    double noise(double x, double y, double z) {
        // Find unit cube that contains point
        int X = (int)floor(x) & 255;
        int Y = (int)floor(y) & 255;
        int Z = (int)floor(z) & 255;
        
        // Find relative x, y, z of point in cube
        x -= floor(x);
        y -= floor(y);
        z -= floor(z);
        
        // Compute fade curves for each of x, y, z
        double u = fade(x);
        double v = fade(y);
        double w = fade(z);
        
        // Hash coordinates of the 8 cube corners
        int A = p[X] + Y;
        int AA = p[A] + Z;
        int AB = p[A + 1] + Z;
        int B = p[X + 1] + Y;
        int BA = p[B] + Z;
        int BB = p[B + 1] + Z;
        
        // Add blended results from 8 corners of the cube
        return lerp(w,
            lerp(v,
                lerp(u,
                    grad(p[AA], x, y, z),
                    grad(p[BA], x - 1, y, z)
                ),
                lerp(u,
                    grad(p[AB], x, y - 1, z),
                    grad(p[BB], x - 1, y - 1, z)
                )
            ),
            lerp(v,
                lerp(u,
                    grad(p[AA + 1], x, y, z - 1),
                    grad(p[BA + 1], x - 1, y, z - 1)
                ),
                lerp(u,
                    grad(p[AB + 1], x, y - 1, z - 1),
                    grad(p[BB + 1], x - 1, y - 1, z - 1)
                )
            )
        );
    }
    
    // Generate 2D noise (useful for heightmaps)
    double noise2D(double x, double y) {
        return noise(x, y, 0.0);
    }
    
    // Generate octave noise (multiple layers of noise for more detail)
    double octaveNoise(double x, double y, int octaves, double persistence) {
        double total = 0;
        double frequency = 1;
        double amplitude = 1;
        double maxValue = 0;
        
        for (int i = 0; i < octaves; i++) {
            total += noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
};

#endif // NOISE_GENERATOR_H 