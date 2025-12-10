#version 330

layout(points) in;
layout(triangle_strip, max_vertices=4) out; // Apenas água

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
    float isWater;
    float terrainHeight;
} DataOut;

void main() {
    vec4 pos = gl_in[0].gl_Position;
    float cellSize = 0.15;
    float texelSize = 1.0 / 512.0;
    
    vec4 vertices[4];
    float heights[4];
    
    // Offsets para os quatro cantos da célula
    vec2 offsets[4] = vec2[4](
        vec2(0.0, 0.0),         // 0: bottom-left
        vec2(cellSize, 0.0),    // 1: bottom-right
        vec2(0.0, cellSize),    // 2: top-left
        vec2(cellSize, cellSize) // 3: top-right
    );
    
    // Calcular posições e alturas
    for (int i = 0; i < 4; i++) {
        vec2 texCoord = (vec2(pos.x, pos.z) + offsets[i]) * noiseScale + 0.5;
        texCoord = clamp(texCoord, 0.0, 1.0);
        
        float height = texture(noise, texCoord).r * heightScale * 4.0;
        heights[i] = height;
        
        vertices[i] = vec4(
            pos.x + offsets[i].x,
            height,
            pos.z + offsets[i].y,
            1.0
        );
    }
      // Verificar se precisa de água
    int underwaterVertices = 0;
    float scaledWaterLevel = waterLevel * heightScale * 4.0;
    
    for (int i = 0; i < 4; i++) {
        if (heights[i] < scaledWaterLevel) {
            underwaterVertices++;
        }
    }
      // SEMPRE renderizar água para debug - deve aparecer como uma superfície azul
    bool shouldRenderWater = true; // FORÇAR ÁGUA SEMPRE PARA DEBUG
    
    if (shouldRenderWater) {
        // Criar vértices de água no nível da água
        vec4 waterVertices[4];
        for (int i = 0; i < 4; i++) {
            waterVertices[i] = vec4(
                pos.x + offsets[i].x,
                scaledWaterLevel + 0.002, // Ligeiramente mais alto para garantir visibilidade
                pos.z + offsets[i].y,
                1.0
            );
        }
        
        // ÁGUA - triangle strip
        int order[4] = int[4](0, 1, 2, 3);
        
        for (int i = 0; i < 4; i++) {
            int idx = order[i];
            
            gl_Position = m_pvm * waterVertices[idx];
            DataOut.terrainHeight = scaledWaterLevel;
            DataOut.normal = vec3(0.0, 1.0, 0.0);
            DataOut.worldPos = waterVertices[idx].xyz;
            DataOut.isWater = 1.0;
            
            EmitVertex();
        }
        EndPrimitive();
    }
}
