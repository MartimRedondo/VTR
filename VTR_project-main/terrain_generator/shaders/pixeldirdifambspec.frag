#version 420

uniform vec3 l_dir;
uniform float timer;

// Uniforms controláveis
uniform float waterLevel = 0.3;
uniform float heightScale = 2.0;
uniform float ambientLight = 0.4;
uniform float fogIntensity = 0.005;
uniform float contrast = 1.0;

// Uniforms para água
uniform float waterTransparency = 0.7;
uniform float waterWaveSpeed = 1.0;
uniform float waterReflection = 0.4;

// Uniforms para texturas
uniform float textureScale = 8.0;
uniform float textureBlending = 1.0;

// Texturas do terreno
uniform sampler2D noise;
uniform sampler2D snowTexture;
uniform sampler2D rockTexture;
uniform sampler2D grassTexture;
uniform sampler2D sandTexture;

in Data {
    vec3 normal;
    vec3 worldPos;
    float isWater;
    float terrainHeight;
} DataIn;

out vec4 colorOut;

// Função noise simples para variações
float proceduralNoise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Função para calcular sombras direcionais baseadas na aula2
float calculateShadow(vec3 normal, vec3 lightDir, vec2 worldPos) {
    float NdotL = dot(normal, lightDir);
    
    if (NdotL <= 0.2) {
        return 0.3;
    } else if (NdotL >= 0.8) {
        return 1.3;
    } else {
        return mix(0.3, 1.3, (NdotL - 0.2) / 0.6);
    }
}

// Função para calcular fresnel effect
float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(dot(normalize(normal), normalize(viewDir)), 0.0), power);
}

// Função para fazer blend suave entre texturas
vec3 sampleTerrainTexture(vec2 texCoord, float height, float scaledWaterLevel, float contrast) {
    // Definir thresholds usando a mesma lógica do código original
    float beachThreshold = scaledWaterLevel + (0.15 * contrast);
    float sandThreshold = scaledWaterLevel + (0.25 * contrast);
    float grassThreshold = scaledWaterLevel + (1.8 * contrast);
    float forestThreshold = scaledWaterLevel + (2.8 * contrast);
    float rockThreshold = scaledWaterLevel + (4.5 * contrast);
    float snowThreshold = scaledWaterLevel + (6.5 * contrast);
    
    // Escala para as texturas (controlável via uniform)
    vec2 scaledTexCoord = texCoord * textureScale;
    
    // Sample todas as texturas
    vec3 sandColor = texture(sandTexture, scaledTexCoord).rgb;
    vec3 grassColor = texture(grassTexture, scaledTexCoord).rgb;
    vec3 rockColor = texture(rockTexture, scaledTexCoord * 0.5).rgb; // Rochas com escala diferente
    vec3 snowColor = texture(snowTexture, scaledTexCoord * 0.3).rgb; // Neve com escala diferente
    
    // Cores para transições especiais
    vec3 wetSandColor = sandColor * 0.7; // Areia molhada = areia mais escura
    
    vec3 finalColor;
    
    // Aplicar a mesma lógica de height-based blending
    if (height < beachThreshold) {
        finalColor = wetSandColor;
    } else if (height < sandThreshold) {
        float t = smoothstep(beachThreshold, sandThreshold, height);
        t = t * t * (3.0 - 2.0 * t);
        finalColor = mix(wetSandColor, sandColor, t);
    } else if (height < grassThreshold) {
        float t = smoothstep(sandThreshold, grassThreshold, height);
        t = t * t * (3.0 - 2.0 * t);
        finalColor = mix(sandColor, grassColor, t);
    } else if (height < forestThreshold) {
        float t = smoothstep(grassThreshold, forestThreshold, height);
        // Misturar grass com uma versão mais escura para simular floresta
        vec3 forestColor = grassColor * 0.6;
        finalColor = mix(grassColor, forestColor, t);
        
        // Adicionar variação usando noise
        float vegetationNoise = proceduralNoise(texCoord * 2.0) * 0.1;
        finalColor = mix(finalColor, finalColor * 0.8, vegetationNoise);
    } else if (height < rockThreshold) {
        float t = smoothstep(forestThreshold, rockThreshold, height);
        vec3 forestColor = grassColor * 0.6;
        finalColor = mix(forestColor, rockColor, t);
        
        // Adicionar variação rochosa
        float rockNoise = proceduralNoise(texCoord * 3.0) * 0.15;
        finalColor = mix(finalColor, finalColor * 0.7, rockNoise);
    } else if (height < snowThreshold) {
        float t = smoothstep(rockThreshold, snowThreshold, height);
        vec3 darkRockColor = rockColor * 0.7;
        finalColor = mix(rockColor, darkRockColor, t);
        
        // Rochas mais escuras com mais contraste
        float darkRockNoise = proceduralNoise(texCoord * 4.0) * 0.2;
        finalColor = mix(finalColor, finalColor * 0.6, darkRockNoise);
    } else {
        float t = smoothstep(snowThreshold, snowThreshold + 2.0, height);
        vec3 darkRockColor = rockColor * 0.7;
        finalColor = mix(darkRockColor, snowColor, t);
    }
    finalColor = mix(finalColor, finalColor * 0.8, (1.0 - textureBlending));
    return finalColor;
}

