CXX = g++
CXXFLAGS = -Wall -Wextra -O2
LDFLAGS = 

SRCS = src/main.cpp
OBJS = $(SRCS:src/%.cpp=$(BUILD)/%.o)

TARGET = $(BUILD)/noise_generator
BUILD = build
OUTPUT_FILE = $(BUILD)/heightmap.pgm

all: $(BUILD) $(TARGET)

$(BUILD):
	mkdir -p $(BUILD)

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $(TARGET) $(LDFLAGS)

$(BUILD)/%.o: src/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -rf $(BUILD)

run: $(TARGET)
	$(TARGET) $(OUTPUT_FILE)

display: run
	@if [ "$(shell uname)" = "Darwin" ]; then \
		open $(OUTPUT_FILE); \
	else \
		display $(OUTPUT_FILE); \
	fi

.PHONY: all clean run display 