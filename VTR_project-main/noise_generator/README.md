# Terrain Generator


## Description

This project was developed as part of the Real Time Visualisation course within the Master's in Software Engineering at the University of Minho.

The objective of this project is to generate a terrain based on an existing terrain algorithm.


## Group 1

Francisco Afonso - PG57873

Jéssica Cunha - A100901

Martim Redondo - PG57889


## Terrain Generation

The terrain generation algorithms are based on noise images representing height maps.
These maps will give an natural aspect to the terrain.

There are some famous and explored algorithms to generate noise, between them the following:

| **Algorithm**                  | **Speed**          | **Quality**          | **Memory Requirements** |
|----------------------------|---------------|------------------|---------------------|
| Diamond-Square Algorithm  | Very Fast     | Moderate        | High               |
| Value Noise               | Slow - Fast  | Low - Moderate | Very Low           |
| Perlin Noise              | Moderate      | High            | Low                |
| Simplex Noise             | Moderate    | Very High       | Low                |
| Worley Noise              | Variable      | Unique          | Variable           |


The applied algorithm is **Pelin Noise** due to it's simplicity, low memory requirements and high quality.

## Run options

The project has a *Makefile* to make the process easier.

In order to compile the project files needed and the executable file it's possible to run the `make` command.

After the build creation, the `make run` command will run the executable file.

At least, it's possible to use `make display` to show the image.