void main() {
    float h = DataIn.terrainHeight;
    
    // Usar escala EXATAMENTE igual ao geometry shader
    float scaledWaterLevel = waterLevel * heightScale * 4.0;
    float distanceFromWater = h - scaledWaterLevel;
    float shorlineZone = 0.1;
    
    bool isWater = (DataIn.isWater > 0.5);
    bool isShoreline = (!isWater) && (distanceFromWater > 0.0) && (distanceFromWater < shorlineZone);
    
    vec3 color;
    float finalAlpha = 1.0;
    vec3 finalNormal = normalize(DataIn.normal);
    
    if (isWater) {
        // === ÁGUA SEM TEXTURA (cores procedurais) ===
        finalNormal = vec3(0.0, 1.0, 0.0);
        
        // Posição da água para variação de cor
        vec2 waterPos = DataIn.worldPos.xz;
        
        // Cores base da água
        vec3 deepWater = vec3(0.15, 0.25, 0.35);
        vec3 mediumWater = vec3(0.2, 0.3, 0.4);
        vec3 shallowWater = vec3(0.25, 0.35, 0.45);
        
        // Água com variação de profundidade natural usando noise
        float depthNoise = proceduralNoise(waterPos * 0.5) * 0.5 + proceduralNoise(waterPos * 1.0) * 0.3;
        
        // Cor base da água
        vec3 waterColor = mix(deepWater, mediumWater, depthNoise);
        waterColor = mix(waterColor, shallowWater, depthNoise * 0.7);
        
        finalAlpha = waterTransparency;
        
        // Iluminação da água (mesma lógica original)
        vec3 nn = normalize(finalNormal);
        vec3 l = normalize(l_dir);
        float i = max(0, dot(l, nn));
        
        vec3 e = normalize(-DataIn.worldPos);
        vec4 spec = vec4(0);
        
        if (i > 0) {
            vec3 h = normalize(l + e);
            float c = max(0, dot(h, nn));
            spec = vec4(1) * pow(c, waterReflection);
        }
        
        vec4 diffuse = vec4(waterColor, 1.0);
        color = (max(i, 0.25) * diffuse + spec).rgb;
    }
    else {
        // === TERRENO COM TEXTURAS ===
        
        // Coordenadas de textura baseadas na posição mundial
        vec2 terrainTexCoord = DataIn.worldPos.xz * 0.1;

        //float distanceFromCamera = length(DataIn.worldPos);
        //float adaptiveScale = textureScale * (1.0 + distanceFromCamera * 0.01);
        
        // Sample a textura do terreno baseado na altura
        color = sampleTerrainTexture(terrainTexCoord, h, scaledWaterLevel, contrast);
        //color = sampleTerrainTexture(terrainTexCoord * adaptiveScale, h, scaledWaterLevel, contrast);
        //float antiAliasFactor = smoothstep(10.0, 50.0, distanceFromCamera);
        //color = mix(color, color * 0.9, antiAliasFactor * 0.3);     
        
        // Efeito de umidade próximo à água
        float moistureZone = 0.08;
        float moistureEffect = 1.0;
        if (distanceFromWater < moistureZone) {
            float moistureFactor = smoothstep(moistureZone, 0.0, distanceFromWater);
            moistureFactor = moistureFactor * moistureFactor;
            moistureEffect = mix(1.0, 0.85, moistureFactor * 0.3);
        }
        
        color *= moistureEffect;
        finalAlpha = 1.0;
    }
    
    // === ILUMINAÇÃO DIRECIONAL (mantida igual) ===
    vec3 lightDir = normalize(-l_dir);
    vec3 viewDir = normalize(-DataIn.worldPos);
    
    float ambient = ambientLight * 0.2;
    float NdotL = max(dot(finalNormal, lightDir), 0.0);
    float diffuse = NdotL;
    
    float shadowFactor = calculateShadow(finalNormal, lightDir, DataIn.worldPos.xz);
    diffuse *= shadowFactor;
    
    // Componente especular para terreno seco
    float specular = 0.0;
    if (!isWater && !isShoreline && NdotL > 0.0) {
        vec3 reflectDir = reflect(-lightDir, finalNormal);
        float RdotV = max(dot(reflectDir, viewDir), 0.0);
        
        if (h > scaledWaterLevel + (6.5 * contrast)) { // Snow
            specular = pow(RdotV, 32.0) * 0.3;
        } else if (h > scaledWaterLevel + (4.5 * contrast)) { // Rock
            specular = pow(RdotV, 16.0) * 0.1;
        }
        specular *= shadowFactor;
    }
    
    float lightIntensity = ambient + diffuse * 1.8 + specular;
    lightIntensity = max(lightIntensity, 0.15);
    
    vec3 finalColor = color * lightIntensity;
    
    // Fog atmosférico
    float distance = length(DataIn.worldPos);
    float fogFactor = exp(-distance * fogIntensity * 0.5);
    fogFactor = max(fogFactor, 0.7);
    vec3 fogColor = vec3(0.8, 0.85, 0.9);
    finalColor = mix(fogColor, finalColor, fogFactor);
    
    colorOut = vec4(finalColor, finalAlpha);
}