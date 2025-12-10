#version 330

layout(points) in;
layout(triangle_strip, max_vertices=8) out; // Apenas terreno com faces duplas

uniform sampler2D noise;
uniform mat4 m_pvm;
uniform mat4 m_view;
uniform mat4 m_normal;
uniform float timer;
uniform float heightScale = 2;
uniform float noiseScale = 0.01;
uniform float waterLevel = 0.3;

out Data {
    vec3 normal;
    vec3 worldPos;
    float isWater; // Nova variável para identificar água explicitamente
    float terrainHeight; // Altura original do terreno (sempre preservada)
} DataOut;

// Função de cálculo de normais refinada
vec3 calculateNormal(vec2 texCoord, float texelSize) {
    float scale = heightScale * 4.0;
    
    float left  = texture(noise, texCoord + vec2(-texelSize, 0.0)).r * scale;
    float right = texture(noise, texCoord + vec2(texelSize, 0.0)).r * scale;
    float down  = texture(noise, texCoord + vec2(0.0, -texelSize)).r * scale;
    float up    = texture(noise, texCoord + vec2(0.0, texelSize)).r * scale;
    
    float dX = (right - left) * 0.5;
    float dZ = (up - down) * 0.5;
    
    vec3 normal = normalize(vec3(-dX, 2.0, -dZ));
    return normal;
}

void main() {
    vec4 pos = gl_in[0].gl_Position;
    float cellSize = 0.15;
    float texelSize = 1.0 / 512.0;
    
    vec4 vertices[4];
    vec3 normals[4];
    float heights[4];
    
    // Offsets para os quatro cantos da célula
    vec2 offsets[4] = vec2[4](
        vec2(0.0, 0.0),         // 0: bottom-left
        vec2(cellSize, 0.0),    // 1: bottom-right
        vec2(0.0, cellSize),    // 2: top-left
        vec2(cellSize, cellSize) // 3: top-right
    );
    
    // Calcular alturas e vértices
    float avgHeight = 0.0;
    for (int i = 0; i < 4; i++) {
        vec2 samplePos = (pos.xz + offsets[i].xy) * noiseScale;
        float heightValue = texture(noise, samplePos).r;
        heights[i] = heightValue * heightScale * 4.0;
        avgHeight += heights[i];
        
        normals[i] = calculateNormal(samplePos, texelSize);
        
        vertices[i] = vec4(
            pos.x + offsets[i].x, 
            heights[i],
            pos.z + offsets[i].y,
            1.0
        );
    }
    avgHeight /= 4.0;
    
    // Determinar se este patch precisa de água
    int underwaterVertices = 0;
    float scaledWaterLevel = waterLevel * heightScale * 4.0;
    
    // Contar vértices submersos
    for (int i = 0; i < 4; i++) {
        if (heights[i] < scaledWaterLevel) {
            underwaterVertices++;
        }
    }

    
    // RENDERIZAR TERRENO (sempre terreno, nunca água)
    // PRIMEIRA PASSAGEM: Front faces 
    int frontOrder[4] = int[4](0, 2, 1, 3);
    
    for (int i = 0; i < 4; i++) {
        int idx = frontOrder[i];
        
        gl_Position = m_pvm * vertices[idx];
        
        DataOut.terrainHeight = heights[idx];
        DataOut.normal = normalize(normals[idx]);
        DataOut.worldPos = vertices[idx].xyz;
        DataOut.isWater = 0.0; // Terreno sempre é terreno
        
        EmitVertex();
    }
    EndPrimitive();
    
    // SEGUNDA PASSAGEM: Back faces
    int backOrder[4] = int[4](0, 1, 2, 3);
    
    for (int i = 0; i < 4; i++) {
        int idx = backOrder[i];
        
        gl_Position = m_pvm * vertices[idx];
        
        DataOut.terrainHeight = heights[idx];
        DataOut.normal = normalize(-normals[idx]);
        DataOut.worldPos = vertices[idx].xyz;
        DataOut.isWater = 0.0; // Terreno sempre é terreno
        
        EmitVertex();
    }
    EndPrimitive();
}